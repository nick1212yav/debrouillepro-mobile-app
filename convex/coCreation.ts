import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

async function getUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
}

export const listChallenges = query({
  args: { status: v.optional(v.union(v.literal("actif"), v.literal("vote"), v.literal("terminé"))) },
  handler: async (ctx, args): Promise<unknown[]> => {
    const q = args.status
      ? ctx.db.query("coCreationChallenges").withIndex("by_status", (q) => q.eq("status", args.status!))
      : ctx.db.query("coCreationChallenges");
    return q.order("desc").take(50);
  },
});

export const getChallenge = query({
  args: { id: v.id("coCreationChallenges") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const createChallenge = mutation({
  args: {
    titre: v.string(),
    description: v.string(),
    categorie: v.string(),
    emoji: v.string(),
    couleur: v.string(),
    rewardPoints: v.number(),
    deadline: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) throw new ConvexError({ message: "Non authentifié", code: "UNAUTHENTICATED" });
    return ctx.db.insert("coCreationChallenges", {
      ...args,
      authorId: user._id,
      status: "actif",
      participantCount: 0,
    });
  },
});

export const listEntries = query({
  args: { challengeId: v.id("coCreationChallenges") },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("coCreationEntries")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();
    const user = await getUser(ctx);
    return Promise.all(entries.map(async (e) => {
      const author = await ctx.db.get(e.authorId);
      let voted = false;
      if (user) {
        const v2 = await ctx.db.query("coCreationVotes").withIndex("by_entry", (q) => q.eq("entryId", e._id)).filter((q) => q.eq(q.field("userId"), user._id)).first();
        voted = !!v2;
      }
      return { ...e, authorName: author?.name ?? "Anonyme", voted };
    }));
  },
});

export const submitEntry = mutation({
  args: { challengeId: v.id("coCreationChallenges"), content: v.string() },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) throw new ConvexError({ message: "Non authentifié", code: "UNAUTHENTICATED" });
    const entryId = await ctx.db.insert("coCreationEntries", {
      challengeId: args.challengeId,
      authorId: user._id,
      content: args.content,
      votes: 0,
    });
    const challenge = await ctx.db.get(args.challengeId);
    if (challenge) {
      await ctx.db.patch(args.challengeId, { participantCount: challenge.participantCount + 1 });
    }
    return entryId;
  },
});

export const voteEntry = mutation({
  args: { entryId: v.id("coCreationEntries") },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) throw new ConvexError({ message: "Non authentifié", code: "UNAUTHENTICATED" });
    const existing = await ctx.db.query("coCreationVotes")
      .withIndex("by_entry", (q) => q.eq("entryId", args.entryId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
      const entry = await ctx.db.get(args.entryId);
      if (entry) await ctx.db.patch(args.entryId, { votes: Math.max(0, entry.votes - 1) });
    } else {
      await ctx.db.insert("coCreationVotes", { entryId: args.entryId, userId: user._id });
      const entry = await ctx.db.get(args.entryId);
      if (entry) await ctx.db.patch(args.entryId, { votes: entry.votes + 1 });
    }
  },
});

export const seedChallenges = mutation({
  args: {},
  handler: async (ctx) => {
    const count = await ctx.db.query("coCreationChallenges").take(1);
    if (count.length > 0) return;
    const system = await ctx.db.query("users").take(1);
    if (!system[0]) return;
    const samples = [
      { titre: "Meilleure idée business locale", description: "Propose ton idée de business qui répond à un besoin de ta communauté.", categorie: "entrepreneuriat", emoji: "💡", couleur: "#F59E0B", rewardPoints: 500, deadline: new Date(Date.now() + 7 * 86400000).toISOString(), status: "actif" as const, participantCount: 0 },
      { titre: "Slogan pour notre ville", description: "Crée le meilleur slogan pour représenter notre ville à l'international.", categorie: "culture", emoji: "🏙️", couleur: "#8B5CF6", rewardPoints: 300, deadline: new Date(Date.now() + 5 * 86400000).toISOString(), status: "vote" as const, participantCount: 0 },
      { titre: "App pour les agriculteurs", description: "Design la meilleure app mobile pour aider les agriculteurs locaux.", categorie: "technologie", emoji: "📱", couleur: "#10B981", rewardPoints: 800, deadline: new Date(Date.now() + 14 * 86400000).toISOString(), status: "actif" as const, participantCount: 0 },
    ];
    for (const s of samples) {
      await ctx.db.insert("coCreationChallenges", { ...s, authorId: system[0]._id });
    }
  },
});
