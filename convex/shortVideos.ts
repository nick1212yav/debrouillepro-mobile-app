// convex/shortVideos.ts

import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Débrouille Pro — Short Videos / Reels
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Source de vérité :
 *   shortVideos
 *   shortVideoLikes
 *   shortVideoComments
 *   users
 *
 * Principes :
 *   - aucune donnée de démonstration
 *   - authentification côté serveur
 *   - ownership vérifié côté serveur
 *   - pagination native Convex
 *   - compteurs synchronisés avec les tables d'interactions
 *   - aucune API Web
 *   - aucune dépendance frontend
 *   - city dérivée du profil utilisateur
 * ─────────────────────────────────────────────────────────────────────────────
 */

const MAX_CAPTION_LENGTH = 2200;
const MAX_HASHTAGS = 30;
const MAX_HASHTAG_LENGTH = 80;
const MAX_COMMENT_LENGTH = 1000;
const MAX_VIDEO_URL_LENGTH = 4096;
const MAX_THUMBNAIL_URL_LENGTH = 4096;

/**
 * Retourne l'utilisateur applicatif correspondant à l'identité Convex.
 *
 * Compatible avec les queries ET les mutations.
 */
async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  return user ?? null;
}

/**
 * Authentification obligatoire pour les mutations.
 */
async function requireCurrentUser(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("AUTHENTICATION_REQUIRED");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  if (user.isBanned === true) {
    throw new Error("USER_BANNED");
  }

  return user;
}

/**
 * Résolution typée d'un utilisateur.
 *
 * Contrat :
 *   Id<"users"> → Doc<"users"> | null
 */
async function getUserById(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
): Promise<Doc<"users"> | null> {
  return await ctx.db.get(userId);
}

/**
 * Nettoie et normalise les hashtags.
 */
function normalizeHashtags(input: string[]): string[] {
  const normalized = input
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => {
      const withoutHash = tag.startsWith("#") ? tag.slice(1) : tag;

      return withoutHash.trim();
    })
    .filter(Boolean)
    .filter((tag) => tag.length > 0 && tag.length <= MAX_HASHTAG_LENGTH);

  return [...new Set(normalized)].slice(0, MAX_HASHTAGS);
}

/**
 * Vérifie qu'une URL est une URL absolue valide.
 */
function validateUrl(
  value: string,
  fieldName: string,
  maxLength: number,
): string {
  const url = value.trim();

  if (!url) {
    throw new Error(`${fieldName.toUpperCase()}_REQUIRED`);
  }

  if (url.length > maxLength) {
    throw new Error(`${fieldName.toUpperCase()}_TOO_LONG`);
  }

  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`${fieldName.toUpperCase()}_INVALID`);
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`${fieldName.toUpperCase()}_INVALID_PROTOCOL`);
  }

  return parsed.toString();
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * LIST
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Sans ville :
 *   → feed global via by_active
 *
 * Avec ville :
 *   → feed local via by_city_active
 */
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    city: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const city = args.city?.trim() || undefined;

    let page;

    if (city) {
      page = await ctx.db
        .query("shortVideos")
        .withIndex("by_city_active", (q) =>
          q.eq("city", city).eq("isActive", true),
        )
        .order("desc")
        .paginate(args.paginationOpts);
    } else {
      page = await ctx.db
        .query("shortVideos")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    const enrichedPage = await Promise.all(
      page.page.map(async (video) => {
        const author = await getUserById(ctx, video.authorId);

        let likedByMe = false;

        if (currentUser) {
          const existingLike = await ctx.db
            .query("shortVideoLikes")
            .withIndex("by_user_and_video", (q) =>
              q.eq("userId", currentUser._id).eq("videoId", video._id),
            )
            .unique();

          likedByMe = existingLike !== null;
        }

        return {
          ...video,
          authorName: author?.name ?? "Utilisateur",
          authorAvatar: author?.avatar,
          likedByMe,
        };
      }),
    );

    return {
      ...page,
      page: enrichedPage,
    };
  },
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * GET ONE
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const get = query({
  args: {
    videoId: v.id("shortVideos"),
  },

  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoId);

    if (!video || !video.isActive) {
      return null;
    }

    const author = await getUserById(ctx, video.authorId);
    const currentUser = await getCurrentUser(ctx);

    let likedByMe = false;

    if (currentUser) {
      const like = await ctx.db
        .query("shortVideoLikes")
        .withIndex("by_user_and_video", (q) =>
          q.eq("userId", currentUser._id).eq("videoId", video._id),
        )
        .unique();

      likedByMe = like !== null;
    }

    return {
      ...video,
      authorName: author?.name ?? "Utilisateur",
      authorAvatar: author?.avatar,
      likedByMe,
    };
  },
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CREATE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * La ville est automatiquement dérivée du profil du créateur.
 *
 * Important :
 *   - aucune ville n'est reçue depuis le client ;
 *   - aucune ville n'est inventée ;
 *   - aucune coordonnée n'est utilisée ;
 *   - si le profil n'a pas de ville, city reste absente ;
 *   - le reel reste alors disponible dans le feed global.
 */
