// convex/stories.ts

import { query, mutation, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";

import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id, Doc } from "./_generated/dataModel";

/**
 * ============================================================
 * DÉBROUILLEPRO — STORIES ENGINE v2.1
 * ============================================================
 *
 * Contrat Story explicite :
 *
 *   IMAGE → storyType "image", mediaUrl <storageId>, mediaType "image"
 *   VIDEO → storyType "video", mediaUrl <storageId>, mediaType "video"
 *   TEXT  → storyType "text",  textContent, backgroundKey, textColor
 *   POLL  → storyType "poll",  pollQuestion, pollOptions
 *
 * Règles de migration (déterministes) :
 *
 *   1. storyType fourni explicitement → utilisé strictement.
 *      Si mediaUrl contient un legacy (data:text/ ou poll:),
 *      on rejette avec INVALID_ARGUMENT (incohérence client).
 *
 *   2. storyType absent + mediaUrl legacy (data:text/ ou poll:)
 *      → auto-migration (ancien client).
 *
 *   3. storyType absent + mediaUrl "classique" (URL/storageId)
 *      → on prend args.mediaType ?? "image".
 *
 * Sondages legacy :
 *
 *   Un sondage legacy (`poll:Question`) n'a jamais stocké ses options.
 *   Il est accepté en écriture avec `pollOptions: []` + `schemaVersion: 0`,
 *   et exposé en lecture avec `legacyIncomplete: true` pour que le
 *   frontend puisse afficher un fallback correct au lieu d'un poll vide.
 * ============================================================
 */

const MAX_ACTIVE_STORIES = 500;
const MAX_FOLLOWED_STORIES = 500;
const MAX_AUTHOR_STORIES = 200;
const MAX_MY_STORIES = 200;
const MAX_FOLLOWING = 1000;
const MAX_VIEWED_STORIES = 5000;
const MAX_VIEWERS = 100;
const MAX_ANALYTICS_VIEWS = 5000;
const DELETE_VIEW_BATCH = 500;
const CLEANUP_STORY_BATCH = 100;

const MAX_CAPTION_LENGTH = 500;
const MAX_TEXT_CONTENT_LENGTH = 500;
const MAX_POLL_QUESTION_LENGTH = 200;
const MIN_POLL_OPTIONS = 2;
const MAX_POLL_OPTIONS = 6;
const MAX_MEDIA_URL_LENGTH = 2048;
const MAX_VIDEO_DURATION_SECONDS = 60;

const DEFAULT_BACKGROUND_KEY = "purple";
const DEFAULT_TEXT_COLOR = "#FFFFFF";

const LEGACY_TEXT_PREFIX = "data:text/";
const LEGACY_POLL_PREFIX = "poll:";

/* ============================================================
 * TYPES
 * ============================================================ */

type StoryType = "image" | "video" | "text" | "poll";

type StoryDoc = Doc<"stories">;

type NormalizedStory = Omit<StoryDoc, "storyType"> & {
  storyType: StoryType;
  schemaVersion: number;
  /**
   * Marqueur runtime (jamais persisté) qui signale qu'un objet
   * est incomplet pour l'UI :
   *   - sondage legacy dont les options n'ont jamais été stockées
   *   - sondage dont les options ont été perdues
   */
  legacyIncomplete?: boolean;
};

type StoryWithAuthor = NormalizedStory & {
  authorName: string;
  authorAvatar?: string;
  authorCity?: string;
  viewed: boolean;
};

type StoryInsert = {
  authorId: Id<"users">;
  viewCount: number;
  expiresAt: string;
  isHighlight: boolean;
  storyType: StoryType;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  caption?: string;
  duration?: number;
  textContent?: string;
  backgroundKey?: string;
  textColor?: string;
  pollQuestion?: string;
  pollOptions?: string[];
  createdAt?: string;
  schemaVersion?: number;
};

/* ============================================================
 * AUTHENTIFICATION
 * ============================================================ */

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Connexion requise",
    });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Utilisateur introuvable",
    });
  }

  return user;
}

/* ============================================================
 * HELPERS TEMPS
 * ============================================================ */

function nowIso(): string {
  return new Date().toISOString();
}

function isStoryActive(expiresAt: string, now: string): boolean {
  return expiresAt > now;
}

function getStoryAgeHours(creationTime: number): number {
  return Math.max(0, (Date.now() - creationTime) / (1000 * 60 * 60));
}

function freshnessScore(creationTime: number): number {
  const age = getStoryAgeHours(creationTime);

  if (age <= 1) return 100;
  if (age <= 3) return 90;
  if (age <= 6) return 80;
  if (age <= 12) return 65;
  if (age <= 18) return 45;
  if (age <= 24) return 25;

  return 0;
}

