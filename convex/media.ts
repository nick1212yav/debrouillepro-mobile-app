import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const MAX_ARTICLES = 30;
const MAX_MY_ARTICLES = 20;
const MAX_STORIES = 50;
const MAX_MY_CAMPAIGNS = 20;
const MAX_ACTIVE_CAMPAIGNS = 10;
const MAX_OPEN_PROJECTS = 20;
const MAX_CREATED_PROJECTS = 10;
const MAX_PROJECT_CONTRIBUTIONS = 10;

const MAX_TITLE_LENGTH = 160;
const MAX_CONTENT_LENGTH = 100_000;
const MAX_EXCERPT_LENGTH = 500;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_URL_LENGTH = 4000;
const MAX_CAPTION_LENGTH = 2000;
const MAX_CATEGORY_LENGTH = 100;
const MAX_ROLE_LENGTH = 120;
const MAX_TARGET_AUDIENCE_LENGTH = 1000;
const MAX_CURRENCY_LENGTH = 20;
const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 80;

const STORY_DURATION_MAX_SECONDS = 24 * 60 * 60;
const MAX_CAMPAIGN_BUDGET = 1_000_000_000;

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATION
// ─────────────────────────────────────────────────────────────────────────────

async function requireUser(ctx: QueryCtx | MutationCtx) {
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

  if (user.isBanned === true) {
    throw new ConvexError({
      message: "Compte suspendu",
      code: "FORBIDDEN",
    });
  }

  return user;
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

function requireNonEmptyString(
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

function optionalString(
  value: string | undefined,
  field: string,
  maxLength: number,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim();

  if (!normalized) {
    return undefined;
  }

  if (normalized.length > maxLength) {
    throw new ConvexError({
      message: `${field} est trop long`,
      code: "VALIDATION_ERROR",
    });
  }

  return normalized;
}

function validateOptionalUrl(
  value: string | undefined,
  field: string,
): string | undefined {
  const normalized = optionalString(value, field, MAX_URL_LENGTH);

  if (normalized === undefined) {
    return undefined;
  }

  let parsed: URL;

  try {
    parsed = new URL(normalized);
  } catch {
    throw new ConvexError({
      message: `${field} doit être une URL valide`,
      code: "VALIDATION_ERROR",
    });
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new ConvexError({
      message: `${field} utilise un protocole non autorisé`,
      code: "VALIDATION_ERROR",
    });
  }

  return parsed.toString();
}

function requirePositiveNumber(
  value: number,
  field: string,
  max?: number,
): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ConvexError({
      message: `${field} doit être supérieur à zéro`,
      code: "VALIDATION_ERROR",
    });
  }

  if (max !== undefined && value > max) {
    throw new ConvexError({
      message: `${field} dépasse la limite autorisée`,
      code: "VALIDATION_ERROR",
    });
  }

  return value;
}

function validateDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime())) {
    throw new ConvexError({
      message: "Date de début invalide",
      code: "VALIDATION_ERROR",
    });
  }

  if (Number.isNaN(end.getTime())) {
    throw new ConvexError({
      message: "Date de fin invalide",
      code: "VALIDATION_ERROR",
    });
  }

  if (end.getTime() <= start.getTime()) {
    throw new ConvexError({
      message: "La date de fin doit être postérieure à la date de début",
      code: "VALIDATION_ERROR",
    });
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function normalizeTags(tags: string[]): string[] {
  if (tags.length > MAX_TAGS) {
    throw new ConvexError({
      message: `Un maximum de ${MAX_TAGS} tags est autorisé`,
      code: "VALIDATION_ERROR",
    });
  }

  const normalized = tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => {
      if (tag.length > MAX_TAG_LENGTH) {
        throw new ConvexError({
          message: `Un tag ne peut pas dépasser ${MAX_TAG_LENGTH} caractères`,
          code: "VALIDATION_ERROR",
        });
      }

      return tag;
    });

  return [...new Set(normalized)];
}

