// ═══════════════════════════════════════════════════════════════
// DÉBROUILLE PRO — REELS / VIDÉOS COURTES
// CONTRAT PRODUCTION FINAL v1.0
// ═══════════════════════════════════════════════════════════════
//
// Média principal : Convex Storage
// Fallback legacy : videoUrl / thumbnailUrl
//
// Fonctionnalités :
// - Feed paginé
// - Visibilité public / followers / private
// - Upload Storage
// - Likes
// - Commentaires
// - Réponses
// - Likes commentaires
// - Saves
// - Shares
// - Views + watch time
// - Follow-aware visibility
// - Reports
// - Modération
// - Analytics
// - Soft delete
// - Pin
// - Ownership serveur
// - Admin via users.isAdmin
//
// ═══════════════════════════════════════════════════════════════

import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

const REELS_SCHEMA_VERSION = 1;

const MAX_CAPTION_LENGTH = 2200;
const MAX_HASHTAGS = 30;
const MAX_HASHTAG_LENGTH = 80;

const MAX_COMMENT_LENGTH = 1000;

const MAX_VIDEO_URL_LENGTH = 4096;
const MAX_THUMBNAIL_URL_LENGTH = 4096;

const MAX_SOUND_NAME_LENGTH = 200;
const MAX_CITY_LENGTH = 120;
const MAX_SHARE_CHANNEL_LENGTH = 80;
const MAX_REPORT_DETAILS_LENGTH = 2000;

const MAX_WATCHED_MS_PER_EVENT = 24 * 60 * 60 * 1000;

const VIEW_COUNT_THRESHOLD_MS = 2000;

// Nombre maximum de lignes parcourues pour détecter une vue déjà
// enregistrée sur une session anonyme. Largement suffisant en pratique.
const MAX_SESSION_VIEWS_SCAN = 500;

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type Visibility = "public" | "followers" | "private";

type ModerationStatus = "pending" | "approved" | "rejected";

type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

// ═══════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════

async function getCurrentUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users"> | null> {
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

async function requireCurrentUser(ctx: MutationCtx): Promise<Doc<"users">> {
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

async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> {
  const user = await getCurrentUser(ctx);

  if (!user) {
    throw new Error("AUTHENTICATION_REQUIRED");
  }

  if (user.isBanned === true) {
    throw new Error("USER_BANNED");
  }

  if (user.isAdmin !== true) {
    throw new Error("ADMIN_FORBIDDEN");
  }

  return user;
}

async function getUserById(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
): Promise<Doc<"users"> | null> {
  return await ctx.db.get(userId);
}

// ═══════════════════════════════════════════════════════════════
// FOLLOW GRAPH
// ═══════════════════════════════════════════════════════════════

async function isFollowing(
  ctx: QueryCtx | MutationCtx,
  followerId: Id<"users">,
  followingId: Id<"users">,
): Promise<boolean> {
  if (followerId === followingId) {
    return true;
  }

  const relation = await ctx.db
    .query("follows")
    .withIndex("by_follower_and_following", (q) =>
      q.eq("followerId", followerId).eq("followingId", followingId),
    )
    .unique();

  return relation !== null;
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════

function normalizeHashtags(input: string[]): string[] {
  const normalized = input
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag.slice(1) : tag))
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0 && tag.length <= MAX_HASHTAG_LENGTH);

  return [...new Set(normalized)].slice(0, MAX_HASHTAGS);
}

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

function validateDuration(duration: number | undefined): void {
  if (duration === undefined) {
    return;
  }

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("INVALID_DURATION");
  }
}

function validateCaption(caption: string): string {
  const normalized = caption.trim();

  if (normalized.length > MAX_CAPTION_LENGTH) {
    throw new Error("CAPTION_TOO_LONG");
  }

  return normalized;
}

function validateSoundName(soundName: string | undefined): string | undefined {
  if (soundName === undefined) {
    return undefined;
  }

  const normalized = soundName.trim();

  if (normalized.length > MAX_SOUND_NAME_LENGTH) {
    throw new Error("SOUND_NAME_TOO_LONG");
  }

  return normalized || undefined;
}

function validateCity(city: string | undefined): string | undefined {
  if (city === undefined) {
    return undefined;
  }

  const normalized = city.trim();

  if (normalized.length > MAX_CITY_LENGTH) {
    throw new Error("CITY_TOO_LONG");
  }

  return normalized || undefined;
}

function validateShareChannel(channel: string | undefined): string | undefined {
  if (channel === undefined) {
    return undefined;
  }

  const normalized = channel.trim();

  if (normalized.length > MAX_SHARE_CHANNEL_LENGTH) {
    throw new Error("SHARE_CHANNEL_TOO_LONG");
  }

  return normalized || undefined;
}

function validateReportDetails(
  details: string | undefined,
): string | undefined {
  if (details === undefined) {
    return undefined;
  }

  const normalized = details.trim();

  if (normalized.length > MAX_REPORT_DETAILS_LENGTH) {
    throw new Error("REPORT_DETAILS_TOO_LONG");
  }

  return normalized || undefined;
}

// ═══════════════════════════════════════════════════════════════
// VISIBILITY
// ═══════════════════════════════════════════════════════════════