function engagementScore(viewCount: number): number {
  if (viewCount <= 0) return 0;

  if (viewCount >= 10000) return 100;
  if (viewCount >= 5000) return 90;
  if (viewCount >= 1000) return 75;
  if (viewCount >= 500) return 60;
  if (viewCount >= 100) return 45;
  if (viewCount >= 25) return 30;
  if (viewCount >= 10) return 15;

  return 5;
}

function relationScore(isFollowed: boolean, isOwner: boolean): number {
  if (isOwner) return 110;
  if (isFollowed) return 100;

  return 20;
}

function viewedScore(viewed: boolean): number {
  return viewed ? 0 : 90;
}

function calculateStoryScore({
  creationTime,
  viewCount,
  viewed,
  isFollowed,
  isOwner,
}: {
  creationTime: number;
  viewCount: number;
  viewed: boolean;
  isFollowed: boolean;
  isOwner: boolean;
}): number {
  return (
    relationScore(isFollowed, isOwner) +
    viewedScore(viewed) +
    freshnessScore(creationTime) +
    engagementScore(viewCount)
  );
}

/* ============================================================
 * AUTHORS
 * ============================================================ */

async function getAuthorsMap(ctx: QueryCtx, authorIds: Id<"users">[]) {
  const uniqueIds = Array.from(
    new Set(authorIds.map((id) => String(id))),
  ) as string[];

  const authors = await Promise.all(
    uniqueIds.map((id) => ctx.db.get(id as Id<"users">)),
  );

  return new Map(
    authors
      .filter((author): author is NonNullable<typeof author> => author !== null)
      .map((author) => [String(author._id), author]),
  );
}

/* ============================================================
 * MEDIA — helpers
 * ============================================================ */

/**
 * Vraie URL média exploitable directement par RNImage :
 *   - http(s)://...
 *   - data:image/... (data URL image encodée en base)
 *
 * N'inclut NI data:text/ NI poll: — ces formats sont du legacy
 * "story encodée" et sont détectés séparément.
 */
function isDirectMediaUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || /^data:image\//i.test(value);
}

/**
 * Détecte un encodage legacy de story (avant l'introduction du
 * contrat storyType) :
 *   - data:text/<bg>|<text>|<color>  → story texte
 *   - poll:<question>                → story sondage
 *
 * Ces valeurs ne doivent JAMAIS arriver à resolveMediaUrl() :
 * normalizeStoryForUI() les convertit en amont.
 */
function isLegacyStoryEncoding(value: string): boolean {
  return (
    value.startsWith(LEGACY_TEXT_PREFIX) || value.startsWith(LEGACY_POLL_PREFIX)
  );
}

/**
 * Détermine si la valeur est un Storage ID Convex — donc si elle
 * doit être résolue via ctx.storage.getUrl() et éventuellement
 * supprimée lors du cleanup.
 */
function isStorageId(value: string): boolean {
  return !isDirectMediaUrl(value) && !isLegacyStoryEncoding(value);
}

/* ============================================================
 * MEDIA — résolution
 * ============================================================ */

/**
 * Résout un média image/vidéo en URL publique exploitable.
 *
 * Entrées acceptées :
 *   - https://...        (URL publique existante)
 *   - http://...
 *   - data:image/...     (data URL image — toléré pour compat)
 *   - <storageId>        (Convex Storage ID)
 *
 * ⚠️ N'est appelé QUE pour storyType "image" | "video".
 * Les legacy data:text/ et poll: sont convertis en amont et ne
 * passent JAMAIS ici.
 */
async function resolveMediaUrl(
  ctx: QueryCtx | MutationCtx,
  mediaUrl: string,
): Promise<string> {
  const value = mediaUrl.trim();

  if (!value) {
    throw new ConvexError({
      code: "INVALID_MEDIA",
      message: "mediaUrl est vide",
    });
  }

  // Sécurité : un legacy ne doit jamais arriver ici.
  if (isLegacyStoryEncoding(value)) {
    throw new ConvexError({
      code: "INVALID_MEDIA",
      message:
        "mediaUrl contient un encodage legacy (data:text/ ou poll:) inattendu sur une story image/video",
    });
  }

  if (isDirectMediaUrl(value)) {
    return value;
  }

  try {
    const resolvedUrl = await ctx.storage.getUrl(value as Id<"_storage">);

    if (!resolvedUrl) {
      throw new ConvexError({
        code: "MEDIA_NOT_FOUND",
        message: "Média introuvable dans Convex Storage",
      });
    }

    return resolvedUrl;
  } catch (error) {
    if (error instanceof ConvexError) throw error;

    throw new ConvexError({
      code: "MEDIA_RESOLUTION_FAILED",
      message: "Impossible de résoudre le média depuis Convex Storage",
    });
  }
}

