// convex/shortVideos.ts

import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

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
 *
 * Le projet utilise `tokenIdentifier` comme clé d'identité Convex
 * dans la table users.
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
 *
 * Ce helper reste volontairement MutationCtx :
 * il est utilisé uniquement par les mutations.
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
 *
 * Le backend conserve volontairement une string URL car le schéma
 * actuel de shortVideos utilise videoUrl / thumbnailUrl en string.
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
 * Utilisé par :
 *
 * usePaginatedQuery(
 *   api.shortVideos.list,
 *   {},
 *   { initialNumItems: 5 }
 * )
 *
 * Les vidéos inactives ne sont jamais exposées.
 */
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const page = await ctx.db
      .query("shortVideos")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .paginate(args.paginationOpts);

    const enrichedPage = await Promise.all(
      page.page.map(async (video) => {
        const author = await ctx.db.get(video.authorId);

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

    const author = await ctx.db.get(video.authorId);
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
 * Création authentifiée uniquement.
 *
 * Le schéma actuel reçoit directement videoUrl / thumbnailUrl.
 * Il n'invente donc aucun pipeline Storage qui n'existe pas encore.
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
    });

    return videoId;
  },
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TOGGLE LIKE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Source de vérité :
 *   shortVideoLikes
 *
 * Le compteur shortVideos.likeCount est maintenu dans la même mutation.
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

      await ctx.db.patch(args.videoId, {
        likeCount: Math.max(0, video.likeCount - 1),
      });

      return {
        liked: false,
        likeCount: Math.max(0, video.likeCount - 1),
      };
    }

    await ctx.db.insert("shortVideoLikes", {
      videoId: args.videoId,
      userId: user._id,
    });

    await ctx.db.patch(args.videoId, {
      likeCount: video.likeCount + 1,
    });

    return {
      liked: true,
      likeCount: video.likeCount + 1,
    };
  },
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * GET COMMENTS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le schéma ne possède actuellement pas de createdAt sur
 * shortVideoComments.
 *
 * On ne fabrique donc pas de date fictive.
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
        const user = await ctx.db.get(comment.userId);

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

    await ctx.db.patch(args.videoId, {
      commentCount: video.commentCount + 1,
    });

    return {
      commentId,
      commentCount: video.commentCount + 1,
    };
  },
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DELETE COMMENT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * CRITIQUE :
 * la suppression est protégée par ownership côté serveur.
 *
 * Le client ne peut jamais supprimer le commentaire
 * d'un autre utilisateur simplement en envoyant son ID.
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
      await ctx.db.patch(comment.videoId, {
        commentCount: Math.max(0, video.commentCount - 1),
      });

      return {
        deleted: true,
        commentCount: Math.max(0, video.commentCount - 1),
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
 *
 * Le schéma shortVideos possède shareCount mais aucune table
 * shortVideoShares.
 *
 * Cette mutation incrémente donc uniquement le compteur serveur.
 *
 * Pour une vraie analytics mondiale :
 *   shortVideoShares
 * ou un système d'events idempotent doit être ajouté au schema.
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
 *
 * Soft delete.
 *
 * La vidéo n'est pas détruite :
 * elle devient simplement invisible dans le feed public.
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
 *
 * Permet au propriétaire de remettre une vidéo active.
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
 *
 * Permet au créateur de modifier les métadonnées
 * sans changer les compteurs.
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
