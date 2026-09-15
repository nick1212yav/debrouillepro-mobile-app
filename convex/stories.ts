import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

import type { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * ============================================================
 * DÉBROUILLEPRO
 * STORIES ENGINE 2.0
 * ============================================================
 *
 * Responsabilités :
 *
 * - Upload sécurisé
 * - Création de stories
 * - Feed intelligent
 * - Ranking personnalisé
 * - Détection des stories vues
 * - Stories suivies
 * - Stories personnelles
 * - Highlights
 * - Analytics
 * - Gestion des vues
 * - Suppression sécurisée
 * - Expiration automatique
 *
 * IMPORTANT :
 * Cette version utilise uniquement les tables/champs déjà
 * présents dans le backend actuel :
 *
 * users
 * stories
 * storyViews
 * follows
 *
 * Aucune table supplémentaire n'est supposée.
 * ============================================================
 */

/* ============================================================
 * TYPES INTERNES
 * ============================================================ */

type StoryWithAuthor = {
  _id: string;
  _creationTime: number;

  authorId: string;

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
 * Une story très récente reçoit un score élevé.
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
 * Score d'engagement.
 *
 * On utilise uniquement viewCount car c'est la métrique
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
 * Score relation.
 *
 * Les personnes suivies passent devant les autres.
 */
function relationScore(isFollowed: boolean, isOwner: boolean): number {
  if (isOwner) return 110;
  if (isFollowed) return 100;

  return 20;
}

/**
 * Score de lecture.
 *
 * Les stories non vues sont fortement privilégiées.
 */
function viewedScore(viewed: boolean): number {
  return viewed ? 0 : 90;
}

/**
 * Score final.
 *
 * La priorité est :
 *
 * 1. relation
 * 2. non-vu
 * 3. fraîcheur
 * 4. engagement
 */
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

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const storyId = await ctx.db.insert("stories", {
      ...args,

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
 *
 * Retourne toutes les stories actives regroupées par auteur.
 * ============================================================ */

export const listActiveStories = query({
  args: {},

  handler: async (ctx) => {
    const now = nowIso();

    const stories = await ctx.db
      .query("stories")
      .withIndex("by_expiresAt")
      .order("asc")
      .collect();

    const active = stories.filter((story) =>
      isStoryActive(story.expiresAt, now),
    );

    const enriched = await Promise.all(
      active.map(async (story) => {
        const author = await ctx.db.get(story.authorId);

        return {
          ...story,
          authorName: author?.name ?? "Anonyme",
          authorAvatar: author?.avatar,
          authorCity: author?.city,
        };
      }),
    );

    const grouped: Record<string, typeof enriched> = {};

    for (const story of enriched) {
      const key = String(story.authorId);

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(story);
    }

    return Object.values(grouped).map((group) => ({
      author: {
        id: group[0].authorId,
        name: group[0].authorName,
        avatar: group[0].authorAvatar,
        city: group[0].authorCity,
      },

      stories: group,

      hasUnviewed: false,
    }));
  },
});

/* ============================================================
 * STORY FEED 2.0
 *
 * Le cerveau du système.
 *
 * - Authentifie l'utilisateur
 * - Récupère ses follows
 * - Récupère les stories actives
 * - Détermine les stories vues
 * - Calcule un score
 * - Classe les auteurs
 * - Classe les stories à l'intérieur des groupes
 *
 * Aucun mock.
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
      .collect();

    const followedIds = new Set(
      follows.map((follow) => String(follow.followingId)),
    );

    /* --------------------------------------------------------
     * STORIES ACTIVES
     * -------------------------------------------------------- */

    const allStories = await ctx.db
      .query("stories")
      .withIndex("by_expiresAt")
      .order("desc")
      .collect();

    const activeStories = allStories.filter((story) =>
      isStoryActive(story.expiresAt, now),
    );

    /* --------------------------------------------------------
     * ENRICHISSEMENT
     * -------------------------------------------------------- */

    const enriched: Array<
      StoryWithAuthor & {
        score: number;
        isFollowed: boolean;
        isOwner: boolean;
      }
    > = [];

    for (const story of activeStories) {
      const author = await ctx.db.get(story.authorId);

      if (!author) {
        continue;
      }

      const view = await ctx.db
        .query("storyViews")
        .withIndex("by_story", (q) => q.eq("storyId", story._id))
        .filter((q) => q.eq(q.field("viewerId"), user._id))
        .first();

      const viewed = view !== null;

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

    const grouped: Record<string, typeof enriched> = {};

    for (const story of enriched) {
      const key = String(story.authorId);

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(story);
    }

    /* --------------------------------------------------------
     * BUILD GROUPS
     * -------------------------------------------------------- */

    const groups = Object.values(grouped)
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

    /* --------------------------------------------------------
     * RETURN
     * -------------------------------------------------------- */

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
      .collect();

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
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return [];
    }

    const now = nowIso();

    const stories = await ctx.db
      .query("stories")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .order("desc")
      .collect();

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
      .collect();

    const followedIds = new Set(
      follows.map((follow) => String(follow.followingId)),
    );

    if (followedIds.size === 0) {
      return [];
    }

    const now = nowIso();

    const stories = await ctx.db
      .query("stories")
      .withIndex("by_expiresAt")
      .order("desc")
      .collect();

    const followedStories = stories.filter(
      (story) =>
        story.expiresAt > now && followedIds.has(String(story.authorId)),
    );

    const enriched = await Promise.all(
      followedStories.map(async (story) => {
        const author = await ctx.db.get(story.authorId);

        const view = await ctx.db
          .query("storyViews")
          .withIndex("by_story", (q) => q.eq("storyId", story._id))
          .filter((q) => q.eq(q.field("viewerId"), user._id))
          .first();

        return {
          ...story,

          authorName: author?.name ?? "Anonyme",
          authorAvatar: author?.avatar,
          authorCity: author?.city,

          viewed: view !== null,
        };
      }),
    );

    /* ------------------------------------------------------
     * GROUP
     * ------------------------------------------------------ */

    const grouped: Record<string, typeof enriched> = {};

    for (const story of enriched) {
      const key = String(story.authorId);

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(story);
    }

    return Object.values(grouped).map((group) => ({
      author: {
        id: group[0].authorId,
        name: group[0].authorName,
        avatar: group[0].authorAvatar,
        city: group[0].authorCity,
      },

      stories: group,

      hasUnviewed: group.some((story) => !story.viewed),
    }));
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

    /*
     * Une story de l'auteur lui-même
     * n'a pas besoin d'être comptée
     * comme une vue externe.
     */

    if (story.authorId === user._id) {
      return {
        alreadyViewed: false,
        counted: false,
      };
    }

    const existing = await ctx.db
      .query("storyViews")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .filter((q) => q.eq(q.field("viewerId"), user._id))
      .first();

    if (existing) {
      return {
        alreadyViewed: true,
        counted: false,
      };
    }

    await ctx.db.insert("storyViews", {
      storyId: args.storyId,
      viewerId: user._id,
      viewedAt: nowIso(),
    });

    await ctx.db.patch(args.storyId, {
      viewCount: story.viewCount + 1,
    });

    return {
      alreadyViewed: false,
      counted: true,
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

    /*
     * Seul l'auteur peut voir
     * la liste des viewers.
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
      .take(100);

    return Promise.all(
      views.map(async (view) => {
        const viewer = await ctx.db.get(view.viewerId);

        return {
          ...view,

          viewerName: viewer?.name ?? "Anonyme",
          viewerAvatar: viewer?.avatar,
          viewerCity: viewer?.city,
        };
      }),
    );
  },
});

/* ============================================================
 * STORY ANALYTICS
 *
 * Analytics disponibles avec le schéma actuel.
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
      .collect();

    const viewers = new Set(views.map((view) => String(view.viewerId)));

    const viewedAt = views.map((view) => view.viewedAt).sort();

    return {
      storyId: story._id,

      viewCount: story.viewCount,

      uniqueViewers: viewers.size,

      firstViewAt: viewedAt[0] ?? null,

      lastViewAt: viewedAt[viewedAt.length - 1] ?? null,

      isHighlight: story.isHighlight,

      expiresAt: story.expiresAt,

      mediaType: story.mediaType,
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

    await ctx.db.patch(args.storyId, {
      isHighlight: !story.isHighlight,
    });

    return {
      isHighlight: !story.isHighlight,
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

    /*
     * Nettoyage des vues
     */

    const views = await ctx.db
      .query("storyViews")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .collect();

    await Promise.all(views.map((view) => ctx.db.delete(view._id)));

    /*
     * Suppression de la story
     */

    await ctx.db.delete(args.storyId);

    return {
      success: true,
      storyId: args.storyId,
    };
  },
});

/* ============================================================
 * CLEANUP
 *
 * Les stories expirées sont supprimées si elles ne sont
 * pas dans les highlights.
 * ============================================================ */

export const cleanupExpiredStories = internalMutation({
  args: {},

  handler: async (ctx) => {
    const now = nowIso();

    const expired = await ctx.db
      .query("stories")
      .withIndex("by_expiresAt")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .filter((q) => q.eq(q.field("isHighlight"), false))
      .take(100);

    let deletedStories = 0;
    let deletedViews = 0;

    for (const story of expired) {
      const views = await ctx.db
        .query("storyViews")
        .withIndex("by_story", (q) => q.eq("storyId", story._id))
        .collect();

      await Promise.all(views.map((view) => ctx.db.delete(view._id)));

      deletedViews += views.length;

      await ctx.db.delete(story._id);

      deletedStories++;
    }

    return {
      deletedStories,
      deletedViews,
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
