import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel.js";

// ── Tier definitions ──────────────────────────────────────────────────────────
export const BOOST_TIERS = {
  basic: { label: "Basic", days: 3, price: "2 500 FC", color: "#10B981", description: "Visibilité x2 pendant 3 jours" },
  pro:   { label: "Pro",   days: 7, price: "5 000 FC", color: "#6366F1", description: "Visibilité x5, badge violet pendant 7 jours" },
  elite: { label: "Elite", days: 30, price: "15 000 FC", color: "#F59E0B", description: "Top du feed, badge or pendant 30 jours" },
} as const;

// ── Get active boost for a publication ────────────────────────────────────────
export const getBoostForPublication = query({
  args: { publicationId: v.id("publications") },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const boosts = await ctx.db
      .query("publicationBoosts")
      .withIndex("by_publication", (q) => q.eq("publicationId", args.publicationId))
      .collect();
    return boosts.find((b) => b.active && b.expiresAt > now) ?? null;
  },
});

// ── Get all active boosts (for feed ordering) ─────────────────────────────────
export const listActiveBoostedPublicationIds = query({
  args: {},
  handler: async (ctx): Promise<{ publicationId: Id<"publications">; tier: string }[]> => {
    const now = new Date().toISOString();
    const boosts = await ctx.db
      .query("publicationBoosts")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    return boosts
      .filter((b) => b.expiresAt > now)
      .map((b) => ({ publicationId: b.publicationId, tier: b.tier }));
  },
});

// ── Get my boosts ──────────────────────────────────────────────────────────────
export const listMyBoosts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];

    const boosts = await ctx.db
      .query("publicationBoosts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const now = new Date().toISOString();
    return await Promise.all(
      boosts.map(async (b) => {
        const pub = await ctx.db.get(b.publicationId);
        return {
          ...b,
          publication: pub ? { _id: pub._id, title: pub.title, type: pub.type } : null,
          isExpired: b.expiresAt <= now,
        };
      }),
    );
  },
});

// ── Activate a boost ──────────────────────────────────────────────────────────
export const activateBoost = mutation({
  args: {
    publicationId: v.id("publications"),
    tier: v.union(v.literal("basic"), v.literal("pro"), v.literal("elite")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Non authentifié", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "Utilisateur introuvable", code: "NOT_FOUND" });

    const pub = await ctx.db.get(args.publicationId);
    if (!pub) throw new ConvexError({ message: "Publication introuvable", code: "NOT_FOUND" });
    if (pub.authorId !== user._id) throw new ConvexError({ message: "Vous n'êtes pas l'auteur de cette publication", code: "FORBIDDEN" });

    // Deactivate any existing active boost for this publication
    const existing = await ctx.db
      .query("publicationBoosts")
      .withIndex("by_publication", (q) => q.eq("publicationId", args.publicationId))
      .collect();
    for (const b of existing) {
      if (b.active) await ctx.db.patch(b._id, { active: false });
    }

    const DAYS: Record<string, number> = { basic: 3, pro: 7, elite: 30 };
    const now = new Date();
    const expiresAt = new Date(now.getTime() + DAYS[args.tier] * 24 * 60 * 60 * 1000);

    await ctx.db.insert("publicationBoosts", {
      publicationId: args.publicationId,
      userId: user._id,
      tier: args.tier,
      startsAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      active: true,
    });
  },
});

// ── Cancel a boost ────────────────────────────────────────────────────────────
export const cancelBoost = mutation({
  args: { boostId: v.id("publicationBoosts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Non authentifié", code: "UNAUTHENTICATED" });
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "Utilisateur introuvable", code: "NOT_FOUND" });
    const boost = await ctx.db.get(args.boostId);
    if (!boost || boost.userId !== user._id)
      throw new ConvexError({ message: "Non autorisé", code: "FORBIDDEN" });
    await ctx.db.patch(args.boostId, { active: false });
  },
});
