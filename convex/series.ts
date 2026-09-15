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

export const listSeries = query({
  args: {
    paginationOpts: paginationOptsValidator,
    creatorId: v.optional(v.id("users")),
    status: v.optional(v.union(v.literal("active"), v.literal("completed"), v.literal("draft"))),
  },
  handler: async (ctx, args): Promise<{
    page: Array<Doc<"series"> & { creator: { name?: string; avatar?: string } | null; subscribedByMe: boolean }>;
    isDone: boolean;
    continueCursor: string;
  }> => {
    const currentUser = await getOptionalUser(ctx);

    let baseQ;
    if (args.creatorId) {
      baseQ = ctx.db.query("series").withIndex("by_creator", (q) => q.eq("creatorId", args.creatorId!));
    } else if (args.status) {
      baseQ = ctx.db.query("series").withIndex("by_status", (q) => q.eq("status", args.status!));
    } else {
      baseQ = ctx.db.query("series").withIndex("by_status", (q) => q.eq("status", "active"));
    }

    const results = await baseQ.order("desc").paginate(args.paginationOpts);

    const page = await Promise.all(
      results.page.map(async (s) => {
        const creator = await ctx.db.get(s.creatorId);
        const subscribedByMe = currentUser
          ? !!(await ctx.db
              .query("seriesSubscriptions")
              .withIndex("by_user_and_series", (q) => q.eq("userId", currentUser._id).eq("seriesId", s._id))
              .unique())
          : false;
        return {
          ...s,
          creator: creator ? { name: creator.name, avatar: creator.avatar } : null,
          subscribedByMe,
        };
      }),
    );

    return { ...results, page };
  },
});

export const getSeriesById = query({
  args: { seriesId: v.id("series") },
  handler: async (ctx, args): Promise<(Doc<"series"> & {
    creator: { name?: string; avatar?: string; _id: Id<"users"> } | null;
    episodes: Array<Doc<"seriesEpisodes"> & { publication: Doc<"publications"> | null }>;
    subscribedByMe: boolean;
    progress: Doc<"seriesProgress"> | null;
  }) | null> => {
    const series = await ctx.db.get(args.seriesId);
    if (!series) return null;
    const currentUser = await getOptionalUser(ctx);
    const creator = await ctx.db.get(series.creatorId);
    const rawEpisodes = await ctx.db
      .query("seriesEpisodes")
      .withIndex("by_series_and_order", (q) => q.eq("seriesId", args.seriesId))
      .order("asc")
      .collect();
    const episodes = await Promise.all(
      rawEpisodes.map(async (ep) => ({
        ...ep,
        publication: await ctx.db.get(ep.publicationId),
      })),
    );
    const subscribedByMe = currentUser
      ? !!(await ctx.db
          .query("seriesSubscriptions")
          .withIndex("by_user_and_series", (q) => q.eq("userId", currentUser._id).eq("seriesId", args.seriesId))
          .unique())
      : false;
    const progress = currentUser
      ? await ctx.db
          .query("seriesProgress")
          .withIndex("by_user_and_series", (q) => q.eq("userId", currentUser._id).eq("seriesId", args.seriesId))
          .unique()
      : null;
    return {
      ...series,
      creator: creator ? { _id: creator._id, name: creator.name, avatar: creator.avatar } : null,
      episodes,
      subscribedByMe,
      progress,
    };
  },
});

export const getMySubscriptions = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args): Promise<{
    page: Array<Doc<"series"> & { creator: { name?: string; avatar?: string } | null; progress: Doc<"seriesProgress"> | null }>;
    isDone: boolean;
    continueCursor: string;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Non authentifié", code: "UNAUTHENTICATED" });
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "Utilisateur introuvable", code: "NOT_FOUND" });

    const subs = await ctx.db
      .query("seriesSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);

    const page = await Promise.all(
      subs.page.map(async (sub) => {
        const series = await ctx.db.get(sub.seriesId);
        if (!series) return null;
        const creator = await ctx.db.get(series.creatorId);
        const progress = await ctx.db
          .query("seriesProgress")
          .withIndex("by_user_and_series", (q) => q.eq("userId", user._id).eq("seriesId", sub.seriesId))
          .unique();
        return { ...series, creator: creator ? { name: creator.name, avatar: creator.avatar } : null, progress };
      }),
    );

    return { ...subs, page: page.filter((x): x is NonNullable<typeof x> => x !== null) };
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const createSeries = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    coverImage: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"series">> => {
    const user = await requireUser(ctx);
    return await ctx.db.insert("series", {
      ...args,
      creatorId: user._id,
      episodeCount: 0,
      subscriberCount: 0,
      status: "draft",
    });
  },
});

export const updateSeries = mutation({
  args: {
    seriesId: v.id("series"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    coverImage: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("completed"), v.literal("draft"))),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const series = await ctx.db.get(args.seriesId);
    if (!series || series.creatorId !== user._id)
      throw new ConvexError({ message: "Non autorisé", code: "FORBIDDEN" });
    const { seriesId, ...updates } = args;
    await ctx.db.patch(seriesId, updates);
  },
});

export const addEpisode = mutation({
  args: {
    seriesId: v.id("series"),
    publicationId: v.id("publications"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const series = await ctx.db.get(args.seriesId);
    if (!series || series.creatorId !== user._id)
      throw new ConvexError({ message: "Non autorisé", code: "FORBIDDEN" });
    const episodeNumber = series.episodeCount + 1;
    await ctx.db.insert("seriesEpisodes", {
      seriesId: args.seriesId,
      publicationId: args.publicationId,
      episodeNumber,
      title: args.title,
    });
    await ctx.db.patch(args.seriesId, { episodeCount: episodeNumber });
  },
});

export const toggleSubscription = mutation({
  args: { seriesId: v.id("series") },
  handler: async (ctx, args): Promise<{ subscribed: boolean }> => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("seriesSubscriptions")
      .withIndex("by_user_and_series", (q) => q.eq("userId", user._id).eq("seriesId", args.seriesId))
      .unique();
    const series = await ctx.db.get(args.seriesId);
    if (!series) throw new ConvexError({ message: "Série introuvable", code: "NOT_FOUND" });
    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.seriesId, { subscriberCount: Math.max(0, series.subscriberCount - 1) });
      return { subscribed: false };
    } else {
      await ctx.db.insert("seriesSubscriptions", { seriesId: args.seriesId, userId: user._id });
      await ctx.db.patch(args.seriesId, { subscriberCount: series.subscriberCount + 1 });
      return { subscribed: true };
    }
  },
});

export const updateProgress = mutation({
  args: {
    seriesId: v.id("series"),
    episodeNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("seriesProgress")
      .withIndex("by_user_and_series", (q) => q.eq("userId", user._id).eq("seriesId", args.seriesId))
      .unique();
    if (existing) {
      const completed = Array.from(new Set([...existing.completedEpisodes, args.episodeNumber]));
      await ctx.db.patch(existing._id, {
        lastEpisodeNumber: args.episodeNumber,
        completedEpisodes: completed,
      });
    } else {
      await ctx.db.insert("seriesProgress", {
        seriesId: args.seriesId,
        userId: user._id,
        lastEpisodeNumber: args.episodeNumber,
        completedEpisodes: [args.episodeNumber],
      });
    }
  },
});
