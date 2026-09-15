import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel.d.ts";

async function requireUser(ctx: {
  auth: { getUserIdentity: () => Promise<{ tokenIdentifier: string } | null> };
  db: import("./_generated/server").DatabaseReader;
}) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity)
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Connexion requise",
    });
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
  if (!user)
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Utilisateur introuvable",
    });
  return user;
}

// List short videos feed
export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (
    ctx,
    args,
  ): Promise<{
    page: Array<{
      _id: Id<"shortVideos">;
      _creationTime: number;
      authorId: Id<"users">;
      videoUrl: string;
      thumbnailUrl?: string;
      caption: string;
      hashtags: string[];
      likeCount: number;
      commentCount: number;
      shareCount: number;
      viewCount: number;
      duration?: number;
      isActive: boolean;
      authorName?: string;
      authorAvatar?: string;
      likedByMe: boolean;
    }>;
    isDone: boolean;
    continueCursor: string;
  }> => {
    let currentUserId: Id<"users"> | null = null;
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (identity) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_token", (q) =>
            q.eq("tokenIdentifier", identity.tokenIdentifier),
          )
          .unique();
        if (user) currentUserId = user._id;
      }
    } catch {
      /* unauthenticated */
    }

    const result = await ctx.db
      .query("shortVideos")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .paginate(args.paginationOpts);

    const page = await Promise.all(
      result.page.map(async (v) => {
        const author = await ctx.db.get(v.authorId);
        let likedByMe = false;
        if (currentUserId) {
          const like = await ctx.db
            .query("shortVideoLikes")
            .withIndex("by_user_and_video", (q) =>
              q.eq("userId", currentUserId!).eq("videoId", v._id),
            )
            .unique();
          likedByMe = like !== null;
        }
        return {
          ...v,
          authorName: author?.name,
          authorAvatar: author?.avatar,
          likedByMe,
        };
      }),
    );

    return { ...result, page };
  },
});

// Get trending hashtags from short videos
export const trendingHashtags = query({
  args: {},
  handler: async (ctx): Promise<{ tag: string; count: number }[]> => {
    const videos = await ctx.db
      .query("shortVideos")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(200);
    const counts = new Map<string, number>();
    for (const v of videos) {
      for (const tag of v.hashtags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  },
});

// Toggle like on a video
export const toggleLike = mutation({
  args: { videoId: v.id("shortVideos") },
  handler: async (ctx, args): Promise<boolean> => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("shortVideoLikes")
      .withIndex("by_user_and_video", (q) =>
        q.eq("userId", user._id).eq("videoId", args.videoId),
      )
      .unique();

    const video = await ctx.db.get(args.videoId);
    if (!video)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Vidéo introuvable",
      });

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.videoId, {
        likeCount: Math.max(0, video.likeCount - 1),
      });
      return false;
    }

    await ctx.db.insert("shortVideoLikes", {
      videoId: args.videoId,
      userId: user._id,
    });
    await ctx.db.patch(args.videoId, { likeCount: video.likeCount + 1 });
    return true;
  },
});

// Record a view
export const recordView = mutation({
  args: { videoId: v.id("shortVideos") },
  handler: async (ctx, args): Promise<void> => {
    const video = await ctx.db.get(args.videoId);
    if (video) {
      await ctx.db.patch(args.videoId, { viewCount: video.viewCount + 1 });
    }
  },
});

// Post a short video
export const create = mutation({
  args: {
    videoUrl: v.string(),
    thumbnailUrl: v.optional(v.string()),
    caption: v.string(),
    hashtags: v.array(v.string()),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Id<"shortVideos">> => {
    const user = await requireUser(ctx);
    return ctx.db.insert("shortVideos", {
      ...args,
      authorId: user._id,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      viewCount: 0,
      isActive: true,
    });
  },
});

// ── Comments ──────────────────────────────────────────────────────────────────
export const getComments = query({
  args: { videoId: v.id("shortVideos") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("shortVideoComments")
      .withIndex("by_video", (q) => q.eq("videoId", args.videoId))
      .order("asc")
      .take(50);
    return await Promise.all(
      comments.map(async (c) => {
        const user = await ctx.db.get(c.userId);
        return {
          ...c,
          userName: user?.name ?? "Utilisateur",
          userAvatar: user?.avatar ?? undefined,
        };
      }),
    );
  },
});

export const addComment = mutation({
  args: { videoId: v.id("shortVideos"), text: v.string() },
  handler: async (ctx, args): Promise<Id<"shortVideoComments">> => {
    const user = await requireUser(ctx);
    const video = await ctx.db.get(args.videoId);
    if (!video)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Vidéo introuvable",
      });

    const commentId = await ctx.db.insert("shortVideoComments", {
      videoId: args.videoId,
      userId: user._id,
      text: args.text.slice(0, 500),
      likeCount: 0,
    });

    await ctx.db.patch(args.videoId, { commentCount: video.commentCount + 1 });
    return commentId;
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("shortVideoComments") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const comment = await ctx.db.get(args.commentId);
    if (!comment || comment.userId !== user._id)
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });

    const video = await ctx.db.get(comment.videoId);
    if (video)
      await ctx.db.patch(comment.videoId, {
        commentCount: Math.max(0, video.commentCount - 1),
      });

    await ctx.db.delete(args.commentId);
  },
});

// ✅ CORRECTION ICI : migration vers email
export const getMyAnalytics = query({
  args: {
    email: v.string(), // <-- ajout du paramètre email
  },
  handler: async (ctx, args) => {
    // Recherche de l'utilisateur par email (index by_email)
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) return null;

    const videos = await ctx.db
      .query("shortVideos")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect();

    const totalViews = videos.reduce((s, v) => s + v.viewCount, 0);
    const totalLikes = videos.reduce((s, v) => s + v.likeCount, 0);
    const top = [...videos]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 3);

    return {
      totalViews,
      totalLikes,
      videoCount: videos.length,
      top,
    };
  },
});
