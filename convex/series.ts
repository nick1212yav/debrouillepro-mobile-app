import { v, ConvexError } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

/* ============================================================================
 * SERIES — PRODUCTION
 * ----------------------------------------------------------------------------
 * Principes :
 * - Authentification côté serveur
 * - Ownership côté serveur
 * - Validation des entrées côté serveur
 * - Brouillons privés
 * - Données bornées et paginées
 * - Index Convex utilisés
 * - Aucun faux résultat
 * - Aucun compteur négatif
 * - Progression vérifiée contre les épisodes réels
 * - Mutations idempotentes autant que possible
 * ========================================================================== */

/* ============================================================================
 * CONSTANTES
 * ========================================================================== */

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_TAG_LENGTH = 40;
const MAX_TAGS = 20;

const MIN_TITLE_LENGTH = 2;
const MIN_DESCRIPTION_LENGTH = 2;

const VALID_CATEGORIES = new Set([
  "Agriculture",
  "Business",
  "Éducation",
  "Santé",
  "Tech",
  "Voyage",
  "Cuisine",
  "Autre",
]);

const VALID_STATUSES = new Set(["active", "completed", "draft"]);

type SeriesStatus = "active" | "completed" | "draft";

/* ============================================================================
 * HELPERS — AUTH
 * ========================================================================== */

/**
 * Le helper est utilisable depuis une query ET une mutation.
 *
 * Aucun cast artificiel vers MutationCtx.
 */
async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError({
      message: "Non authentifié",
      code: "UNAUTHENTICATED",
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
      message: "Utilisateur introuvable",
      code: "NOT_FOUND",
    });
  }

  return user;
}

async function getOptionalUser(ctx: QueryCtx): Promise<Doc<"users"> | null> {
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

/* ============================================================================
 * HELPERS — VALIDATION
 * ========================================================================== */

function normalizeText(
  value: string,
  field: string,
  maxLength: number,
): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new ConvexError({
      message: `${field} est obligatoire`,
      code: "VALIDATION_ERROR",
    });
  }

  if (normalized.length > maxLength) {
    throw new ConvexError({
      message: `${field} est trop long`,
      code: "VALIDATION_ERROR",
    });
  }

  return normalized;
}

function normalizeTitle(title: string): string {
  const normalized = normalizeText(title, "Le titre", MAX_TITLE_LENGTH);

  if (normalized.length < MIN_TITLE_LENGTH) {
    throw new ConvexError({
      message: "Le titre est trop court",
      code: "VALIDATION_ERROR",
    });
  }

  return normalized;
}

function normalizeDescription(description: string): string {
  const normalized = normalizeText(
    description,
    "La description",
    MAX_DESCRIPTION_LENGTH,
  );

  if (normalized.length < MIN_DESCRIPTION_LENGTH) {
    throw new ConvexError({
      message: "La description est trop courte",
      code: "VALIDATION_ERROR",
    });
  }

  return normalized;
}

function normalizeCategory(category: string): string {
  const normalized = category.trim();

  if (!VALID_CATEGORIES.has(normalized)) {
    throw new ConvexError({
      message: "Catégorie invalide",
      code: "VALIDATION_ERROR",
    });
  }

  return normalized;
}

function normalizeTags(tags: string[]): string[] {
  if (tags.length > MAX_TAGS) {
    throw new ConvexError({
      message: `Maximum ${MAX_TAGS} tags`,
      code: "VALIDATION_ERROR",
    });
  }

  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => tag.slice(0, MAX_TAG_LENGTH)),
    ),
  );
}

function validateStatus(status: SeriesStatus): void {
  if (!VALID_STATUSES.has(status)) {
    throw new ConvexError({
      message: "Statut invalide",
      code: "VALIDATION_ERROR",
    });
  }
}

/* ============================================================================
 * HELPERS — OWNERSHIP
 * ========================================================================== */

function requireOwnership(series: Doc<"series">, userId: Id<"users">): void {
  if (series.creatorId !== userId) {
    throw new ConvexError({
      message: "Vous n'êtes pas autorisé à modifier cette série",
      code: "FORBIDDEN",
    });
  }
}

/* ============================================================================
 * HELPERS — CREATOR
 * ========================================================================== */

async function getCreator(
  ctx: QueryCtx,
  creatorId: Id<"users">,
): Promise<{
  _id: Id<"users">;
  name?: string;
  avatar?: string;
} | null> {
  const creator = await ctx.db.get(creatorId);

  if (!creator) {
    return null;
  }

  return {
    _id: creator._id,
    name: creator.name,
    avatar: creator.avatar,
  };
}

/* ============================================================================
 * QUERY — LIST SERIES
 * ========================================================================== */