/**
 * Valide qu'un média image/vidéo est exploitable avant insertion.
 * Retourne la valeur à stocker en base (storageId ou URL).
 */
async function validateStoryMedia(
  ctx: MutationCtx,
  mediaUrl: string,
  mediaType: "image" | "video",
): Promise<string> {
  const value = mediaUrl.trim();

  if (!value) {
    throw new ConvexError({
      code: "INVALID_MEDIA",
      message: "Le média de la story est vide",
    });
  }

  if (value.length > MAX_MEDIA_URL_LENGTH) {
    throw new ConvexError({
      code: "INVALID_MEDIA",
      message: "Le média dépasse la taille maximale autorisée",
    });
  }

  // Sécurité : on n'accepte pas un legacy même sur la branche image/video.
  if (isLegacyStoryEncoding(value)) {
    throw new ConvexError({
      code: "INVALID_MEDIA",
      message:
        "Un média image/video ne peut pas être un encodage legacy (data:text/ ou poll:)",
    });
  }

  if (isDirectMediaUrl(value)) {
    return value;
  }

  try {
    const resolvedUrl = await ctx.storage.getUrl(value as Id<"_storage">);

    if (!resolvedUrl) {
      throw new ConvexError({
        code: "MEDIA_NOT_FOUND",
        message: "Le fichier n'existe pas dans Convex Storage",
      });
    }

    return value;
  } catch (error) {
    if (error instanceof ConvexError) throw error;

    throw new ConvexError({
      code: "INVALID_STORAGE_ID",
      message: "Le média fourni n'est pas un Storage ID Convex valide",
    });
  }
}

/* ============================================================
 * NORMALISATION (lecture)
 * ============================================================ */

/**
 * Convertit une story DB (ancien ou nouveau contrat) en objet
 * normalisé avec un storyType explicite.
 *
 * Ne résout PAS le média — voir resolveStoryForUI.
 */
function normalizeStoryForUI(story: StoryDoc): NormalizedStory {
  // ─── Nouveau contrat ───────────────────────────────────────
  if (story.storyType) {
    const type = story.storyType as StoryType;

    const result: NormalizedStory = {
      ...story,
      storyType: type,
      schemaVersion: story.schemaVersion ?? 1,
    };

    // Sondage dont les options sont manquantes ou incomplètes :
    // signalé au frontend pour afficher un fallback propre.
    if (
      type === "poll" &&
      (!story.pollOptions || story.pollOptions.length < MIN_POLL_OPTIONS)
    ) {
      result.legacyIncomplete = true;
    }

    return result;
  }

  // ─── Legacy : décodage depuis mediaUrl ─────────────────────
  const mediaUrl = (story.mediaUrl ?? "").trim();

  if (mediaUrl.startsWith(LEGACY_POLL_PREFIX)) {
    return {
      ...story,
      storyType: "poll",
      pollQuestion: mediaUrl.slice(LEGACY_POLL_PREFIX.length),
      pollOptions: undefined,
      schemaVersion: 0,
      legacyIncomplete: true,
    };
  }

  if (mediaUrl.startsWith(LEGACY_TEXT_PREFIX)) {
    const payload = mediaUrl.slice(LEGACY_TEXT_PREFIX.length);
    const parts = payload.split("|");

    return {
      ...story,
      storyType: "text",
      textContent: parts[1] ?? "",
      backgroundKey: parts[0] ?? DEFAULT_BACKGROUND_KEY,
      textColor: parts[2] ?? DEFAULT_TEXT_COLOR,
      schemaVersion: 0,
    };
  }

  // ─── Legacy image / video ──────────────────────────────────
  return {
    ...story,
    storyType: (story.mediaType ?? "image") as StoryType,
    schemaVersion: 0,
  };
}

/**
 * Normalise puis résout le média si nécessaire.
 *
 * Un échec de résolution média ne casse PAS la query : la story
 * est renvoyée avec mediaUrl indéfini, et le frontend peut
 * afficher un fallback.
 */
async function resolveStoryForUI(
  ctx: QueryCtx | MutationCtx,
  story: StoryDoc,
): Promise<NormalizedStory> {
  const normalized = normalizeStoryForUI(story);

  if (
    (normalized.storyType === "image" || normalized.storyType === "video") &&
    normalized.mediaUrl
  ) {
    try {
      return {
        ...normalized,
        mediaUrl: await resolveMediaUrl(ctx, normalized.mediaUrl),
      };
    } catch (error) {
      // Un média cassé ne doit pas casser tout le feed.
      console.error("[stories] resolveMediaUrl failed", {
        storyId: story._id,
        mediaUrl: normalized.mediaUrl,
        error,
      });

      return {
        ...normalized,
        mediaUrl: undefined,
        legacyIncomplete: true,
      };
    }
  }

  return normalized;
}

