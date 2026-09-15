// convex/creatorHub.ts

import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

// ── Helper d'Authentification ──────────────────────────────────────────────────
async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity)
    throw new ConvexError({
      message: "Non authentifié",
      code: "UNAUTHENTICATED",
    });
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
  if (!user)
    throw new ConvexError({
      message: "Utilisateur introuvable",
      code: "NOT_FOUND",
    });
  return user;
}

// ── Requêtes ──────────────────────────────────────────────────────────────────

/**
 * Récupère la liste des défis (challenges) de création actifs.
 */
export const listChallenges = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("creatorChallenges")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .take(20);
  },
});

/**
 * Récupère les participations à des défis pour l'utilisateur spécifié par son email.
 */
export const getMyParticipations = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) return [];

    return await ctx.db
      .query("challengeParticipations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

/**
 * Récupère les revenus accumulés (cadeaux, super chats, boosts, etc.) pour un créateur.
 */
export const getMyEarnings = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) return null;

    const earnings = await ctx.db
      .query("creatorEarnings")
      .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
      .order("desc")
      .take(50);

    const total = earnings.reduce((s, e) => s + e.amount, 0);
    const byType = {
      gift: earnings
        .filter((e) => e.type === "gift")
        .reduce((s, e) => s + e.amount, 0),
      super_chat: earnings
        .filter((e) => e.type === "super_chat")
        .reduce((s, e) => s + e.amount, 0),
      boost: earnings
        .filter((e) => e.type === "boost")
        .reduce((s, e) => s + e.amount, 0),
      tip: earnings
        .filter((e) => e.type === "tip")
        .reduce((s, e) => s + e.amount, 0),
    };

    return { total, byType, recent: earnings.slice(0, 10) };
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Enregistre la participation de l'utilisateur connecté à un défi.
 */
export const joinChallenge = mutation({
  args: { challengeId: v.id("creatorChallenges") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Vérification de la non-existence d'une participation existante
    const existing = await ctx.db
      .query("challengeParticipations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    if (existing.some((p) => p.challengeId === args.challengeId))
      throw new ConvexError({ message: "Déjà inscrit", code: "CONFLICT" });

    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge || !challenge.isActive)
      throw new ConvexError({
        message: "Challenge introuvable",
        code: "NOT_FOUND",
      });

    await ctx.db.insert("challengeParticipations", {
      challengeId: args.challengeId,
      userId: user._id,
      submittedAt: new Date().toISOString(),
    });

    await ctx.db.patch(args.challengeId, {
      participantCount: challenge.participantCount + 1,
    });
  },
});

/**
 * Initialise des données d'exemples de défis (challenges) dans la base de données.
 */
export const seedChallenges = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("creatorChallenges").take(1);
    if (existing.length > 0) return; // Déjà initialisé

    const CHALLENGES = [
      {
        title: "Danse Afrobeats Challenge",
        description:
          "Montre tes meilleurs moves sur un beat afrobeats ! La vidéo la plus créative gagne.",
        hashtag: "AfrobeatsChallenge",
        category: "Danse",
        prize: "100 000 FCFA + Badge Or",
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        participantCount: 847,
        isActive: true,
        thumbnailUrl:
          "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=400&h=225&fit=crop",
      },
      {
        title: "Recette en 60 secondes",
        description:
          "Cuisine un plat africain traditionnel en moins de 60 secondes. Créativité et goût !",
        hashtag: "RecetteAfrica60s",
        category: "Cuisine",
        prize: "50 000 FCFA + Abonnement Pro 1 an",
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        participantCount: 312,
        isActive: true,
        thumbnailUrl:
          "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=225&fit=crop",
      },
      {
        title: "Pitch Startup 30s",
        description:
          "Présentez votre idée de business en 30 secondes. Les meilleurs pitchs seront mis en avant.",
        hashtag: "PitchAfrica30s",
        category: "Business",
        prize: "Mentoring + 200 000 FCFA",
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        participantCount: 156,
        isActive: true,
        thumbnailUrl:
          "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=225&fit=crop",
      },
      {
        title: "Transformation Fitness",
        description:
          "30 jours de transformation ! Partagez vos progrès chaque semaine.",
        hashtag: "FitAfrica30Days",
        category: "Sport",
        prize: "Équipement sport + Badge Expert",
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        participantCount: 523,
        isActive: true,
        thumbnailUrl:
          "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=225&fit=crop",
      },
    ];

    for (const c of CHALLENGES) {
      await ctx.db.insert("creatorChallenges", c);
    }
  },
});