export const listSeries = query({
  args: {
    paginationOpts: paginationOptsValidator,

    creatorId: v.optional(v.id("users")),

    status: v.optional(
      v.union(v.literal("active"), v.literal("completed"), v.literal("draft")),
    ),
  },

  handler: async (
    ctx,
    args,
  ): Promise<{
    page: Array<
      Doc<"series"> & {
        creator: {
          name?: string;
          avatar?: string;
        } | null;
        subscribedByMe: boolean;
      }
    >;
    isDone: boolean;
    continueCursor: string;
  }> => {
    const currentUser = await getOptionalUser(ctx);

    /*
     * Les brouillons sont privés.
     *
     * Si un client demande explicitement "draft",
     * il doit être authentifié et propriétaire.
     */
    if (args.status === "draft") {
      if (!currentUser) {
        return {
          page: [],
          isDone: true,
          continueCursor: "",
        };
      }

      if (args.creatorId && args.creatorId !== currentUser._id) {
        return {
          page: [],
          isDone: true,
          continueCursor: "",
        };
      }
    }

    /*
     * Pour les séries publiques, on utilise les index existants.
     *
     * creatorId → by_creator
     * sinon status → by_status
     */
    const baseQuery = args.creatorId
      ? ctx.db
          .query("series")
          .withIndex("by_creator", (q) => q.eq("creatorId", args.creatorId!))
      : ctx.db
          .query("series")
          .withIndex("by_status", (q) =>
            q.eq("status", args.status ?? "active"),
          );

    const results = await baseQuery.order("desc").paginate(args.paginationOpts);

    const page = await Promise.all(
      results.page.map(async (series) => {
        /*
         * Protection supplémentaire :
         * un draft ne doit jamais sortir publiquement.
         */
        if (series.status === "draft") {
          if (!currentUser || series.creatorId !== currentUser._id) {
            return null;
          }
        }

        const creator = await getCreator(ctx, series.creatorId);

        const subscribedByMe = currentUser
          ? !!(await ctx.db
              .query("seriesSubscriptions")
              .withIndex("by_user_and_series", (q) =>
                q.eq("userId", currentUser._id).eq("seriesId", series._id),
              )
              .unique())
          : false;

        return {
          ...series,
          creator: creator
            ? {
                name: creator.name,
                avatar: creator.avatar,
              }
            : null,
          subscribedByMe,
        };
      }),
    );

    return {
      page: page.filter(
        (item): item is NonNullable<typeof item> => item !== null,
      ),
      isDone: results.isDone,
      continueCursor: results.continueCursor,
    };
  },
});

/* ============================================================================
 * QUERY — SERIES DETAIL
 * ========================================================================== */

export const getSeriesById = query({
  args: {
    seriesId: v.id("series"),
  },

  handler: async (
    ctx,
    args,
  ): Promise<
    | (Doc<"series"> & {
        creator: {
          _id: Id<"users">;
          name?: string;
          avatar?: string;
        } | null;

        episodes: Array<
          Doc<"seriesEpisodes"> & {
            publication: Doc<"publications"> | null;
          }
        >;

        subscribedByMe: boolean;

        progress: Doc<"seriesProgress"> | null;
      })
    | null
  > => {
    const series = await ctx.db.get(args.seriesId);

    if (!series) {
      return null;
    }

    const currentUser = await getOptionalUser(ctx);

    /*
     * Les drafts sont accessibles uniquement
     * à leur créateur.
     */
    if (
      series.status === "draft" &&
      (!currentUser || series.creatorId !== currentUser._id)
    ) {
      return null;
    }

    const creator = await getCreator(ctx, series.creatorId);

    /*
     * Les épisodes sont récupérés via
     * l'index by_series_and_order.
     */
    const rawEpisodes = await ctx.db
      .query("seriesEpisodes")
      .withIndex("by_series_and_order", (q) => q.eq("seriesId", args.seriesId))
      .order("asc")
      .collect();

    const episodes = await Promise.all(
      rawEpisodes.map(async (episode) => ({
        ...episode,
        publication: await ctx.db.get(episode.publicationId),
      })),
    );

    const subscribedByMe = currentUser
      ? !!(await ctx.db
          .query("seriesSubscriptions")
          .withIndex("by_user_and_series", (q) =>
            q.eq("userId", currentUser._id).eq("seriesId", args.seriesId),
          )
          .unique())
      : false;

    const progress = currentUser
      ? await ctx.db
          .query("seriesProgress")
          .withIndex("by_user_and_series", (q) =>
            q.eq("userId", currentUser._id).eq("seriesId", args.seriesId),
          )
          .unique()
      : null;

    return {
      ...series,
      creator,
      episodes,
      subscribedByMe,
      progress,
    };
  },
});

/* ============================================================================
 * QUERY — MES ABONNEMENTS
 * ========================================================================== */

