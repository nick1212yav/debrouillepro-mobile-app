// convex/stories.ts

import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * ============================================================
 * DÉBROUILLEPRO
 * STORIES ENGINE
 * ============================================================
 *
 * Responsabilités :
 * - Upload sécurisé
 * - Création de stories
 * - Feed personnalisé
 * - Ranking
 * - Détection des stories vues
 * - Stories suivies
 * - Stories personnelles
 * - Highlights
 * - Analytics
 * - Suppression sécurisée
 * - Expiration automatique
 *
 * Sources de vérité utilisées :
 * - users
 * - stories
 * - storyViews
 * - follows
 *
 * Aucun mock.
 * Aucun compteur synthétique.
 * Aucun fallback temporel artificiel.
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

/* ============================================================
 * TYPES
 * ============================================================ */

type StoryWithAuthor = {
  _id: Id<"stories">;
  _creationTime: number;

  authorId: Id<"users">;

  mediaUrl: string;
  mediaType: "image" | "video";

  caption?: string;
  duration?: number;

  viewCount: number;

  expiresAt: string;

  isHighlight: boolean;

  authorName: string;
  authorAvatar?: string;
  authorCity?: string;

  viewed: boolean;
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
 * HELPERS
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

/**
 * Score de fraîcheur.
 *
 * Ce score est uniquement utilisé pour le ranking interne.
 * Il ne représente pas une métrique utilisateur.
 */
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

/**
 * Score d'engagement basé uniquement sur viewCount,
 * actuellement disponible dans le schéma Stories.
 */
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

/**
 * Score relationnel.
 *
 * Owner > followed > autres.
 *
 * Ceci sert uniquement au classement interne.
 */
function relationScore(isFollowed: boolean, isOwner: boolean): number {
  if (isOwner) return 110;
  if (isFollowed) return 100;

  return 20;
}

/**
 * Les stories non vues sont privilégiées.
 */
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

/**
 * Récupère les auteurs uniques sans requête répétée par story.
 */
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
 * CREATE
 * ============================================================ */

export const createStory = mutation({
  args: {
    mediaUrl: v.string(),

    mediaType: v.union(v.literal("image"), v.literal("video")),

    caption: v.optional(v.string()),

    duration: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    /**
     * Validation serveur.
     *
     * Le client ne peut pas imposer des payloads
     * disproportionnés ou des durées invalides.
     */
    if (args.mediaUrl.length === 0 || args.mediaUrl.length > 2048) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "mediaUrl invalide",
      });
    }

    if (args.caption !== undefined && args.caption.length > 500) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "caption trop long",
      });
    }

    if (
      args.duration !== undefined &&
      (!Number.isFinite(args.duration) ||
        args.duration < 0 ||
        args.duration > 60)
    ) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "duration invalide",
      });
    }

    /**
     * Une story expire 24h après sa création.
     */
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const storyId = await ctx.db.insert("stories", {
      mediaUrl: args.mediaUrl,
      mediaType: args.mediaType,
      caption: args.caption,
      duration: args.duration,

      authorId: user._id,

      viewCount: 0,

      expiresAt,

      isHighlight: false,
    });

    return storyId;
  },
});

/* ============================================================
 * ACTIVE STORIES
 * ============================================================ */