async function canViewVideo(
  ctx: QueryCtx | MutationCtx,
  video: Doc<"shortVideos">,
  currentUser: Doc<"users"> | null,
): Promise<boolean> {
  if (video.isDeleted) {
    return false;
  }

  if (currentUser?.isBanned === true) {
    return false;
  }

  const isOwner = currentUser?._id === video.authorId;

  const isAdmin = currentUser?.isAdmin === true;

  // Owner/admin peuvent consulter leur propre contenu,
  // y compris en pending/private.
  if (isOwner || isAdmin) {
    return true;
  }

  if (!video.isActive) {
    return false;
  }

  if (video.moderationStatus !== "approved") {
    return false;
  }

  if (video.visibility === "public") {
    return true;
  }

  if (video.visibility === "private") {
    return false;
  }

  if (video.visibility === "followers") {
    if (!currentUser) {
      return false;
    }

    return await isFollowing(ctx, currentUser._id, video.authorId);
  }

  return false;
}

async function assertVideoReadable(
  ctx: QueryCtx | MutationCtx,
  video: Doc<"shortVideos">,
  currentUser: Doc<"users"> | null,
): Promise<void> {
  const allowed = await canViewVideo(ctx, video, currentUser);

  if (!allowed) {
    throw new Error("VIDEO_NOT_FOUND");
  }
}

async function assertVideoInteractive(
  ctx: MutationCtx,
  video: Doc<"shortVideos">,
  currentUser: Doc<"users">,
): Promise<void> {
  if (video.isDeleted || !video.isActive) {
    throw new Error("VIDEO_NOT_FOUND");
  }

  if (video.moderationStatus !== "approved") {
    throw new Error("VIDEO_NOT_AVAILABLE");
  }

  await assertVideoReadable(ctx, video, currentUser);
}

// ═══════════════════════════════════════════════════════════════
// MEDIA RESOLUTION
// ═══════════════════════════════════════════════════════════════

async function resolveVideoMedia(
  ctx: QueryCtx | MutationCtx,
  video: Doc<"shortVideos">,
) {
  const videoStorageUrl = video.videoStorageId
    ? await ctx.storage.getUrl(video.videoStorageId)
    : null;

  const thumbnailStorageUrl = video.thumbnailStorageId
    ? await ctx.storage.getUrl(video.thumbnailStorageId)
    : null;

  return {
    videoUrlResolved: videoStorageUrl ?? video.videoUrl ?? null,

    thumbnailUrlResolved: thumbnailStorageUrl ?? video.thumbnailUrl ?? null,
  };
}

// ═══════════════════════════════════════════════════════════════
// GENERATE UPLOAD URL
// ═══════════════════════════════════════════════════════════════

export const generateUploadUrl = mutation({
  args: {},

  handler: async (ctx) => {
    await requireCurrentUser(ctx);

    return await ctx.storage.generateUploadUrl();
  },
});