export const getMySubscriptions = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },

  handler: async (
    ctx,
    args,
  ): Promise<{
    page: Array<
      Doc<"series"> & {
        creator: {
          name?: string;
          avatar?: string;
        } | null;

        progress: Doc<"seriesProgress"> | null;
      }
    >;

    isDone: boolean;

    continueCursor: string;
  }> => {
    /*
     * IMPORTANT :
     * getMySubscriptions est une QUERY.
     *
     * requireUser accepte désormais QueryCtx | MutationCtx,
     * donc aucune conversion de contexte n'est nécessaire.
     */
    const user = await requireUser(ctx);

    const subscriptions = await ctx.db
      .query("seriesSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);

    const page = await Promise.all(
      subscriptions.page.map(async (subscription) => {
        const series = await ctx.db.get(subscription.seriesId);

        /*
         * Une subscription orpheline
         * ne doit pas casser la page.
         */
        if (!series) {
          return null;
        }

        /*
         * Un draft éventuellement
         * anciennement abonné reste privé.
         */
        if (series.status === "draft" && series.creatorId !== user._id) {
          return null;
        }

        const creator = await getCreator(ctx, series.creatorId);

        const progress = await ctx.db
          .query("seriesProgress")
          .withIndex("by_user_and_series", (q) =>
            q.eq("userId", user._id).eq("seriesId", subscription.seriesId),
          )
          .unique();

        return {
          ...series,

          creator: creator
            ? {
                name: creator.name,
                avatar: creator.avatar,
              }
            : null,

          progress,
        };
      }),
    );

    return {
      page: page.filter(
        (item): item is NonNullable<typeof item> => item !== null,
      ),

      isDone: subscriptions.isDone,

      continueCursor: subscriptions.continueCursor,
    };
  },
});

/* ============================================================================
 * MUTATION — CREATE SERIES
 * ========================================================================== */

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

    const title = normalizeTitle(args.title);

    const description = normalizeDescription(args.description);

    const category = normalizeCategory(args.category);

    const tags = normalizeTags(args.tags);

    /*
     * La série est créée en draft.
     * Elle ne devient publique qu'après
     * publication explicite par updateSeries.
     */
    return await ctx.db.insert("series", {
      title,
      description,
      category,
      tags,

      ...(args.coverImage
        ? {
            coverImage: args.coverImage.trim(),
          }
        : {}),

      creatorId: user._id,

      episodeCount: 0,

      subscriberCount: 0,

      status: "draft",
    });
  },
});

/* ============================================================================
 * MUTATION — UPDATE SERIES
 * ========================================================================== */

export const updateSeries = mutation({
  args: {
    seriesId: v.id("series"),

    title: v.optional(v.string()),

    description: v.optional(v.string()),

    category: v.optional(v.string()),

    tags: v.optional(v.array(v.string())),

    coverImage: v.optional(v.string()),

    status: v.optional(
      v.union(v.literal("active"), v.literal("completed"), v.literal("draft")),
    ),
  },

  handler: async (ctx, args): Promise<void> => {
    const user = await requireUser(ctx);

    const series = await ctx.db.get(args.seriesId);

    if (!series) {
      throw new ConvexError({
        message: "Série introuvable",
        code: "NOT_FOUND",
      });
    }

    requireOwnership(series, user._id);

    const updates: {
      title?: string;
      description?: string;
      category?: string;
      tags?: string[];
      coverImage?: string;
      status?: SeriesStatus;
    } = {};

    if (args.title !== undefined) {
      updates.title = normalizeTitle(args.title);
    }

    if (args.description !== undefined) {
      updates.description = normalizeDescription(args.description);
    }

    if (args.category !== undefined) {
      updates.category = normalizeCategory(args.category);
    }

    if (args.tags !== undefined) {
      updates.tags = normalizeTags(args.tags);
    }

    if (args.coverImage !== undefined) {
      const cover = args.coverImage.trim();

      if (cover.length > 0) {
        updates.coverImage = cover;
      }
    }

    if (args.status !== undefined) {
      validateStatus(args.status);

      /*
       * Une série ne peut pas être
       * marquée "completed" sans épisode.
       */
      if (args.status === "completed" && series.episodeCount <= 0) {
        throw new ConvexError({
          message: "Une série sans épisode ne peut pas être terminée",
          code: "VALIDATION_ERROR",
        });
      }

      updates.status = args.status;
    }

    if (Object.keys(updates).length === 0) {
      return;
    }

    await ctx.db.patch(args.seriesId, updates);
  },
});

/* ============================================================================
 * MUTATION — ADD EPISODE
 * ========================================================================== */