/* ============================================================
 * UPLOAD
 * ============================================================ */

export const generateStoryUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/* ============================================================
 * CREATE STORY
 * ============================================================ */

export const createStory = mutation({
  args: {
    // Nouveau contrat — discriminateur explicite
    storyType: v.optional(
      v.union(
        v.literal("image"),
        v.literal("video"),
        v.literal("text"),
        v.literal("poll"),
      ),
    ),

    // Média (image / video)
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    duration: v.optional(v.number()),

    // Texte
    textContent: v.optional(v.string()),
    backgroundKey: v.optional(v.string()),
    textColor: v.optional(v.string()),

    // Sondage
    pollQuestion: v.optional(v.string()),
    pollOptions: v.optional(v.array(v.string())),

    // Commun
    caption: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (
      args.caption !== undefined &&
      args.caption.length > MAX_CAPTION_LENGTH
    ) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "caption trop long",
      });
    }

    const rawMediaUrl = (args.mediaUrl ?? "").trim();
    const hasExplicitType = args.storyType !== undefined;
    const hasLegacyEncoding = isLegacyStoryEncoding(rawMediaUrl);

    // ─── Résolution du type (déterministe) ───────────────────
    let resolvedType: StoryType;

    if (hasExplicitType) {
      // Client moderne : on lui fait confiance, mais on refuse
      // toute incohérence legacy qu'il aurait envoyée par erreur.
      if (hasLegacyEncoding) {
        throw new ConvexError({
          code: "INVALID_ARGUMENT",
          message:
            "mediaUrl legacy (data:text/ ou poll:) incompatible avec un storyType explicite",
        });
      }

      resolvedType = args.storyType!;
    } else if (hasLegacyEncoding) {
      // Client legacy : on déduit le type depuis l'encodage.
      resolvedType = rawMediaUrl.startsWith(LEGACY_POLL_PREFIX)
        ? "poll"
        : "text";
    } else if (rawMediaUrl.length > 0) {
      // Client minimal : mediaUrl présent sans storyType.
      resolvedType = args.mediaType ?? "image";
    } else {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "storyType ou mediaUrl requis",
      });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const createdAt = nowIso();

    const payload: StoryInsert = {
      authorId: user._id,
      viewCount: 0,
      expiresAt,
      isHighlight: false,
      storyType: resolvedType,
      createdAt,
      schemaVersion: 1,
    };

    if (args.caption !== undefined) payload.caption = args.caption;

    /* ─── IMAGE / VIDEO ──────────────────────────────────── */
    if (resolvedType === "image" || resolvedType === "video") {
      if (!rawMediaUrl) {
        throw new ConvexError({
          code: "INVALID_ARGUMENT",
          message: "mediaUrl requis pour une story image/video",
        });
      }

      if (args.duration !== undefined) {
        if (
          !Number.isFinite(args.duration) ||
          args.duration < 0 ||
          args.duration > MAX_VIDEO_DURATION_SECONDS
        ) {
          throw new ConvexError({
            code: "INVALID_ARGUMENT",
            message: "duration invalide",
          });
        }
        payload.duration = args.duration;
      }

      const validated = await validateStoryMedia(
        ctx,
        rawMediaUrl,
        resolvedType,
      );
      payload.mediaUrl = validated;
      payload.mediaType = resolvedType;
    } else if (resolvedType === "text") {
      /* ─── TEXT ───────────────────────────────────────────── */
      let textContent = args.textContent?.trim();
      let backgroundKey = args.backgroundKey?.trim();
      let textColor = args.textColor?.trim();

      // Compat ascendante : ancien client → décoder data:text/...
      if (
        !textContent &&
        hasLegacyEncoding &&
        rawMediaUrl.startsWith(LEGACY_TEXT_PREFIX)
      ) {
        const parts = rawMediaUrl.slice(LEGACY_TEXT_PREFIX.length).split("|");
        backgroundKey = backgroundKey ?? parts[0] ?? DEFAULT_BACKGROUND_KEY;
        textContent = (parts[1] ?? "").trim();
        textColor = textColor ?? parts[2] ?? DEFAULT_TEXT_COLOR;
        payload.schemaVersion = 0; // marqueur legacy
      }

      if (!textContent) {
        throw new ConvexError({
          code: "INVALID_ARGUMENT",
          message: "textContent requis pour une story texte",
        });
      }

      if (textContent.length > MAX_TEXT_CONTENT_LENGTH) {
        throw new ConvexError({
          code: "INVALID_ARGUMENT",
          message: "textContent trop long",
        });
      }

      payload.textContent = textContent;
      payload.backgroundKey = backgroundKey || DEFAULT_BACKGROUND_KEY;
      payload.textColor = textColor || DEFAULT_TEXT_COLOR;
    } else if (resolvedType === "poll") {
      /* ─── POLL ───────────────────────────────────────────── */
      let question = args.pollQuestion?.trim();

      // Compat ascendante : ancien client → décoder poll:...
      if (
        !question &&
        hasLegacyEncoding &&
        rawMediaUrl.startsWith(LEGACY_POLL_PREFIX)
      ) {
        question = rawMediaUrl.slice(LEGACY_POLL_PREFIX.length).trim();
      }

      if (!question) {
        throw new ConvexError({
          code: "INVALID_ARGUMENT",
          message: "pollQuestion requis pour un sondage",
        });
      }

      if (question.length > MAX_POLL_QUESTION_LENGTH) {
        throw new ConvexError({
          code: "INVALID_ARGUMENT",
          message: "pollQuestion trop longue",
        });
      }

      const rawOptions = args.pollOptions ?? [];
      const cleaned = rawOptions
        .map((o) => o.trim())
        .filter((o) => o.length > 0);

      if (cleaned.length === 0 && hasLegacyEncoding) {
        // Cas particulier : ancien client qui n'a jamais envoyé d'options.
        // On accepte pour compat, on marque la story schemaVersion 0
        // → normalizeStoryForUI l'exposera avec legacyIncomplete: true.
        payload.pollQuestion = question;
        payload.pollOptions = [];
        payload.schemaVersion = 0;
      } else if (cleaned.length < MIN_POLL_OPTIONS) {
        throw new ConvexError({
          code: "INVALID_ARGUMENT",
          message: `pollOptions doit contenir au moins ${MIN_POLL_OPTIONS} options`,
        });
      } else if (cleaned.length > MAX_POLL_OPTIONS) {
        throw new ConvexError({
          code: "INVALID_ARGUMENT",
          message: `pollOptions ne peut pas contenir plus de ${MAX_POLL_OPTIONS} options`,
        });
      } else {
        payload.pollQuestion = question;
        payload.pollOptions = cleaned;
      }
    }

    return await ctx.db.insert("stories", payload);
  },
});