// ─────────────────────────────────────────────────────────────────────────────
// ARTICLE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getSafeLikeCount(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.floor(value);
}

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA — ARTICLES
// ─────────────────────────────────────────────────────────────────────────────

export const listPublishedArticles = query({
  args: {
    category: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const category = args.category?.trim();

    if (category !== undefined && category.length > MAX_CATEGORY_LENGTH) {
      throw new ConvexError({
        message: "La catégorie est trop longue",
        code: "VALIDATION_ERROR",
      });
    }

    const articlesQuery = ctx.db
      .query("mediaArticles")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .order("desc");

    if (!category || category === "Tout") {
      return await articlesQuery.take(MAX_ARTICLES);
    }

    return await articlesQuery
      .filter((q) => q.eq(q.field("category"), category))
      .take(MAX_ARTICLES);
  },
});

export const listMyArticles = query({
  args: {},

  handler: async (ctx) => {
    const user = await requireUser(ctx);

    return await ctx.db
      .query("mediaArticles")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .order("desc")
      .take(MAX_MY_ARTICLES);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// ARTICLES — CREATE PUBLISHED
// ─────────────────────────────────────────────────────────────────────────────

export const createPublishedArticle = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    excerpt: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    category: v.string(),
    tags: v.array(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const title = requireNonEmptyString(
      args.title,
      "Le titre",
      MAX_TITLE_LENGTH,
    );

    const content = requireNonEmptyString(
      args.content,
      "Le contenu",
      MAX_CONTENT_LENGTH,
    );

    const excerpt = optionalString(
      args.excerpt,
      "L'extrait",
      MAX_EXCERPT_LENGTH,
    );

    const coverImage = validateOptionalUrl(args.coverImage, "coverImage");

    const category = requireNonEmptyString(
      args.category,
      "La catégorie",
      MAX_CATEGORY_LENGTH,
    );

    const tags = normalizeTags(args.tags);

    const publishedAt = new Date().toISOString();

    return await ctx.db.insert("mediaArticles", {
      authorId: user._id,
      title,
      content,
      excerpt,
      coverImage,
      category,
      tags,
      viewCount: 0,
      likeCount: 0,
      status: "published",
      publishedAt,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// ARTICLES — LIKE
// ─────────────────────────────────────────────────────────────────────────────

export const likeArticle = mutation({
  args: {
    articleId: v.id("mediaArticles"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const article = await ctx.db.get(args.articleId);

    if (!article) {
      throw new ConvexError({
        message: "Article introuvable",
        code: "NOT_FOUND",
      });
    }

    if (article.status !== "published") {
      throw new ConvexError({
        message: "Cet article n'est pas disponible",
        code: "NOT_FOUND",
      });
    }

    const existingLike = await ctx.db
      .query("mediaArticleLikes")
      .withIndex("by_user_and_article", (q) =>
        q.eq("userId", user._id).eq("articleId", args.articleId),
      )
      .unique();

    const currentLikeCount = getSafeLikeCount(article.likeCount);

    // ───────────────────────────────────────────────────────────────────────
    // IDEMPOTENCE
    //
    // Si la relation existe déjà, le deuxième Like ne doit absolument pas
    // créer une nouvelle relation ni augmenter le compteur.
    // ───────────────────────────────────────────────────────────────────────

    if (existingLike) {
      return {
        liked: true,
        likeCount: currentLikeCount,
      };
    }

    await ctx.db.insert("mediaArticleLikes", {
      articleId: args.articleId,
      userId: user._id,
    });

    const nextLikeCount = currentLikeCount + 1;

    await ctx.db.patch(args.articleId, {
      likeCount: nextLikeCount,
    });

    return {
      liked: true,
      likeCount: nextLikeCount,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// ARTICLES — UNLIKE
// ─────────────────────────────────────────────────────────────────────────────

export const unlikeArticle = mutation({
  args: {
    articleId: v.id("mediaArticles"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const article = await ctx.db.get(args.articleId);

    if (!article) {
      throw new ConvexError({
        message: "Article introuvable",
        code: "NOT_FOUND",
      });
    }

    const existingLike = await ctx.db
      .query("mediaArticleLikes")
      .withIndex("by_user_and_article", (q) =>
        q.eq("userId", user._id).eq("articleId", args.articleId),
      )
      .unique();

    const currentLikeCount = getSafeLikeCount(article.likeCount);

    // ───────────────────────────────────────────────────────────────────────
    // IDEMPOTENCE
    //
    // Si aucune relation n'existe, le deuxième Unlike ne doit rien supprimer
    // et surtout ne doit pas diminuer le compteur.
    // ───────────────────────────────────────────────────────────────────────

    if (!existingLike) {
      return {
        liked: false,
        likeCount: currentLikeCount,
      };
    }

    await ctx.db.delete(existingLike._id);

    const nextLikeCount = Math.max(0, currentLikeCount - 1);

    await ctx.db.patch(args.articleId, {
      likeCount: nextLikeCount,
    });

    return {
      liked: false,
      likeCount: nextLikeCount,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// ARTICLES — LIKE STATE
// ─────────────────────────────────────────────────────────────────────────────

export const getArticleLikeState = query({
  args: {
    articleId: v.id("mediaArticles"),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // Une personne non connectée ne peut pas avoir de Like personnel.
    if (!identity) {
      return {
        liked: false,
      };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user || user.isBanned === true) {
      return {
        liked: false,
      };
    }

    const like = await ctx.db
      .query("mediaArticleLikes")
      .withIndex("by_user_and_article", (q) =>
        q.eq("userId", user._id).eq("articleId", args.articleId),
      )
      .unique();

    return {
      liked: like !== null,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// STORIES
// ─────────────────────────────────────────────────────────────────────────────

export const listActiveStories = query({
  args: {},

  handler: async (ctx) => {
    const now = new Date().toISOString();

    return await ctx.db
      .query("stories")
      .withIndex("by_expiresAt", (q) => q.gt("expiresAt", now))
      .order("asc")
      .take(MAX_STORIES);
  },
});

export const createStory = mutation({
  args: {
    mediaUrl: v.string(),
    mediaType: v.union(v.literal("image"), v.literal("video")),
    caption: v.optional(v.string()),
    duration: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const mediaUrl = validateOptionalUrl(args.mediaUrl, "mediaUrl");

    if (!mediaUrl) {
      throw new ConvexError({
        message: "mediaUrl est obligatoire",
        code: "VALIDATION_ERROR",
      });
    }

    const caption = optionalString(
      args.caption,
      "La légende",
      MAX_CAPTION_LENGTH,
    );

    if (args.duration !== undefined) {
      if (
        !Number.isFinite(args.duration) ||
        args.duration <= 0 ||
        args.duration > STORY_DURATION_MAX_SECONDS
      ) {
        throw new ConvexError({
          message: "La durée de la story est invalide",
          code: "VALIDATION_ERROR",
        });
      }
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return await ctx.db.insert("stories", {
      authorId: user._id,
      mediaUrl,
      mediaType: args.mediaType,
      caption,
      duration: args.duration,
      viewCount: 0,
      expiresAt,
      isHighlight: false,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// AD CAMPAIGNS — LIST
// ─────────────────────────────────────────────────────────────────────────────

export const listMyAdCampaigns = query({
  args: {},

  handler: async (ctx) => {
    const user = await requireUser(ctx);

    return await ctx.db
      .query("adCampaigns")
      .withIndex("by_advertiser", (q) => q.eq("advertiserId", user._id))
      .order("desc")
      .take(MAX_MY_CAMPAIGNS);
  },
});

export const listActiveAdCampaigns = query({
  args: {},

  handler: async (ctx) => {
    return await ctx.db
      .query("adCampaigns")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .take(MAX_ACTIVE_CAMPAIGNS);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// AD CAMPAIGNS — CREATE
// ─────────────────────────────────────────────────────────────────────────────

export const createAdCampaign = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    mediaUrl: v.optional(v.string()),
    targetUrl: v.optional(v.string()),
    budget: v.number(),
    currency: v.string(),
    targetAudience: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const title = requireNonEmptyString(
      args.title,
      "Le titre",
      MAX_TITLE_LENGTH,
    );

    const description = requireNonEmptyString(
      args.description,
      "La description",
      MAX_DESCRIPTION_LENGTH,
    );

    const mediaUrl = validateOptionalUrl(args.mediaUrl, "mediaUrl");
    const targetUrl = validateOptionalUrl(args.targetUrl, "targetUrl");

    const currency = requireNonEmptyString(
      args.currency,
      "La devise",
      MAX_CURRENCY_LENGTH,
    ).toUpperCase();

    const targetAudience = optionalString(
      args.targetAudience,
      "targetAudience",
      MAX_TARGET_AUDIENCE_LENGTH,
    );

    const budget = requirePositiveNumber(
      args.budget,
      "Le budget",
      MAX_CAMPAIGN_BUDGET,
    );

    const { start, end } = validateDateRange(args.startDate, args.endDate);

    return await ctx.db.insert("adCampaigns", {
      advertiserId: user._id,
      title,
      description,
      mediaUrl,
      targetUrl,
      budget,
      currency,
      spent: 0,
      impressions: 0,
      clicks: 0,
      targetAudience,
      startDate: start,
      endDate: end,
      status: "draft",
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// AD CAMPAIGNS — STATUS
// ─────────────────────────────────────────────────────────────────────────────

export const updateCampaignStatus = mutation({
  args: {
    campaignId: v.id("adCampaigns"),

    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed"),
    ),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const campaign = await ctx.db.get(args.campaignId);

    if (!campaign) {
      throw new ConvexError({
        message: "Campagne introuvable",
        code: "NOT_FOUND",
      });
    }

    if (campaign.advertiserId !== user._id) {
      throw new ConvexError({
        message: "Accès refusé",
        code: "FORBIDDEN",
      });
    }

    if (args.status === campaign.status) {
      return;
    }

    if (campaign.status === "completed") {
      throw new ConvexError({
        message: "Une campagne terminée ne peut plus être modifiée",
        code: "INVALID_STATUS_TRANSITION",
      });
    }

    if (args.status === "active") {
      const now = Date.now();
      const start = new Date(campaign.startDate).getTime();
      const end = new Date(campaign.endDate).getTime();

      if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
        throw new ConvexError({
          message: "Les dates de la campagne sont invalides",
          code: "VALIDATION_ERROR",
        });
      }

      if (end <= now) {
        throw new ConvexError({
          message: "Impossible d'activer une campagne déjà terminée",
          code: "CAMPAIGN_EXPIRED",
        });
      }
    }

    await ctx.db.patch(args.campaignId, {
      status: args.status,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// ADVERTISEMENT ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

export const getAdStats = query({
  args: {},

  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const campaigns = await ctx.db
      .query("adCampaigns")
      .withIndex("by_advertiser", (q) => q.eq("advertiserId", user._id))
      .take(MAX_MY_CAMPAIGNS);

    let totalImpressions = 0;
    let totalClicks = 0;
    let totalSpent = 0;
    let activeCampaigns = 0;

    for (const campaign of campaigns) {
      if (campaign.status === "active") {
        activeCampaigns += 1;
      }

      if (
        typeof campaign.impressions === "number" &&
        Number.isFinite(campaign.impressions) &&
        campaign.impressions >= 0
      ) {
        totalImpressions += campaign.impressions;
      }

      if (
        typeof campaign.clicks === "number" &&
        Number.isFinite(campaign.clicks) &&
        campaign.clicks >= 0
      ) {
        totalClicks += campaign.clicks;
      }

      if (
        typeof campaign.spent === "number" &&
        Number.isFinite(campaign.spent) &&
        campaign.spent >= 0
      ) {
        totalSpent += campaign.spent;
      }
    }

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns,
      totalImpressions,
      totalClicks,
      totalSpent,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// COLLABORATIVE PROJECTS — LIST
// ─────────────────────────────────────────────────────────────────────────────

export const listOpenProjects = query({
  args: {},

  handler: async (ctx) => {
    return await ctx.db
      .query("collaborativeProjects")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .order("desc")
      .take(MAX_OPEN_PROJECTS);
  },
});

export const listMyProjects = query({
  args: {},

  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const created = await ctx.db
      .query("collaborativeProjects")
      .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
      .order("desc")
      .take(MAX_CREATED_PROJECTS);

    const contributions = await ctx.db
      .query("projectContributors")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(MAX_PROJECT_CONTRIBUTIONS);

    const contributedProjects = await Promise.all(
      contributions.map((contribution) => ctx.db.get(contribution.projectId)),
    );

    const all = [
      ...created,
      ...contributedProjects.filter(
        (project): project is NonNullable<typeof project> => project !== null,
      ),
    ];

    const seen = new Set<string>();

    return all.filter((project) => {
      const projectId = String(project._id);

      if (seen.has(projectId)) {
        return false;
      }

      seen.add(projectId);
      return true;
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// COLLABORATIVE PROJECTS — CREATE
// ─────────────────────────────────────────────────────────────────────────────

export const createCollaborativeProject = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    coverImage: v.optional(v.string()),
    tags: v.array(v.string()),
    maxContributors: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const title = requireNonEmptyString(
      args.title,
      "Le titre",
      MAX_TITLE_LENGTH,
    );

    const description = requireNonEmptyString(
      args.description,
      "La description",
      MAX_DESCRIPTION_LENGTH,
    );

    const category = requireNonEmptyString(
      args.category,
      "La catégorie",
      MAX_CATEGORY_LENGTH,
    );

    const coverImage = validateOptionalUrl(args.coverImage, "coverImage");

    const tags = normalizeTags(args.tags);

    if (args.maxContributors !== undefined) {
      if (
        !Number.isInteger(args.maxContributors) ||
        args.maxContributors < 1 ||
        args.maxContributors > 1000
      ) {
        throw new ConvexError({
          message:
            "maxContributors doit être un entier compris entre 1 et 1000",
          code: "VALIDATION_ERROR",
        });
      }
    }

    const projectId = await ctx.db.insert("collaborativeProjects", {
      creatorId: user._id,
      title,
      description,
      category,
      coverImage,
      tags,
      maxContributors: args.maxContributors,
      contributorCount: 1,
      status: "open",
    });

    await ctx.db.insert("projectContributors", {
      projectId,
      userId: user._id,
      role: "créateur",
      joinedAt: new Date().toISOString(),
      status: "active",
    });

    return projectId;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// COLLABORATIVE PROJECTS — JOIN
// ─────────────────────────────────────────────────────────────────────────────

export const joinProject = mutation({
  args: {
    projectId: v.id("collaborativeProjects"),
    role: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const role = requireNonEmptyString(args.role, "Le rôle", MAX_ROLE_LENGTH);

    const project = await ctx.db.get(args.projectId);

    if (!project) {
      throw new ConvexError({
        message: "Projet introuvable",
        code: "NOT_FOUND",
      });
    }

    if (project.status !== "open") {
      throw new ConvexError({
        message: "Ce projet n'accepte plus de contributeurs",
        code: "PROJECT_CLOSED",
      });
    }

    const existing = await ctx.db
      .query("projectContributors")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (existing) {
      throw new ConvexError({
        message: "Vous êtes déjà contributeur de ce projet",
        code: "CONFLICT",
      });
    }

    if (
      project.maxContributors !== undefined &&
      project.contributorCount >= project.maxContributors
    ) {
      throw new ConvexError({
        message: "Le nombre maximal de contributeurs est atteint",
        code: "PROJECT_FULL",
      });
    }

    await ctx.db.insert("projectContributors", {
      projectId: args.projectId,
      userId: user._id,
      role,
      joinedAt: new Date().toISOString(),
      status: "active",
    });

    await ctx.db.patch(args.projectId, {
      contributorCount: project.contributorCount + 1,
    });
  },
});