export const addEpisode = mutation({
  args: {
    seriesId: v.id("series"),

    publicationId: v.id("publications"),

    title: v.string(),
  },

  handler: async (ctx, args): Promise<Id<"seriesEpisodes">> => {
    const user = await requireUser(ctx);

    const series = await ctx.db.get(args.seriesId);

    if (!series) {
      throw new ConvexError({
        message: "Série introuvable",
        code: "NOT_FOUND",
      });
    }

    requireOwnership(series, user._id);

    /*
     * L'épisode doit pointer vers
     * une publication réelle.
     */
    const publication = await ctx.db.get(args.publicationId);

    if (!publication) {
      throw new ConvexError({
        message: "Publication introuvable",
        code: "NOT_FOUND",
      });
    }

    const title = normalizeTitle(args.title);

    /*
     * Empêche les numéros d'épisode
     * incohérents avec le compteur.
     */
    const episodeNumber = series.episodeCount + 1;

    const episodeId = await ctx.db.insert("seriesEpisodes", {
      seriesId: args.seriesId,

      publicationId: args.publicationId,

      episodeNumber,

      title,
    });

    await ctx.db.patch(args.seriesId, {
      episodeCount: episodeNumber,
    });

    return episodeId;
  },
});

/* ============================================================================
 * MUTATION — TOGGLE SUBSCRIPTION
 * ========================================================================== */

export const toggleSubscription = mutation({
  args: {
    seriesId: v.id("series"),
  },

  handler: async (
    ctx,
    args,
  ): Promise<{
    subscribed: boolean;
  }> => {
    const user = await requireUser(ctx);

    const series = await ctx.db.get(args.seriesId);

    if (!series) {
      throw new ConvexError({
        message: "Série introuvable",
        code: "NOT_FOUND",
      });
    }

    /*
     * Les drafts ne sont jamais
     * abonnables.
     */
    if (series.status === "draft") {
      throw new ConvexError({
        message: "Cette série n'est pas encore publiée",
        code: "SERIES_NOT_PUBLIC",
      });
    }

    const existing = await ctx.db
      .query("seriesSubscriptions")
      .withIndex("by_user_and_series", (q) =>
        q.eq("userId", user._id).eq("seriesId", args.seriesId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);

      await ctx.db.patch(args.seriesId, {
        subscriberCount: Math.max(0, series.subscriberCount - 1),
      });

      return {
        subscribed: false,
      };
    }

    await ctx.db.insert("seriesSubscriptions", {
      seriesId: args.seriesId,

      userId: user._id,
    });

    await ctx.db.patch(args.seriesId, {
      subscriberCount: series.subscriberCount + 1,
    });

    return {
      subscribed: true,
    };
  },
});

/* ============================================================================
 * MUTATION — UPDATE PROGRESS
 * ========================================================================== */

export const updateProgress = mutation({
  args: {
    seriesId: v.id("series"),

    episodeNumber: v.number(),
  },

  handler: async (ctx, args): Promise<void> => {
    const user = await requireUser(ctx);

    if (!Number.isSafeInteger(args.episodeNumber) || args.episodeNumber <= 0) {
      throw new ConvexError({
        message: "Numéro d'épisode invalide",
        code: "VALIDATION_ERROR",
      });
    }

    const series = await ctx.db.get(args.seriesId);

    if (!series) {
      throw new ConvexError({
        message: "Série introuvable",
        code: "NOT_FOUND",
      });
    }

    /*
     * Impossible de valider une progression
     * au-delà du nombre réel d'épisodes.
     */
    if (args.episodeNumber > series.episodeCount) {
      throw new ConvexError({
        message: "Cet épisode n'existe pas",
        code: "EPISODE_NOT_FOUND",
      });
    }

    /*
     * Vérification supplémentaire :
     * le numéro doit réellement exister
     * dans seriesEpisodes.
     */
    const episode = await ctx.db
      .query("seriesEpisodes")
      .withIndex("by_series_and_order", (q) => q.eq("seriesId", args.seriesId))
      .filter((q) => q.eq(q.field("episodeNumber"), args.episodeNumber))
      .first();

    if (!episode) {
      throw new ConvexError({
        message: "Cet épisode n'existe pas",
        code: "EPISODE_NOT_FOUND",
      });
    }

    const existing = await ctx.db
      .query("seriesProgress")
      .withIndex("by_user_and_series", (q) =>
        q.eq("userId", user._id).eq("seriesId", args.seriesId),
      )
      .unique();

    if (existing) {
      const completed = Array.from(
        new Set([...existing.completedEpisodes, args.episodeNumber]),
      ).sort((a, b) => a - b);

      await ctx.db.patch(existing._id, {
        lastEpisodeNumber: Math.max(
          existing.lastEpisodeNumber,
          args.episodeNumber,
        ),

        completedEpisodes: completed,
      });

      return;
    }

    await ctx.db.insert("seriesProgress", {
      seriesId: args.seriesId,

      userId: user._id,

      lastEpisodeNumber: args.episodeNumber,

      completedEpisodes: [args.episodeNumber],
    });
  },
});