/* ============================================================
 * ACTIVE STORIES (groupées par auteur)
 * ============================================================ */

export const listActiveStories = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const now = nowIso();

    const active = await ctx.db
      .query("stories")
      .withIndex("by_expiresAt", (q) => q.gt("expiresAt", now))
      .order("desc")
      .take(MAX_ACTIVE_STORIES);

    if (active.length === 0) return [];

    const authorById = await getAuthorsMap(
      ctx,
      active.map((story) => story.authorId),
    );

    const views = await ctx.db
      .query("storyViews")
      .withIndex("by_viewer", (q) => q.eq("viewerId", user._id))
      .order("desc")
      .take(MAX_VIEWED_STORIES);

    const viewedStoryIds = new Set(views.map((view) => String(view.storyId)));

    const enriched: StoryWithAuthor[] = await Promise.all(
      active.map(async (story) => {
        const author = authorById.get(String(story.authorId));
        const normalized = await resolveStoryForUI(ctx, story);

        return {
          ...normalized,
          authorName: author?.name ?? "Anonyme",
          authorAvatar: author?.avatar,
          authorCity: author?.city,
          viewed: viewedStoryIds.has(String(story._id)),
        };
      }),
    );

    const grouped = new Map<string, StoryWithAuthor[]>();

    for (const story of enriched) {
      const key = String(story.authorId);
      const existing = grouped.get(key);
      if (existing) existing.push(story);
      else grouped.set(key, [story]);
    }

    return Array.from(grouped.values()).map((group) => {
      const first = group[0];
      return {
        author: {
          id: first.authorId,
          name: first.authorName,
          avatar: first.authorAvatar,
          city: first.authorCity,
        },
        stories: group,
        hasUnviewed: group.some((story) => !story.viewed),
        unreadCount: group.filter((story) => !story.viewed).length,
      };
    });
  },
});

/* ============================================================
 * STORY FEED
 * ============================================================ */