// ═══════════════════════════════════════════════════════════════
// LIST FEED
// ═══════════════════════════════════════════════════════════════

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,

    city: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const city = args.city?.trim() || undefined;

    // ─── PAGINATION PRODUCTION ─────────────────────────────────
    //
    // IMPORTANT :
    // On filtre moderationStatus + isActive AVANT la pagination.
    //
    // Ancien flux :
    //   isActive → paginate → filtrage approved
    //
    // Problème :
    //   une page pouvait contenir des contenus pending/rejected,
    //   puis devenir vide après le filtrage de modération.
    //
    // Nouveau flux :
    //   approved + active → paginate → enrichissement
    //
    // Cela garantit que les pages retournées au frontend contiennent
    // réellement des Reels publiables.
    const page = city
      ? await ctx.db
          .query("shortVideos")
          .withIndex("by_city_moderation_active_createdAt", (q) =>
            q
              .eq("city", city)
              .eq("moderationStatus", "approved")
              .eq("isActive", true),
          )
          .order("desc")
          .paginate(args.paginationOpts)
      : await ctx.db
          .query("shortVideos")
          .withIndex("by_moderation_active_createdAt", (q) =>
            q.eq("moderationStatus", "approved").eq("isActive", true),
          )
          .order("desc")
          .paginate(args.paginationOpts);

    const enriched = await Promise.all(
      page.page.map(async (video) => {
        // Défense en profondeur : le contrat de l'index garantit déjà
        // approved + active, mais ces vérifications protègent le feed
        // contre toute incohérence éventuelle de données.
        if (
          video.moderationStatus !== "approved" ||
          video.isDeleted ||
          !video.isActive
        ) {
          return null;
        }

        // Le feed normal ne montre jamais les contenus privés.
        if (video.visibility === "private") {
          return null;
        }

        if (!(await canViewVideo(ctx, video, currentUser))) {
          return null;
        }

        const author = await getUserById(ctx, video.authorId);

        // Un auteur supprimé/introuvable ne doit pas produire une carte
        // de Reel incomplète dans le feed public.
        if (!author) {
          return null;
        }

        const media = await resolveVideoMedia(ctx, video);

        // Le média doit être réellement résolu avant exposition au frontend.
        // Convex Storage est la source de vérité ; videoUrl reste le fallback.
        if (!media.videoUrlResolved) {
          return null;
        }

        let likedByMe = false;
        let savedByMe = false;

        if (currentUser) {
          const like = await ctx.db
            .query("shortVideoLikes")
            .withIndex("by_user_and_video", (q) =>
              q.eq("userId", currentUser._id).eq("videoId", video._id),
            )
            .unique();

          likedByMe = like !== null;

          const save = await ctx.db
            .query("shortVideoSaves")
            .withIndex("by_user_and_video", (q) =>
              q.eq("userId", currentUser._id).eq("videoId", video._id),
            )
            .unique();

          savedByMe = save !== null;
        }

        return {
          ...video,
          ...media,

          authorName: author.name ?? "Utilisateur",

          authorAvatar: author.avatar,

          likedByMe,
          savedByMe,
        };
      }),
    );

    return {
      ...page,

      page: enriched.filter(
        (video): video is NonNullable<typeof video> => video !== null,
      ),
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// LIST MINE — MES REELS
// ═══════════════════════════════════════════════════════════════
//
// Contrairement à `list`, cette query retourne les Reels du créateur
// connecté quel que soit leur état de modération :
//
//   pending   → en attente de validation
//   approved  → publié
//   rejected  → rejeté
//
// Les contenus soft-deleted restent exclus de la vue normale
// "Mes Reels".
//
// IMPORTANT :
// On utilise `by_author` et non `by_author_active_createdAt` car
// la bibliothèque personnelle doit également récupérer les Reels
// pending/rejected qui ont `isActive = false`.
// ═══════════════════════════════════════════════════════════════

export const listMine = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser) {
      throw new Error("AUTHENTICATION_REQUIRED");
    }

    const page = await ctx.db
      .query("shortVideos")
      .withIndex("by_author", (q) => q.eq("authorId", currentUser._id))
      .order("desc")
      .paginate(args.paginationOpts);

    const enriched = await Promise.all(
      page.page.map(async (video) => {
        // La bibliothèque personnelle n'affiche pas les suppressions
        // logiques. Les autres états de modération restent visibles.
        if (video.isDeleted) {
          return null;
        }

        // Défense supplémentaire :
        // la requête est déjà limitée à currentUser._id,
        // et canViewVideo autorise explicitement le propriétaire
        // à consulter ses contenus pending/inactifs.
        if (!(await canViewVideo(ctx, video, currentUser))) {
          return null;
        }

        const author = await getUserById(ctx, video.authorId);

        if (!author) {
          return null;
        }

        const media = await resolveVideoMedia(ctx, video);

        const like = await ctx.db
          .query("shortVideoLikes")
          .withIndex("by_user_and_video", (q) =>
            q.eq("userId", currentUser._id).eq("videoId", video._id),
          )
          .unique();

        const likedByMe = like !== null;

        const save = await ctx.db
          .query("shortVideoSaves")
          .withIndex("by_user_and_video", (q) =>
            q.eq("userId", currentUser._id).eq("videoId", video._id),
          )
          .unique();

        const savedByMe = save !== null;

        return {
          ...video,
          ...media,

          authorName: author.name ?? "Utilisateur",
          authorAvatar: author.avatar,

          likedByMe,
          savedByMe,
        };
      }),
    );

    return {
      ...page,

      page: enriched.filter(
        (video): video is NonNullable<typeof video> => video !== null,
      ),
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// GET ONE
// ═══════════════════════════════════════════════════════════════

export const get = query({
  args: {
    videoId: v.id("shortVideos"),
  },

  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoId);

    if (!video) {
      return null;
    }

    const currentUser = await getCurrentUser(ctx);

    if (!(await canViewVideo(ctx, video, currentUser))) {
      return null;
    }

    const author = await getUserById(ctx, video.authorId);

    const media = await resolveVideoMedia(ctx, video);

    let likedByMe = false;
    let savedByMe = false;

    if (currentUser) {
      const like = await ctx.db
        .query("shortVideoLikes")
        .withIndex("by_user_and_video", (q) =>
          q.eq("userId", currentUser._id).eq("videoId", video._id),
        )
        .unique();

      likedByMe = like !== null;

      const save = await ctx.db
        .query("shortVideoSaves")
        .withIndex("by_user_and_video", (q) =>
          q.eq("userId", currentUser._id).eq("videoId", video._id),
        )
        .unique();

      savedByMe = save !== null;
    }

    return {
      ...video,
      ...media,

      authorName: author?.name ?? "Utilisateur",

      authorAvatar: author?.avatar,

      likedByMe,
      savedByMe,
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// CREATE REEL
// ═══════════════════════════════════════════════════════════════

export const create = mutation({
  args: {
    videoStorageId: v.optional(v.id("_storage")),

    thumbnailStorageId: v.optional(v.id("_storage")),

    videoUrl: v.optional(v.string()),

    thumbnailUrl: v.optional(v.string()),

    caption: v.string(),

    hashtags: v.array(v.string()),

    duration: v.optional(v.number()),

    soundName: v.optional(v.string()),

    visibility: v.optional(
      v.union(
        v.literal("public"),
        v.literal("followers"),
        v.literal("private"),
      ),
    ),
  },

  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);

    if (!args.videoStorageId && !args.videoUrl) {
      throw new Error("VIDEO_MEDIA_REQUIRED");
    }

    const videoUrl = args.videoUrl
      ? validateUrl(args.videoUrl, "videoUrl", MAX_VIDEO_URL_LENGTH)
      : undefined;

    const thumbnailUrl = args.thumbnailUrl
      ? validateUrl(args.thumbnailUrl, "thumbnailUrl", MAX_THUMBNAIL_URL_LENGTH)
      : undefined;

    const caption = validateCaption(args.caption);

    validateDuration(args.duration);

    const hashtags = normalizeHashtags(args.hashtags);

    const soundName = validateSoundName(args.soundName);

    const city = validateCity(user.city);

    const now = Date.now();

    const videoId = await ctx.db.insert("shortVideos", {
      authorId: user._id,

      ...(args.videoStorageId
        ? {
            videoStorageId: args.videoStorageId,
          }
        : {}),

      ...(args.thumbnailStorageId
        ? {
            thumbnailStorageId: args.thumbnailStorageId,
          }
        : {}),

      ...(videoUrl ? { videoUrl } : {}),

      ...(thumbnailUrl ? { thumbnailUrl } : {}),

      ...(args.duration !== undefined
        ? {
            duration: args.duration,
          }
        : {}),

      caption,
      hashtags,

      ...(soundName ? { soundName } : {}),

      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      viewCount: 0,
      saveCount: 0,

      isActive: false,
      isDeleted: false,
      isPinned: false,

      visibility: args.visibility ?? "public",

      moderationStatus: "pending",

      ...(city ? { city } : {}),

      schemaVersion: REELS_SCHEMA_VERSION,

      createdAt: now,
      updatedAt: now,
    });

    return videoId;
  },
});

// ═══════════════════════════════════════════════════════════════
// LIKE VIDEO
// ═══════════════════════════════════════════════════════════════

export const toggleLike = mutation({
  args: {
    videoId: v.id("shortVideos"),
  },

  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);

    const video = await ctx.db.get(args.videoId);

    if (!video) {
      throw new Error("VIDEO_NOT_FOUND");
    }

    await assertVideoInteractive(ctx, video, user);

    const existing = await ctx.db
      .query("shortVideoLikes")
      .withIndex("by_user_and_video", (q) =>
        q.eq("userId", user._id).eq("videoId", args.videoId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);

      const likeCount = Math.max(0, video.likeCount - 1);

      await ctx.db.patch(args.videoId, {
        likeCount,
        updatedAt: Date.now(),
      });

      return {
        liked: false,
        likeCount,
      };
    }

    await ctx.db.insert("shortVideoLikes", {
      videoId: args.videoId,
      userId: user._id,
      likedAt: Date.now(),
    });

    const likeCount = video.likeCount + 1;

    await ctx.db.patch(args.videoId, {
      likeCount,
      updatedAt: Date.now(),
    });

    return {
      liked: true,
      likeCount,
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// COMMENTS
// ═══════════════════════════════════════════════════════════════

export const getComments = query({
  args: {
    videoId: v.id("shortVideos"),
  },

  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoId);

    if (!video) {
      return [];
    }

    const currentUser = await getCurrentUser(ctx);

    if (!(await canViewVideo(ctx, video, currentUser))) {
      return [];
    }

    const comments = await ctx.db
      .query("shortVideoComments")
      .withIndex("by_video_createdAt", (q) => q.eq("videoId", args.videoId))
      .order("asc")
      .take(500);

    const visible = comments.filter(
      (comment) =>
        !comment.isDeleted && comment.moderationStatus === "approved",
    );

    return Promise.all(
      visible.map(async (comment) => {
        const user = await getUserById(ctx, comment.userId);

        let likedByMe = false;

        if (currentUser) {
          const like = await ctx.db
            .query("shortVideoCommentLikes")
            .withIndex("by_user_and_comment", (q) =>
              q.eq("userId", currentUser._id).eq("commentId", comment._id),
            )
            .unique();

          likedByMe = like !== null;
        }

        return {
          ...comment,

          userName: user?.name ?? "Utilisateur",

          userAvatar: user?.avatar,

          likedByMe,
        };
      }),
    );
  },
});

export const addComment = mutation({
  args: {
    videoId: v.id("shortVideos"),
    text: v.string(),
  },

  handler: async (ctx, args) =>
    createComment(ctx, {
      videoId: args.videoId,
      text: args.text,
      parentCommentId: undefined,
    }),
});

export const replyToComment = mutation({
  args: {
    videoId: v.id("shortVideos"),
    parentCommentId: v.id("shortVideoComments"),
    text: v.string(),
  },

  handler: async (ctx, args) => {
    const parent = await ctx.db.get(args.parentCommentId);

    if (!parent) {
      throw new Error("PARENT_COMMENT_NOT_FOUND");
    }

    if (parent.videoId !== args.videoId) {
      throw new Error("PARENT_COMMENT_VIDEO_MISMATCH");
    }

    if (parent.isDeleted) {
      throw new Error("PARENT_COMMENT_DELETED");
    }

    if (parent.moderationStatus !== "approved") {
      throw new Error("PARENT_COMMENT_NOT_AVAILABLE");
    }

    return createComment(ctx, {
      videoId: args.videoId,
      text: args.text,
      parentCommentId: args.parentCommentId,
    });
  },
});

async function createComment(
  ctx: MutationCtx,
  args: {
    videoId: Id<"shortVideos">;
    text: string;
    parentCommentId: Id<"shortVideoComments"> | undefined;
  },
) {
  const user = await requireCurrentUser(ctx);

  const video = await ctx.db.get(args.videoId);

  if (!video) {
    throw new Error("VIDEO_NOT_FOUND");
  }

  await assertVideoInteractive(ctx, video, user);

  const text = args.text.trim();

  if (!text) {
    throw new Error("COMMENT_EMPTY");
  }

  if (text.length > MAX_COMMENT_LENGTH) {
    throw new Error("COMMENT_TOO_LONG");
  }

  if (args.parentCommentId) {
    const parent = await ctx.db.get(args.parentCommentId);

    if (!parent) {
      throw new Error("PARENT_COMMENT_NOT_FOUND");
    }

    if (parent.videoId !== args.videoId) {
      throw new Error("PARENT_COMMENT_VIDEO_MISMATCH");
    }

    if (parent.isDeleted) {
      throw new Error("PARENT_COMMENT_DELETED");
    }

    if (parent.moderationStatus !== "approved") {
      throw new Error("PARENT_COMMENT_NOT_AVAILABLE");
    }
  }

  const now = Date.now();

  const commentId = await ctx.db.insert("shortVideoComments", {
    videoId: args.videoId,

    userId: user._id,

    text,

    ...(args.parentCommentId
      ? {
          parentCommentId: args.parentCommentId,
        }
      : {}),

    likeCount: 0,
    replyCount: 0,

    isDeleted: false,

    moderationStatus: "approved",

    createdAt: now,
    updatedAt: now,
  });

  if (args.parentCommentId) {
    const parent = await ctx.db.get(args.parentCommentId);

    if (parent) {
      await ctx.db.patch(args.parentCommentId, {
        replyCount: parent.replyCount + 1,
        updatedAt: now,
      });
    }
  }

  await ctx.db.patch(args.videoId, {
    commentCount: video.commentCount + 1,
    updatedAt: now,
  });

  return {
    commentId,
    commentCount: video.commentCount + 1,
  };
}

// ═══════════════════════════════════════════════════════════════
// DELETE COMMENT
// ═══════════════════════════════════════════════════════════════

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

    if (comment.isDeleted) {
      return {
        deleted: true,
      };
    }

    const allowed = comment.userId === user._id || user.isAdmin === true;

    if (!allowed) {
      throw new Error("COMMENT_DELETE_FORBIDDEN");
    }

    const video = await ctx.db.get(comment.videoId);

    const now = Date.now();

    await ctx.db.patch(args.commentId, {
      isDeleted: true,
      text: "",
      updatedAt: now,
    });

    if (comment.parentCommentId) {
      const parent = await ctx.db.get(comment.parentCommentId);

      if (parent) {
        await ctx.db.patch(comment.parentCommentId, {
          replyCount: Math.max(0, parent.replyCount - 1),
          updatedAt: now,
        });
      }
    }

    if (video) {
      const commentCount = Math.max(0, video.commentCount - 1);

      await ctx.db.patch(comment.videoId, {
        commentCount,
        updatedAt: now,
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

// ═══════════════════════════════════════════════════════════════
// LIKE COMMENT
// ═══════════════════════════════════════════════════════════════

export const toggleCommentLike = mutation({
  args: {
    commentId: v.id("shortVideoComments"),
  },

  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);

    const comment = await ctx.db.get(args.commentId);

    if (
      !comment ||
      comment.isDeleted ||
      comment.moderationStatus !== "approved"
    ) {
      throw new Error("COMMENT_NOT_FOUND");
    }

    const video = await ctx.db.get(comment.videoId);

    if (!video) {
      throw new Error("VIDEO_NOT_FOUND");
    }

    await assertVideoInteractive(ctx, video, user);

    const existing = await ctx.db
      .query("shortVideoCommentLikes")
      .withIndex("by_user_and_comment", (q) =>
        q.eq("userId", user._id).eq("commentId", args.commentId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);

      const likeCount = Math.max(0, comment.likeCount - 1);

      await ctx.db.patch(args.commentId, {
        likeCount,
        updatedAt: Date.now(),
      });

      return {
        liked: false,
        likeCount,
      };
    }

    await ctx.db.insert("shortVideoCommentLikes", {
      commentId: args.commentId,

      videoId: comment.videoId,

      userId: user._id,

      likedAt: Date.now(),
    });

    const likeCount = comment.likeCount + 1;

    await ctx.db.patch(args.commentId, {
      likeCount,
      updatedAt: Date.now(),
    });

    return {
      liked: true,
      likeCount,
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// SAVE
// ═══════════════════════════════════════════════════════════════

export const toggleSave = mutation({
  args: {
    videoId: v.id("shortVideos"),
  },

  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);

    const video = await ctx.db.get(args.videoId);

    if (!video) {
      throw new Error("VIDEO_NOT_FOUND");
    }

    await assertVideoInteractive(ctx, video, user);

    const existing = await ctx.db
      .query("shortVideoSaves")
      .withIndex("by_user_and_video", (q) =>
        q.eq("userId", user._id).eq("videoId", args.videoId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);

      const saveCount = Math.max(0, video.saveCount - 1);

      await ctx.db.patch(args.videoId, {
        saveCount,
        updatedAt: Date.now(),
      });

      return {
        saved: false,
        saveCount,
      };
    }

    await ctx.db.insert("shortVideoSaves", {
      videoId: args.videoId,
      userId: user._id,
      savedAt: Date.now(),
    });

    const saveCount = video.saveCount + 1;

    await ctx.db.patch(args.videoId, {
      saveCount,
      updatedAt: Date.now(),
    });

    return {
      saved: true,
      saveCount,
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// GET SAVED
// ═══════════════════════════════════════════════════════════════

export const getSaved = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    const saves = await ctx.db
      .query("shortVideoSaves")
      .withIndex("by_user_savedAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);

    const page = await Promise.all(
      saves.page.map(async (save) => {
        const video = await ctx.db.get(save.videoId);

        if (!video || !(await canViewVideo(ctx, video, user))) {
          return null;
        }

        const author = await getUserById(ctx, video.authorId);

        const media = await resolveVideoMedia(ctx, video);

        // Un utilisateur ayant liké puis sauvegardé la vidéo doit
        // voir le cœur rouge dans "Mes sauvegardes". On calcule donc
        // l'état réel du like, plutôt que de renvoyer `false`.
        const like = await ctx.db
          .query("shortVideoLikes")
          .withIndex("by_user_and_video", (q) =>
            q.eq("userId", user._id).eq("videoId", video._id),
          )
          .unique();

        return {
          ...video,
          ...media,

          savedAt: save.savedAt,

          authorName: author?.name ?? "Utilisateur",

          authorAvatar: author?.avatar,

          likedByMe: like !== null,
          savedByMe: true,
        };
      }),
    );

    return {
      ...saves,

      page: page.filter(
        (video): video is NonNullable<typeof video> => video !== null,
      ),
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// SHARE
// ═══════════════════════════════════════════════════════════════

export const recordShare = mutation({
  args: {
    videoId: v.id("shortVideos"),

    channel: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const video = await ctx.db.get(args.videoId);

    if (!video) {
      throw new Error("VIDEO_NOT_FOUND");
    }

    if (!(await canViewVideo(ctx, video, user))) {
      throw new Error("VIDEO_NOT_FOUND");
    }

    const channel = validateShareChannel(args.channel);

    await ctx.db.insert("shortVideoShares", {
      videoId: args.videoId,

      ...(user
        ? {
            userId: user._id,
          }
        : {}),

      ...(channel ? { channel } : {}),

      sharedAt: Date.now(),
    });

    const shareCount = video.shareCount + 1;

    await ctx.db.patch(args.videoId, {
      shareCount,
      updatedAt: Date.now(),
    });

    return {
      shareCount,
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// VIEW + WATCH TIME
// ═══════════════════════════════════════════════════════════════

export const recordView = mutation({
  args: {
    videoId: v.id("shortVideos"),

    sessionId: v.optional(v.string()),

    watchedMs: v.number(),

    completed: v.optional(v.boolean()),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const video = await ctx.db.get(args.videoId);

    if (!video) {
      throw new Error("VIDEO_NOT_FOUND");
    }

    await assertVideoReadable(ctx, video, user);

    if (
      !Number.isFinite(args.watchedMs) ||
      args.watchedMs < 0 ||
      args.watchedMs > MAX_WATCHED_MS_PER_EVENT
    ) {
      throw new Error("INVALID_WATCHED_MS");
    }

    const sessionId = args.sessionId?.trim() || undefined;

    if (!user && !sessionId) {
      throw new Error("VIEWER_SESSION_REQUIRED");
    }

    let existingView: Doc<"shortVideoViews"> | null = null;

    if (user) {
      existingView =
        (await ctx.db
          .query("shortVideoViews")
          .withIndex("by_video_and_user", (q) =>
            q.eq("videoId", args.videoId).eq("userId", user._id),
          )
          .unique()) ?? null;
    } else if (sessionId) {
      // Une session anonyme peut avoir vu beaucoup de vidéos.
      // On scanne jusqu'à MAX_SESSION_VIEWS_SCAN lignes ; au-delà,
      // on accepte qu'une même vidéo puisse être recomptée pour
      // cette session (effet négligeable en pratique).
      const sessionViews = await ctx.db
        .query("shortVideoViews")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .take(MAX_SESSION_VIEWS_SCAN);

      existingView =
        sessionViews.find((view) => view.videoId === args.videoId) ?? null;
    }

    const previousWatchedMs = existingView?.watchedMs ?? 0;

    const watchedMs = Math.max(previousWatchedMs, args.watchedMs);

    const completed =
      existingView?.completed === true ||
      args.completed === true ||
      (video.duration !== undefined && watchedMs >= video.duration * 1000);

    const wasCounted = existingView?.counted === true;

    const shouldCount = wasCounted || watchedMs >= VIEW_COUNT_THRESHOLD_MS;

    const now = Date.now();

    if (existingView) {
      await ctx.db.patch(existingView._id, {
        watchedMs,
        completed,
        counted: shouldCount,
        viewedAt: now,
      });
    } else {
      await ctx.db.insert("shortVideoViews", {
        videoId: args.videoId,

        ...(user
          ? {
              userId: user._id,
            }
          : {}),

        ...(sessionId
          ? {
              sessionId,
            }
          : {}),

        watchedMs,
        completed,
        counted: shouldCount,
        viewedAt: now,
      });
    }

    if (shouldCount && !wasCounted) {
      const viewCount = video.viewCount + 1;

      await ctx.db.patch(args.videoId, {
        viewCount,
        updatedAt: now,
      });

      return {
        counted: true,
        watchedMs,
        completed,
        viewCount,
      };
    }

    return {
      counted: false,
      watchedMs,
      completed,
      viewCount: video.viewCount,
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// DEACTIVATE / DELETE
// ═══════════════════════════════════════════════════════════════

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

    const allowed = video.authorId === user._id || user.isAdmin === true;

    if (!allowed) {
      throw new Error("VIDEO_DELETE_FORBIDDEN");
    }

    if (video.isDeleted) {
      return {
        deactivated: true,
      };
    }

    await ctx.db.patch(args.videoId, {
      isActive: false,
      isDeleted: true,
      updatedAt: Date.now(),
    });

    return {
      deactivated: true,
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// REACTIVATE
// ═══════════════════════════════════════════════════════════════

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

    const allowed = video.authorId === user._id || user.isAdmin === true;

    if (!allowed) {
      throw new Error("VIDEO_UPDATE_FORBIDDEN");
    }

    if (video.moderationStatus === "rejected") {
      throw new Error("VIDEO_REQUIRES_MODERATION");
    }

    await ctx.db.patch(args.videoId, {
      isActive: true,
      isDeleted: false,
      updatedAt: Date.now(),
    });

    return {
      active: true,
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════

export const update = mutation({
  args: {
    videoId: v.id("shortVideos"),

    caption: v.optional(v.string()),

    hashtags: v.optional(v.array(v.string())),

    videoStorageId: v.optional(v.id("_storage")),

    thumbnailStorageId: v.optional(v.id("_storage")),

    videoUrl: v.optional(v.string()),

    thumbnailUrl: v.optional(v.string()),

    soundName: v.optional(v.string()),

    duration: v.optional(v.number()),

    visibility: v.optional(
      v.union(
        v.literal("public"),
        v.literal("followers"),
        v.literal("private"),
      ),
    ),
  },

  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);

    const video = await ctx.db.get(args.videoId);

    if (!video) {
      throw new Error("VIDEO_NOT_FOUND");
    }

    if (video.authorId !== user._id && user.isAdmin !== true) {
      throw new Error("VIDEO_UPDATE_FORBIDDEN");
    }

    let hasChanges = false;

    const patch: {
      caption?: string;
      hashtags?: string[];
      videoStorageId?: Id<"_storage">;
      thumbnailStorageId?: Id<"_storage">;
      videoUrl?: string;
      thumbnailUrl?: string;
      soundName?: string;
      duration?: number;
      visibility?: Visibility;
      moderationStatus?: ModerationStatus;
      isActive?: boolean;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.caption !== undefined) {
      patch.caption = validateCaption(args.caption);

      hasChanges = true;
    }

    if (args.hashtags !== undefined) {
      patch.hashtags = normalizeHashtags(args.hashtags);

      hasChanges = true;
    }

    if (args.videoStorageId !== undefined) {
      patch.videoStorageId = args.videoStorageId;

      hasChanges = true;
    }

    if (args.thumbnailStorageId !== undefined) {
      patch.thumbnailStorageId = args.thumbnailStorageId;

      hasChanges = true;
    }

    if (args.videoUrl !== undefined) {
      patch.videoUrl = validateUrl(
        args.videoUrl,
        "videoUrl",
        MAX_VIDEO_URL_LENGTH,
      );

      hasChanges = true;
    }

    if (args.thumbnailUrl !== undefined) {
      patch.thumbnailUrl = validateUrl(
        args.thumbnailUrl,
        "thumbnailUrl",
        MAX_THUMBNAIL_URL_LENGTH,
      );

      hasChanges = true;
    }

    if (args.soundName !== undefined) {
      const soundName = validateSoundName(args.soundName);

      if (soundName) {
        patch.soundName = soundName;
      }

      hasChanges = true;
    }

    if (args.duration !== undefined) {
      validateDuration(args.duration);

      patch.duration = args.duration;

      hasChanges = true;
    }

    if (args.visibility !== undefined) {
      patch.visibility = args.visibility;

      hasChanges = true;
    }

    if (!hasChanges) {
      return video._id;
    }

    // Une modification par le créateur
    // repasse le Reel en modération.
    if (user.isAdmin !== true && video.authorId === user._id) {
      patch.moderationStatus = "pending";

      patch.isActive = false;
    }

    await ctx.db.patch(args.videoId, patch);

    return args.videoId;
  },
});

// ═══════════════════════════════════════════════════════════════
// PIN
// ═══════════════════════════════════════════════════════════════

export const togglePin = mutation({
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

    const isPinned = !video.isPinned;

    // Un seul Reel épinglé par auteur.
    if (isPinned) {
      const pinned = await ctx.db
        .query("shortVideos")
        .withIndex("by_author_active_createdAt", (q) =>
          q.eq("authorId", user._id).eq("isActive", true),
        )
        .take(100);

      for (const item of pinned) {
        if (item._id !== video._id && item.isPinned) {
          await ctx.db.patch(item._id, {
            isPinned: false,
            updatedAt: Date.now(),
          });
        }
      }
    }

    await ctx.db.patch(args.videoId, {
      isPinned,
      updatedAt: Date.now(),
    });

    return {
      isPinned,
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// REPORT
// ═══════════════════════════════════════════════════════════════

export const report = mutation({
  args: {
    videoId: v.id("shortVideos"),

    reason: v.union(
      v.literal("spam"),
      v.literal("nudity"),
      v.literal("violence"),
      v.literal("harassment"),
      v.literal("misinformation"),
      v.literal("copyright"),
      v.literal("other"),
    ),

    details: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);

    const video = await ctx.db.get(args.videoId);

    if (!video || video.isDeleted) {
      throw new Error("VIDEO_NOT_FOUND");
    }

    if (video.authorId === user._id) {
      throw new Error("CANNOT_REPORT_OWN_VIDEO");
    }

    if (!(await canViewVideo(ctx, video, user))) {
      throw new Error("VIDEO_NOT_FOUND");
    }

    const reports = await ctx.db
      .query("shortVideoReports")
      .withIndex("by_video", (q) => q.eq("videoId", args.videoId))
      .take(500);

    const duplicate = reports.find(
      (item) =>
        item.reporterId === user._id &&
        (item.status === "open" || item.status === "reviewing"),
    );

    if (duplicate) {
      throw new Error("REPORT_ALREADY_EXISTS");
    }

    const details = validateReportDetails(args.details);

    const reportId = await ctx.db.insert("shortVideoReports", {
      videoId: args.videoId,

      reporterId: user._id,

      reason: args.reason,

      ...(details ? { details } : {}),

      status: "open",

      createdAt: Date.now(),
    });

    return {
      reportId,
      status: "open" as ReportStatus,
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// GET REPORTS
// ═══════════════════════════════════════════════════════════════

export const getReports = query({
  args: {
    videoId: v.id("shortVideos"),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new Error("AUTHENTICATION_REQUIRED");
    }

    const video = await ctx.db.get(args.videoId);

    if (!video) {
      throw new Error("VIDEO_NOT_FOUND");
    }

    if (video.authorId !== user._id && user.isAdmin !== true) {
      throw new Error("REPORTS_ACCESS_FORBIDDEN");
    }

    return await ctx.db
      .query("shortVideoReports")
      .withIndex("by_video", (q) => q.eq("videoId", args.videoId))
      .order("desc")
      .take(500);
  },
});

// ═══════════════════════════════════════════════════════════════
// MODERATION QUEUE
// ═══════════════════════════════════════════════════════════════

export const getModerationQueue = query({
  args: {
    paginationOpts: paginationOptsValidator,

    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
      ),
    ),
  },

  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Par défaut, la console de modération
    // affiche UNIQUEMENT les contenus pending.
    const status = args.status ?? "pending";

    return await ctx.db
      .query("shortVideos")
      .withIndex("by_moderationStatus", (q) => q.eq("moderationStatus", status))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// ═══════════════════════════════════════════════════════════════
// UPDATE MODERATION STATUS
// ═══════════════════════════════════════════════════════════════

export const updateModerationStatus = mutation({
  args: {
    videoId: v.id("shortVideos"),

    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
  },

  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const video = await ctx.db.get(args.videoId);

    if (!video) {
      throw new Error("VIDEO_NOT_FOUND");
    }

    const now = Date.now();

    const isActive = args.status === "approved";

    await ctx.db.patch(args.videoId, {
      moderationStatus: args.status,

      isActive,

      isDeleted: args.status === "rejected" ? false : video.isDeleted,

      updatedAt: now,
    });

    return {
      videoId: args.videoId,

      moderationStatus: args.status,

      isActive,
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// UPDATE REPORT STATUS
// ═══════════════════════════════════════════════════════════════

export const updateReportStatus = mutation({
  args: {
    reportId: v.id("shortVideoReports"),

    status: v.union(
      v.literal("open"),
      v.literal("reviewing"),
      v.literal("resolved"),
      v.literal("dismissed"),
    ),
  },

  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const report = await ctx.db.get(args.reportId);

    if (!report) {
      throw new Error("REPORT_NOT_FOUND");
    }

    const now = Date.now();

    await ctx.db.patch(args.reportId, {
      status: args.status,

      reviewedBy: admin._id,

      reviewedAt: now,
    });

    return {
      reportId: args.reportId,

      status: args.status,

      reviewedBy: admin._id,

      reviewedAt: now,
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════

export const getAnalytics = query({
  args: {
    videoId: v.id("shortVideos"),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new Error("AUTHENTICATION_REQUIRED");
    }

    const video = await ctx.db.get(args.videoId);

    if (!video) {
      throw new Error("VIDEO_NOT_FOUND");
    }

    if (video.authorId !== user._id && user.isAdmin !== true) {
      throw new Error("ANALYTICS_FORBIDDEN");
    }

    const views = await ctx.db
      .query("shortVideoViews")
      .withIndex("by_video", (q) => q.eq("videoId", args.videoId))
      .take(5000);

    const shares = await ctx.db
      .query("shortVideoShares")
      .withIndex("by_video", (q) => q.eq("videoId", args.videoId))
      .take(5000);

    const saves = await ctx.db
      .query("shortVideoSaves")
      .withIndex("by_video", (q) => q.eq("videoId", args.videoId))
      .take(5000);

    const completedViews = views.filter((view) => view.completed).length;

    const countedViews = views.filter((view) => view.counted).length;

    const totalWatchedMs = views.reduce(
      (total, view) => total + view.watchedMs,
      0,
    );

    return {
      videoId: args.videoId,

      likeCount: video.likeCount,

      commentCount: video.commentCount,

      shareCount: video.shareCount,

      viewCount: video.viewCount,

      saveCount: video.saveCount,

      recordedViewRows: views.length,

      countedViewRows: countedViews,

      completedViewRows: completedViews,

      totalWatchedMs,

      averageWatchedMs:
        views.length > 0 ? Math.round(totalWatchedMs / views.length) : 0,

      shareEvents: shares.length,

      saveEvents: saves.length,
    };
  },
});
