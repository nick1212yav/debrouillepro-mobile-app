import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import type { Doc, Id } from "./_generated/dataModel.d.ts";
import type { MutationCtx, QueryCtx } from "./_generated/server";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function requireUser(ctx: MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ message: "Non authentifié", code: "UNAUTHENTICATED" });
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) throw new ConvexError({ message: "Utilisateur introuvable", code: "NOT_FOUND" });
  return user;
}

async function getOptionalUser(ctx: QueryCtx): Promise<Doc<"users"> | null> {
  try {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
  } catch {
    return null;
  }
}

// ── Queries ───────────────────────────────────────────────────────────────────

export const listChallenges = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.union(v.literal("upcoming"), v.literal("active"), v.literal("ended"))),
  },
  handler: async (ctx, args): Promise<{
    page: Array<Doc<"challenges"> & { creator: { name?: string; avatar?: string } | null; joinedByMe: boolean }>;
    isDone: boolean;
    continueCursor: string;
  }> => {
    const currentUser = await getOptionalUser(ctx);
    const status = args.status ?? "active";
    const results = await ctx.db
      .query("challenges")
      .withIndex("by_status", (q) => q.eq("status", status))
      .order("desc")
      .paginate(args.paginationOpts);

    const page = await Promise.all(
      results.page.map(async (c) => {
        const creator = await ctx.db.get(c.creatorId);
        const joinedByMe = currentUser
          ? !!(await ctx.db
              .query("challengeEntries")
              .withIndex("by_challenge_and_user", (q) => q.eq("challengeId", c._id).eq("userId", currentUser._id))
              .unique())
          : false;
        return {
          ...c,
          creator: creator ? { name: creator.name, avatar: creator.avatar } : null,
          joinedByMe,
        };
      }),
    );

    return { ...results, page };
  },
});

export const getChallengeById = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args): Promise<(Doc<"challenges"> & {
    creator: { name?: string; avatar?: string; _id: Id<"users"> } | null;
    topEntries: Array<Doc<"challengeEntries"> & { user: { name?: string; avatar?: string } | null }>;
    myEntry: Doc<"challengeEntries"> | null;
    hasVotedFor: Id<"challengeEntries"> | null;
  }) | null> => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) return null;
    const currentUser = await getOptionalUser(ctx);
    const creator = await ctx.db.get(challenge.creatorId);

    // Top 10 by votes
    const rawTop = await ctx.db
      .query("challengeEntries")
      .withIndex("by_challenge_and_votes", (q) => q.eq("challengeId", args.challengeId))
      .order("desc")
      .take(10);

    const topEntries = await Promise.all(
      rawTop.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        return { ...p, user: user ? { name: user.name, avatar: user.avatar } : null };
      }),
    );

    const myEntry = currentUser
      ? await ctx.db
          .query("challengeEntries")
          .withIndex("by_challenge_and_user", (q) => q.eq("challengeId", args.challengeId).eq("userId", currentUser._id))
          .unique()
      : null;

    let hasVotedFor: Id<"challengeEntries"> | null = null;
    if (currentUser) {
      const vote = await ctx.db
        .query("challengeEntryVotes")
        .withIndex("by_voter_and_challenge", (q) => q.eq("voterId", currentUser._id).eq("challengeId", args.challengeId))
        .unique();
      hasVotedFor = vote ? vote.entryId : null;
    }

    return {
      ...challenge,
      creator: creator ? { _id: creator._id, name: creator.name, avatar: creator.avatar } : null,
      topEntries,
      myEntry,
      hasVotedFor,
    };
  },
});

export const getTrendingHashtags = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args): Promise<Array<Doc<"trendingHashtags">>> => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    const weekStartStr = weekStart.toISOString().slice(0, 10);
    return await ctx.db
      .query("trendingHashtags")
      .withIndex("by_week_and_count", (q) => q.eq("weekStart", weekStartStr))
      .order("desc")
      .take(args.limit ?? 10);
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const createChallenge = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    hashtag: v.string(),
    category: v.string(),
    xpReward: v.number(),
    startsAt: v.string(),
    endsAt: v.string(),
    coverImage: v.optional(v.string()),
    isOfficial: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<Id<"challenges">> => {
    const user = await requireUser(ctx);
    const hashtag = args.hashtag.startsWith("#") ? args.hashtag : `#${args.hashtag}`;
    const now = new Date().toISOString();
    const status = args.startsAt > now ? "upcoming" : args.endsAt < now ? "ended" : "active";
    return await ctx.db.insert("challenges", {
      ...args,
      hashtag,
      creatorId: user._id,
      participantCount: 0,
      status: status as "upcoming" | "active" | "ended",
      isOfficial: args.isOfficial ?? false,
    });
  },
});