export const create = mutation({
  args: {
    videoUrl: v.string(),
    thumbnailUrl: v.optional(v.string()),
    caption: v.string(),
    hashtags: v.array(v.string()),
    duration: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);

    const videoUrl = validateUrl(
      args.videoUrl,
      "videoUrl",
      MAX_VIDEO_URL_LENGTH,
    );

    const thumbnailUrl = args.thumbnailUrl
      ? validateUrl(args.thumbnailUrl, "thumbnailUrl", MAX_THUMBNAIL_URL_LENGTH)
      : undefined;

    const caption = args.caption.trim();

    if (caption.length > MAX_CAPTION_LENGTH) {
      throw new Error("CAPTION_TOO_LONG");
    }

    if (
      args.duration !== undefined &&
      (!Number.isFinite(args.duration) || args.duration <= 0)
    ) {
      throw new Error("INVALID_DURATION");
    }

    const hashtags = normalizeHashtags(args.hashtags);

    /**
     * Source unique de la ville :
     * profil utilisateur authentifié.
     */
    const city = user.city?.trim();

    const videoId = await ctx.db.insert("shortVideos", {
      authorId: user._id,
      videoUrl,
      ...(thumbnailUrl ? { thumbnailUrl } : {}),
      caption,
      hashtags,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      viewCount: 0,
      ...(args.duration !== undefined ? { duration: args.duration } : {}),
      isActive: true,
      ...(city ? { city } : {}),
    });

    return videoId;
  },
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TOGGLE LIKE
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const toggleLike = mutation({
  args: {
    videoId: v.id("shortVideos"),
  },

  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);

    const video = await ctx.db.get(args.videoId);

    if (!video || !video.isActive) {
      throw new Error("VIDEO_NOT_FOUND");
    }

    const existingLike = await ctx.db
      .query("shortVideoLikes")
      .withIndex("by_user_and_video", (q) =>
        q.eq("userId", user._id).eq("videoId", args.videoId),
      )
      .unique();

    if (existingLike) {
      await ctx.db.delete(existingLike._id);

      const likeCount = Math.max(0, video.likeCount - 1);

      await ctx.db.patch(args.videoId, {
        likeCount,
      });

      return {
        liked: false,
        likeCount,
      };
    }

    await ctx.db.insert("shortVideoLikes", {
      videoId: args.videoId,
      userId: user._id,
    });

    const likeCount = video.likeCount + 1;

    await ctx.db.patch(args.videoId, {
      likeCount,
    });

    return {
      liked: true,
      likeCount,
    };
  },
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * GET COMMENTS
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const getComments = query({
  args: {
    videoId: v.id("shortVideos"),
  },

  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoId);

    if (!video || !video.isActive) {
      return [];
    }

    const comments = await ctx.db
      .query("shortVideoComments")
      .withIndex("by_video", (q) => q.eq("videoId", args.videoId))
      .take(100);

    return Promise.all(
      comments.map(async (comment) => {
        const user = await getUserById(ctx, comment.userId);

        return {
          ...comment,
          userName: user?.name ?? "Utilisateur",
          userAvatar: user?.avatar,
        };
      }),
    );
  },
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ADD COMMENT
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const addComment = mutation({
  args: {
    videoId: v.id("shortVideos"),
    text: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);

    const video = await ctx.db.get(args.videoId);

    if (!video || !video.isActive) {
      throw new Error("VIDEO_NOT_FOUND");
    }

    const text = args.text.trim();

    if (!text) {
      throw new Error("COMMENT_EMPTY");
    }

    if (text.length > MAX_COMMENT_LENGTH) {
      throw new Error("COMMENT_TOO_LONG");
    }

    const commentId = await ctx.db.insert("shortVideoComments", {
      videoId: args.videoId,
      userId: user._id,
      text,
      likeCount: 0,
    });

    const commentCount = video.commentCount + 1;

    await ctx.db.patch(args.videoId, {
      commentCount,
    });

    return {
      commentId,
      commentCount,
    };
  },
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DELETE COMMENT
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const deleteComment = mutation({
  args: {
    commentId: v.id("shortVideoComments"),
  },

  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);

    const comment = await ctx.db.get(args.commentId);

    if (!comment) {
      throw new Error("COMMENT_NOT_FOUND");
    }

    if (comment.userId !== user._id) {
      throw new Error("COMMENT_DELETE_FORBIDDEN");
    }

    const video = await ctx.db.get(comment.videoId);

    await ctx.db.delete(args.commentId);

    if (video) {
      const commentCount = Math.max(0, video.commentCount - 1);

      await ctx.db.patch(comment.videoId, {
        commentCount,
      });

      return {
        deleted: true,
        commentCount,
      };
    }

    return {
      deleted: true,
      commentCount: 0,
    };
  },
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SHARE
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const recordShare = mutation({
  args: {
    videoId: v.id("shortVideos"),
  },

  handler: async (ctx, args) => {
    await requireCurrentUser(ctx);

    const video = await ctx.db.get(args.videoId);

    if (!video || !video.isActive) {
      throw new Error("VIDEO_NOT_FOUND");
    }

    const shareCount = video.shareCount + 1;

    await ctx.db.patch(args.videoId, {
      shareCount,
    });

    return {
      shareCount,
    };
  },
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DEACTIVATE
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const deactivate = mutation({
  args: {
    videoId: v.id("shortVideos"),
  },

  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);

    const video = await ctx.db.get(args.videoId);

    if (!video) {
      throw new Error("VIDEO_NOT_FOUND");
    }

    if (video.authorId !== user._id) {
      throw new Error("VIDEO_DELETE_FORBIDDEN");
    }

    if (!video.isActive) {
      return {
        deactivated: true,
      };
    }

    await ctx.db.patch(args.videoId, {
      isActive: false,
    });

    return {
      deactivated: true,
    };
  },
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * REACTIVATE
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const reactivate = mutation({
  args: {
    videoId: v.id("shortVideos"),
  },

  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);

    const video = await ctx.db.get(args.videoId);

    if (!video) {
      throw new Error("VIDEO_NOT_FOUND");
    }

    if (video.authorId !== user._id) {
      throw new Error("VIDEO_UPDATE_FORBIDDEN");
    }

    if (video.isActive) {
      return {
        active: true,
      };
    }

    await ctx.db.patch(args.videoId, {
      isActive: true,
    });

    return {
      active: true,
    };
  },
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * UPDATE
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const update = mutation({
  args: {
    videoId: v.id("shortVideos"),
    caption: v.optional(v.string()),
    hashtags: v.optional(v.array(v.string())),
    thumbnailUrl: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);

    const video = await ctx.db.get(args.videoId);

    if (!video) {
      throw new Error("VIDEO_NOT_FOUND");
    }

    if (video.authorId !== user._id) {
      throw new Error("VIDEO_UPDATE_FORBIDDEN");
    }

    const patch: {
      caption?: string;
      hashtags?: string[];
      thumbnailUrl?: string;
    } = {};

    if (args.caption !== undefined) {
      const caption = args.caption.trim();

      if (caption.length > MAX_CAPTION_LENGTH) {
        throw new Error("CAPTION_TOO_LONG");
      }

      patch.caption = caption;
    }

    if (args.hashtags !== undefined) {
      patch.hashtags = normalizeHashtags(args.hashtags);
    }

    if (args.thumbnailUrl !== undefined) {
      patch.thumbnailUrl = validateUrl(
        args.thumbnailUrl,
        "thumbnailUrl",
        MAX_THUMBNAIL_URL_LENGTH,
      );
    }

    if (Object.keys(patch).length === 0) {
      return video._id;
    }

    await ctx.db.patch(args.videoId, patch);

    return args.videoId;
  },
});