export const listActiveStories = query({
  args: {},

  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const now = nowIso();

    /**
     * Filtrage directement via l'index.
     *
     * Cela évite de charger toutes les stories historiques.
     */
    const active = await ctx.db
      .query("stories")
      .withIndex("by_expiresAt", (q) => q.gt("expiresAt", now))
      .order("desc")
      .take(MAX_ACTIVE_STORIES);

    if (active.length === 0) {
      return [];
    }

    /**
     * Auteurs uniques.
     */
    const authorIds = active.map((story) => story.authorId);

    const authorById = await getAuthorsMap(ctx, authorIds);

    /**
     * Les vues du viewer sont récupérées une seule fois
     * par utilisateur au lieu d'une requête par story.
     */
    const views = await ctx.db
      .query("storyViews")
      .withIndex("by_viewer", (q) => q.eq("viewerId", user._id))
      .order("desc")
      .take(MAX_VIEWED_STORIES);

    const viewedStoryIds = new Set(views.map((view) => String(view.storyId)));

    const enriched = active.map((story) => {
      const author = authorById.get(String(story.authorId));

      return {
        ...story,

        authorName: author?.name ?? "Anonyme",
        authorAvatar: author?.avatar,
        authorCity: author?.city,

        viewed: viewedStoryIds.has(String(story._id)),
      };
    });

    /**
     * Groupement par auteur.
     */
    const grouped = new Map<string, typeof enriched>();

    for (const story of enriched) {
      const key = String(story.authorId);

      const existing = grouped.get(key);

      if (existing) {
        existing.push(story);
      } else {
        grouped.set(key, [story]);
      }
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
 * STORY FEED 2.0
 * ============================================================ */

export const getStoryFeed = query({
  args: {},

  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const now = nowIso();

    /* --------------------------------------------------------
     * FOLLOWING
     * -------------------------------------------------------- */

    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", user._id))
      .take(MAX_FOLLOWING);

    const followedIds = new Set(
      follows.map((follow) => String(follow.followingId)),
    );

    /* --------------------------------------------------------
     * STORIES ACTIVES
     * -------------------------------------------------------- */

    const activeStories = await ctx.db
      .query("stories")
      .withIndex("by_expiresAt", (q) => q.gt("expiresAt", now))
      .order("desc")
      .take(MAX_ACTIVE_STORIES);

    if (activeStories.length === 0) {
      return {
        groups: [],
        totalGroups: 0,
        totalStories: 0,
      };
    }

    /* --------------------------------------------------------
     * VUES DE L'UTILISATEUR
     * -------------------------------------------------------- */

    const myViews = await ctx.db
      .query("storyViews")
      .withIndex("by_viewer", (q) => q.eq("viewerId", user._id))
      .order("desc")
      .take(MAX_VIEWED_STORIES);

    const viewedStoryIds = new Set(myViews.map((view) => String(view.storyId)));

    /* --------------------------------------------------------
     * AUTEURS
     * -------------------------------------------------------- */

    const authorById = await getAuthorsMap(
      ctx,
      activeStories.map((story) => story.authorId),
    );

    /* --------------------------------------------------------
     * ENRICHISSEMENT + RANKING
     * -------------------------------------------------------- */

    const enriched: Array<
      StoryWithAuthor & {
        score: number;
        isFollowed: boolean;
        isOwner: boolean;
      }
    > = [];

    for (const story of activeStories) {
      const author = authorById.get(String(story.authorId));

      if (!author) {
        continue;
      }

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

      enriched.push({
        ...story,

        authorName: author.name ?? "Anonyme",
        authorAvatar: author.avatar,
        authorCity: author.city,

        viewed,

        score,

        isFollowed,

        isOwner,
      });
    }

    /* --------------------------------------------------------
     * RANK STORIES
     * -------------------------------------------------------- */

    enriched.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return b._creationTime - a._creationTime;
    });

    /* --------------------------------------------------------
     * GROUP BY AUTHOR
     * -------------------------------------------------------- */

    const grouped = new Map<string, typeof enriched>();

    for (const story of enriched) {
      const key = String(story.authorId);

      const existing = grouped.get(key);

      if (existing) {
        existing.push(story);
      } else {
        grouped.set(key, [story]);
      }
    }

    /* --------------------------------------------------------
     * BUILD GROUPS
     * -------------------------------------------------------- */

    const groups = Array.from(grouped.values())
      .map((stories) => {
        stories.sort((a, b) => {
          if (a.viewed !== b.viewed) {
            return a.viewed ? 1 : -1;
          }

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
        if (b.score !== a.score) {
          return b.score - a.score;
        }

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

    /**
     * Fonction publique :
     * stories actives + highlights.
     */
    const stories = await ctx.db
      .query("stories")
      .withIndex("by_author", (q) => q.eq("authorId", args.authorId))
      .order("desc")
      .take(MAX_AUTHOR_STORIES);

    return stories.filter(
      (story) => story.expiresAt > now || story.isHighlight,
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

    return stories.filter(
      (story) => story.expiresAt > now || story.isHighlight,
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

    if (followedIds.size === 0) {
      return [];
    }

    const now = nowIso();

    const stories = await ctx.db
      .query("stories")
      .withIndex("by_expiresAt", (q) => q.gt("expiresAt", now))
      .order("desc")
      .take(MAX_FOLLOWED_STORIES);

    const followedStories = stories.filter((story) =>
      followedIds.has(String(story.authorId)),
    );

    if (followedStories.length === 0) {
      return [];
    }

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

    const enriched = followedStories.map((story) => {
      const author = authorById.get(String(story.authorId));

      return {
        ...story,

        authorName: author?.name ?? "Anonyme",

        authorAvatar: author?.avatar,

        authorCity: author?.city,

        viewed: viewedStoryIds.has(String(story._id)),
      };
    });

    const grouped = new Map<string, typeof enriched>();

    for (const story of enriched) {
      const key = String(story.authorId);

      const existing = grouped.get(key);

      if (existing) {
        existing.push(story);
      } else {
        grouped.set(key, [story]);
      }
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

    if (!story) {
      return null;
    }

    /**
     * Les stories expirées ne sont plus exposées
     * par cette route, sauf si elles sont en highlight.
     */
    const now = nowIso();

    if (!isStoryActive(story.expiresAt, now) && !story.isHighlight) {
      return null;
    }

    const author = await ctx.db.get(story.authorId);

    return {
      ...story,

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

    /**
     * Une story expirée ne doit pas recevoir
     * de nouvelle vue.
     */
    const now = nowIso();

    if (!isStoryActive(story.expiresAt, now)) {
      return {
        alreadyViewed: false,
        counted: false,
        expired: true,
      };
    }

    /**
     * L'auteur ne compte pas sa propre vue.
     */
    if (story.authorId === user._id) {
      return {
        alreadyViewed: false,
        counted: false,
        expired: false,
      };
    }

    /**
     * Le schéma actuel ne possède pas encore
     * by_story_viewer.
     *
     * On utilise donc by_story + filtre viewerId.
     * Cette opération reste bornée par first().
     */
    const existing = await ctx.db
      .query("storyViews")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .filter((q) => q.eq(q.field("viewerId"), user._id))
      .first();

    if (existing) {
      return {
        alreadyViewed: true,
        counted: false,
        expired: false,
      };
    }

    await ctx.db.insert("storyViews", {
      storyId: args.storyId,

      viewerId: user._id,

      viewedAt: nowIso(),
    });

    /**
     * Mutation atomique dans le même contexte.
     *
     * La story a déjà été lue avant l'insertion,
     * donc le compteur ne peut être incrémenté
     * qu'une seule fois par viewer dans le flux normal.
     */
    await ctx.db.patch(args.storyId, {
      viewCount: story.viewCount + 1,
    });

    return {
      alreadyViewed: false,
      counted: true,
      expired: false,
    };
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

    /**
     * Seul l'auteur peut voir les spectateurs.
     */
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

    const viewerIds = views.map((view) => view.viewerId);

    const viewerById = await getAuthorsMap(ctx, viewerIds);

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

    /**
     * Payload borné.
     *
     * Le schéma actuel ne possède pas d'agrégation
     * native des vues par story.
     */
    const views = await ctx.db
      .query("storyViews")
      .withIndex("by_story", (q) => q.eq("storyId", story._id))
      .order("desc")
      .take(MAX_ANALYTICS_VIEWS);

    const uniqueViewers = new Set(views.map((view) => String(view.viewerId)));

    const viewedAt = views.map((view) => view.viewedAt).sort();

    return {
      storyId: story._id,

      /**
       * Si le nombre réel de vues dépasse
       * la fenêtre analytique, viewCount reste
       * la source de vérité du compteur.
       */
      viewCount: story.viewCount,

      uniqueViewers: uniqueViewers.size,

      firstViewAt: viewedAt[0] ?? null,

      lastViewAt: viewedAt[viewedAt.length - 1] ?? null,

      isHighlight: story.isHighlight,

      expiresAt: story.expiresAt,

      mediaType: story.mediaType,

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

    await ctx.db.patch(args.storyId, {
      isHighlight: nextValue,
    });

    return {
      isHighlight: nextValue,
    };
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

    return {
      author: author
        ? {
            id: author._id,

            name: author.name ?? "Anonyme",

            avatar: author.avatar,

            city: author.city,
          }
        : null,

      stories,
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

    /**
     * Suppression bornée.
     *
     * Une story avec un très grand nombre de vues
     * ne doit pas provoquer un .collect() illimité.
     *
     * IMPORTANT :
     * le document story n'est supprimé que lorsque
     * toutes ses vues ont été supprimées.
     */
    const views = await ctx.db
      .query("storyViews")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .take(DELETE_VIEW_BATCH);

    if (views.length > 0) {
      await Promise.all(views.map((view) => ctx.db.delete(view._id)));

      /**
       * Si le batch est plein, on ne détruit pas encore
       * la story : les vues restantes doivent être
       * nettoyées lors d'une opération suivante.
       */
      if (views.length >= DELETE_VIEW_BATCH) {
        return {
          success: false,
          pendingCleanup: true,
          deletedViews: views.length,
          storyId: args.storyId,
        };
      }
    }

    /**
     * À ce stade, aucune vue restante n'est visible
     * dans la requête bornée.
     */
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

/**
 * Internal uniquement.
 *
 * Cette fonction ne doit jamais être exposée directement
 * au client.
 *
 * Elle supprime uniquement :
 * - stories expirées
 * - non-highlight
 *
 * et nettoie leurs vues.
 *
 * Le batch de stories est volontairement borné.
 */
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
      /**
       * Nettoyage borné des vues.
       */
      const views = await ctx.db
        .query("storyViews")
        .withIndex("by_story", (q) => q.eq("storyId", story._id))
        .take(DELETE_VIEW_BATCH);

      if (views.length > 0) {
        await Promise.all(views.map((view) => ctx.db.delete(view._id)));

        deletedViews += views.length;
      }

      /**
       * Si le batch est plein, il peut rester des vues.
       * On ne supprime donc pas encore la story.
       */
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

      await ctx.db.delete(story._id);

      deletedStories++;
    }

    return {
      deletedStories,
      deletedViews,
      deferredStories,
    };
  },
});

/* ============================================================
 * EXPORT
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