export const joinChallenge = mutation({
  args: {
    challengeId: v.id("challenges"),
    publicationId: v.optional(v.id("publications")),
  },
  handler: async (ctx, args): Promise<Id<"challengeEntries">> => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("challengeEntries")
      .withIndex("by_challenge_and_user", (q) => q.eq("challengeId", args.challengeId).eq("userId", user._id))
      .unique();
    if (existing) {
      if (args.publicationId) await ctx.db.patch(existing._id, { publicationId: args.publicationId });
      return existing._id;
    }
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new ConvexError({ message: "Défi introuvable", code: "NOT_FOUND" });
    await ctx.db.patch(args.challengeId, { participantCount: challenge.participantCount + 1 });
    return await ctx.db.insert("challengeEntries", {
      challengeId: args.challengeId,
      userId: user._id,
      publicationId: args.publicationId,
      voteCount: 0,
      joinedAt: new Date().toISOString(),
    });
  },
});

export const voteForEntry = mutation({
  args: {
    entryId: v.id("challengeEntries"),
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existingVote = await ctx.db
      .query("challengeEntryVotes")
      .withIndex("by_voter_and_challenge", (q) => q.eq("voterId", user._id).eq("challengeId", args.challengeId))
      .unique();
    if (existingVote) {
      const prev = await ctx.db.get(existingVote.entryId);
      if (prev) await ctx.db.patch(prev._id, { voteCount: Math.max(0, prev.voteCount - 1) });
      await ctx.db.delete(existingVote._id);
      if (existingVote.entryId === args.entryId) return; // toggle off
    }
    await ctx.db.insert("challengeEntryVotes", {
      challengeId: args.challengeId,
      entryId: args.entryId,
      voterId: user._id,
    });
    const entry = await ctx.db.get(args.entryId);
    if (entry) await ctx.db.patch(args.entryId, { voteCount: entry.voteCount + 1 });
  },
});

export const seedOfficialChallenges = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db.query("challenges").withIndex("by_status", (q) => q.eq("status", "active")).first();
    if (existing) return;

    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 7);

    const defs = [
      { title: "Défi Agriculture #1", description: "Partage une photo de ta récolte ou de ton jardin. Les meilleures participations gagneront des XP et des badges !", hashtag: "#DefiAgri1", category: "Agriculture", xpReward: 150 },
      { title: "Défi Entrepreneuriat", description: "Présente ton business ou ton projet en moins de 60 secondes. Inspire la communauté !", hashtag: "#DefiEntreprise", category: "Business", xpReward: 200 },
      { title: "Défi Cuisine Africaine", description: "Partage ta recette préférée avec photo. Le plat le plus original gagne !", hashtag: "#DefiCuisine", category: "Restauration", xpReward: 100 },
    ];

    for (const c of defs) {
      await ctx.db.insert("challenges", {
        ...c,
        creatorId: user._id,
        participantCount: 0,
        startsAt: now.toISOString(),
        endsAt: end.toISOString(),
        status: "active",
        isOfficial: true,
      });
    }
  },
});

export const incrementHashtag = mutation({
  args: { hashtag: v.string() },
  handler: async (ctx, args) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    const weekStartStr = weekStart.toISOString().slice(0, 10);
    const tag = args.hashtag.startsWith("#") ? args.hashtag : `#${args.hashtag}`;
    const existing = await ctx.db
      .query("trendingHashtags")
      .withIndex("by_hashtag_and_week", (q) => q.eq("hashtag", tag).eq("weekStart", weekStartStr))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { count: existing.count + 1 });
    } else {
      await ctx.db.insert("trendingHashtags", { hashtag: tag, count: 1, weekStart: weekStartStr });
    }
  },
});