export const getStoryFeed = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const now = nowIso();

    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", user._id))
      .take(MAX_FOLLOWING);

    const followedIds = new Set(
      follows.map((follow) => String(follow.followingId)),
    );

    const activeStories = await ctx.db
      .query("stories")
      .withIndex("by_expiresAt", (q) => q.gt("expiresAt", now))
      .order("desc")
      .take(MAX_ACTIVE_STORIES);

    if (activeStories.length === 0) {
      return { groups: [], totalGroups: 0, totalStories: 0 };
    }

    const myViews = await ctx.db
      .query("storyViews")
      .withIndex("by_viewer", (q) => q.eq("viewerId", user._id))
      .order("desc")
      .take(MAX_VIEWED_STORIES);

    const viewedStoryIds = new Set(myViews.map((view) => String(view.storyId)));

    const authorById = await getAuthorsMap(
      ctx,
      activeStories.map((story) => story.authorId),
    );

    const enriched: Array<
      StoryWithAuthor & {
        score: number;
        isFollowed: boolean;
        isOwner: boolean;
      }
    > = [];

    for (const story of activeStories) {
      const author = authorById.get(String(story.authorId));
      if (!author) continue;

      const viewed = viewedStoryIds.has(String(story._id));
      const isOwner = story.authorId === user._id;
      const isFollowed = followedIds.has(String(story.authorId));

      const score = calculateStoryScore({
        creationTime: story._creationTime,
        viewCount: story.viewCount,
        viewed,
        isFollowed,
        isOwner,
      });

      const normalized = await resolveStoryForUI(ctx, story);

      enriched.push({
        ...normalized,
        authorName: author.name ?? "Anonyme",
        authorAvatar: author.avatar,
        authorCity: author.city,
        viewed,
        score,
        isFollowed,
        isOwner,
      });
    }

    enriched.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b._creationTime - a._creationTime;
    });

    const grouped = new Map<string, typeof enriched>();

    for (const story of enriched) {
      const key = String(story.authorId);
      const existing = grouped.get(key);
      if (existing) existing.push(story);
      else grouped.set(key, [story]);
    }

    const groups = Array.from(grouped.values())
      .map((stories) => {
        stories.sort((a, b) => {
          if (a.viewed !== b.viewed) return a.viewed ? 1 : -1;
          return b._creationTime - a._creationTime;
        });

        const first = stories[0];
        const unreadCount = stories.filter((story) => !story.viewed).length;
        const latestAt = stories.reduce(
          (latest, story) => Math.max(latest, story._creationTime),
          0,
        );
        const groupScore = Math.max(...stories.map((story) => story.score));

        return {
          author: {
            id: first.authorId,
            name: first.authorName,
            avatar: first.authorAvatar,
            city: first.authorCity,
          },
          stories,
          hasUnviewed: unreadCount > 0,
          unreadCount,
          latestAt,
          score: groupScore,
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.latestAt - a.latestAt;
      });

    return {
      groups,
      totalGroups: groups.length,
      totalStories: enriched.length,
    };
  },
});

/* ============================================================
 * STORIES BY AUTHOR
 * ============================================================ */

export const listStoriesByAuthor = query({
  args: {
    authorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = nowIso();

    const stories = await ctx.db
      .query("stories")
      .withIndex("by_author", (q) => q.eq("authorId", args.authorId))
      .order("desc")
      .take(MAX_AUTHOR_STORIES);

    const filtered = stories.filter(
      (story) => story.expiresAt > now || story.isHighlight,
    );

    return await Promise.all(
      filtered.map((story) => resolveStoryForUI(ctx, story)),
    );
  },
});

/* ============================================================
 * MY STORIES
 * ============================================================ */

export const getMyStories = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const now = nowIso();

    const stories = await ctx.db
      .query("stories")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .order("desc")
      .take(MAX_MY_STORIES);

    const filtered = stories.filter(
      (story) => story.expiresAt > now || story.isHighlight,
    );

    return await Promise.all(
      filtered.map((story) => resolveStoryForUI(ctx, story)),
    );
  },
});

/* ============================================================
 * FOLLOWED STORIES
 * ============================================================ */

export const getFollowedStories = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", user._id))
      .take(MAX_FOLLOWING);

    const followedIds = new Set(
      follows.map((follow) => String(follow.followingId)),
    );

    if (followedIds.size === 0) return [];

    const now = nowIso();

    const stories = await ctx.db
      .query("stories")
      .withIndex("by_expiresAt", (q) => q.gt("expiresAt", now))
      .order("desc")
      .take(MAX_FOLLOWED_STORIES);

    const followedStories = stories.filter((story) =>
      followedIds.has(String(story.authorId)),
    );

    if (followedStories.length === 0) return [];

    const authorById = await getAuthorsMap(
      ctx,
      followedStories.map((story) => story.authorId),
    );

    const myViews = await ctx.db
      .query("storyViews")
      .withIndex("by_viewer", (q) => q.eq("viewerId", user._id))
      .order("desc")
      .take(MAX_VIEWED_STORIES);

    const viewedStoryIds = new Set(myViews.map((view) => String(view.storyId)));

    const enriched: StoryWithAuthor[] = await Promise.all(
      followedStories.map(async (story) => {
        const author = authorById.get(String(story.authorId));
        const normalized = await resolveStoryForUI(ctx, story);

        return {
          ...normalized,
          authorName: author?.name ?? "Anonyme",
          authorAvatar: author?.avatar,
          authorCity: author?.city,
          viewed: viewedStoryIds.has(String(story._id)),
        };
      }),
    );

    const grouped = new Map<string, StoryWithAuthor[]>();

    for (const story of enriched) {
      const key = String(story.authorId);
      const existing = grouped.get(key);
      if (existing) existing.push(story);
      else grouped.set(key, [story]);
    }

    return Array.from(grouped.values()).map((group) => {
      const first = group[0];
      return {
        author: {
          id: first.authorId,
          name: first.authorName,
          avatar: first.authorAvatar,
          city: first.authorCity,
        },
        stories: group,
        hasUnviewed: group.some((story) => !story.viewed),
        unreadCount: group.filter((story) => !story.viewed).length,
      };
    });
  },
});

/* ============================================================
 * SINGLE STORY
 * ============================================================ */

export const getStory = query({
  args: {
    id: v.id("stories"),
  },
  handler: async (ctx, args) => {
    const story = await ctx.db.get(args.id);

    if (!story) return null;

    const now = nowIso();

    if (!isStoryActive(story.expiresAt, now) && !story.isHighlight) {
      return null;
    }

    const author = await ctx.db.get(story.authorId);
    const normalized = await resolveStoryForUI(ctx, story);

    return {
      ...normalized,
      authorName: author?.name ?? "Anonyme",
      authorAvatar: author?.avatar,
      authorCity: author?.city,
    };
  },
});

/* ============================================================
 * STORY VIEW
 * ============================================================ */

export const markViewed = mutation({
  args: {
    storyId: v.id("stories"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const story = await ctx.db.get(args.storyId);

    if (!story) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Story introuvable",
      });
    }

    const now = nowIso();

    if (!isStoryActive(story.expiresAt, now)) {
      return { alreadyViewed: false, counted: false, expired: true };
    }

    if (story.authorId === user._id) {
      return { alreadyViewed: false, counted: false, expired: false };
    }

    const existing = await ctx.db
      .query("storyViews")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .filter((q) => q.eq(q.field("viewerId"), user._id))
      .first();

    if (existing) {
      return { alreadyViewed: true, counted: false, expired: false };
    }

    await ctx.db.insert("storyViews", {
      storyId: args.storyId,
      viewerId: user._id,
      viewedAt: nowIso(),
    });

    await ctx.db.patch(args.storyId, {
      viewCount: story.viewCount + 1,
    });

    return { alreadyViewed: false, counted: true, expired: false };
  },
});

/* ============================================================
 * VIEWERS
 * ============================================================ */

export const getStoryViewers = query({
  args: {
    storyId: v.id("stories"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const story = await ctx.db.get(args.storyId);

    if (!story) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Story introuvable",
      });
    }

    if (story.authorId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'êtes pas autorisé à voir les spectateurs",
      });
    }

    const views = await ctx.db
      .query("storyViews")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .order("desc")
      .take(MAX_VIEWERS);

    const viewerById = await getAuthorsMap(
      ctx,
      views.map((view) => view.viewerId),
    );

    return views.map((view) => {
      const viewer = viewerById.get(String(view.viewerId));
      return {
        ...view,
        viewerName: viewer?.name ?? "Anonyme",
        viewerAvatar: viewer?.avatar,
        viewerCity: viewer?.city,
      };
    });
  },
});

/* ============================================================
 * STORY ANALYTICS
 * ============================================================ */

export const getStoryAnalytics = query({
  args: {
    storyId: v.id("stories"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const story = await ctx.db.get(args.storyId);

    if (!story) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Story introuvable",
      });
    }

    if (story.authorId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'êtes pas autorisé à consulter ces statistiques",
      });
    }

    const views = await ctx.db
      .query("storyViews")
      .withIndex("by_story", (q) => q.eq("storyId", story._id))
      .order("desc")
      .take(MAX_ANALYTICS_VIEWS);

    const uniqueViewers = new Set(views.map((view) => String(view.viewerId)));
    const viewedAt = views.map((view) => view.viewedAt).sort();

    return {
      storyId: story._id,
      viewCount: story.viewCount,
      uniqueViewers: uniqueViewers.size,
      firstViewAt: viewedAt[0] ?? null,
      lastViewAt: viewedAt[viewedAt.length - 1] ?? null,
      isHighlight: story.isHighlight,
      expiresAt: story.expiresAt,
      storyType: story.storyType ?? story.mediaType ?? "image",
      mediaType: story.mediaType ?? null,
      analyticsSampled: views.length >= MAX_ANALYTICS_VIEWS,
    };
  },
});

/* ============================================================
 * TOGGLE HIGHLIGHT
 * ============================================================ */

export const toggleHighlight = mutation({
  args: {
    storyId: v.id("stories"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const story = await ctx.db.get(args.storyId);

    if (!story) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Story introuvable",
      });
    }

    if (story.authorId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Non autorisé",
      });
    }

    const nextValue = !story.isHighlight;

    await ctx.db.patch(args.storyId, { isHighlight: nextValue });

    return { isHighlight: nextValue };
  },
});

/* ============================================================
 * HIGHLIGHTS
 * ============================================================ */

export const getHighlights = query({
  args: {
    authorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const stories = await ctx.db
      .query("stories")
      .withIndex("by_author", (q) => q.eq("authorId", args.authorId))
      .filter((q) => q.eq(q.field("isHighlight"), true))
      .order("desc")
      .take(50);

    const author = await ctx.db.get(args.authorId);

    const resolvedStories = await Promise.all(
      stories.map((story) => resolveStoryForUI(ctx, story)),
    );

    return {
      author: author
        ? {
            id: author._id,
            name: author.name ?? "Anonyme",
            avatar: author.avatar,
            city: author.city,
          }
        : null,
      stories: resolvedStories,
    };
  },
});

/* ============================================================
 * DELETE STORY
 * ============================================================ */

export const deleteStory = mutation({
  args: {
    storyId: v.id("stories"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const story = await ctx.db.get(args.storyId);

    if (!story) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Story introuvable",
      });
    }

    if (story.authorId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'êtes pas autorisé à supprimer cette story",
      });
    }

    const views = await ctx.db
      .query("storyViews")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .take(DELETE_VIEW_BATCH);

    if (views.length > 0) {
      await Promise.all(views.map((view) => ctx.db.delete(view._id)));

      if (views.length >= DELETE_VIEW_BATCH) {
        return {
          success: false,
          pendingCleanup: true,
          deletedViews: views.length,
          storyId: args.storyId,
        };
      }
    }

    const remaining = await ctx.db
      .query("storyViews")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .take(1);

    if (remaining.length > 0) {
      return {
        success: false,
        pendingCleanup: true,
        deletedViews: views.length,
        storyId: args.storyId,
      };
    }

    // Nettoyage du fichier média — uniquement si mediaUrl est un
    // vrai Storage ID (pas une URL directe, pas un legacy).
    if (story.mediaUrl && isStorageId(story.mediaUrl)) {
      try {
        await ctx.storage.delete(story.mediaUrl as Id<"_storage">);
      } catch {
        // Le fichier peut déjà avoir été supprimé.
      }
    }

    await ctx.db.delete(args.storyId);

    return {
      success: true,
      pendingCleanup: false,
      deletedViews: views.length,
      storyId: args.storyId,
    };
  },
});

/* ============================================================
 * CLEANUP EXPIRED STORIES
 * ============================================================ */

export const cleanupExpiredStories = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = nowIso();

    const expired = await ctx.db
      .query("stories")
      .withIndex("by_expiresAt", (q) => q.lt("expiresAt", now))
      .filter((q) => q.eq(q.field("isHighlight"), false))
      .take(CLEANUP_STORY_BATCH);

    let deletedStories = 0;
    let deletedViews = 0;
    let deferredStories = 0;

    for (const story of expired) {
      const views = await ctx.db
        .query("storyViews")
        .withIndex("by_story", (q) => q.eq("storyId", story._id))
        .take(DELETE_VIEW_BATCH);

      if (views.length > 0) {
        await Promise.all(views.map((view) => ctx.db.delete(view._id)));
        deletedViews += views.length;
      }

      if (views.length >= DELETE_VIEW_BATCH) {
        deferredStories++;
        continue;
      }

      const remaining = await ctx.db
        .query("storyViews")
        .withIndex("by_story", (q) => q.eq("storyId", story._id))
        .take(1);

      if (remaining.length > 0) {
        deferredStories++;
        continue;
      }

      // Nettoyage du fichier média — uniquement si vrai Storage ID.
      if (story.mediaUrl && isStorageId(story.mediaUrl)) {
        try {
          await ctx.storage.delete(story.mediaUrl as Id<"_storage">);
        } catch {
          // Le fichier peut déjà avoir été supprimé.
        }
      }

      await ctx.db.delete(story._id);
      deletedStories++;
    }

    return { deletedStories, deletedViews, deferredStories };
  },
});

/* ============================================================
 * EXPORT PAR DÉFAUT
 * ============================================================ */

export default {
  generateStoryUploadUrl,
  createStory,
  listActiveStories,
  getStoryFeed,
  listStoriesByAuthor,
  getMyStories,
  getFollowedStories,
  getStory,
  markViewed,
  getStoryViewers,
  getStoryAnalytics,
  toggleHighlight,
  getHighlights,
  deleteStory,
  cleanupExpiredStories,
};
