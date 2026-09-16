import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";

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

  return user;
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function requireNonEmptyString(
  value: string,
  field: string,
  maxLength = 5000,
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
  maxLength = 5000,
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
  const normalized = tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20);

  const unique = [...new Set(normalized)];

  for (const tag of unique) {
    if (tag.length > 80) {
      throw new ConvexError({
        message: "Un tag est trop long",
        code: "VALIDATION_ERROR",
      });
    }
  }

  return unique;
}

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA — ARTICLES
// ─────────────────────────────────────────────────────────────────────────────

export const listPublishedArticles = query({
  args: {
    category: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const articles = await ctx.db
      .query("mediaArticles")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .order("desc")
      .take(30);

    const category = args.category?.trim();

    if (category && category !== "Tout") {
      return articles.filter((article) => article.category === category);
    }

    return articles;
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
      .take(20);
  },
});

export const likeArticle = mutation({
  args: {
    articleId: v.id("mediaArticles"),
  },

  handler: async (ctx, args) => {
    await requireUser(ctx);

    const article = await ctx.db.get(args.articleId);

    if (!article) {
      throw new ConvexError({
        message: "Article introuvable",
        code: "NOT_FOUND",
      });
    }

    const currentLikeCount =
      typeof article.likeCount === "number" &&
      Number.isFinite(article.likeCount)
        ? article.likeCount
        : 0;

    await ctx.db.patch(args.articleId, {
      likeCount: currentLikeCount + 1,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// STORIES
// ─────────────────────────────────────────────────────────────────────────────

export const listActiveStories = query({
  args: {},

  handler: async (ctx) => {
    const now = new Date().toISOString();

    const stories = await ctx.db.query("stories").order("desc").take(50);

    return stories.filter((story) => story.expiresAt > now);
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

    const mediaUrl = requireNonEmptyString(args.mediaUrl, "mediaUrl", 4000);

    const caption = optionalString(args.caption, "caption", 2000);

    if (
      args.duration !== undefined &&
      (!Number.isFinite(args.duration) || args.duration <= 0)
    ) {
      throw new ConvexError({
        message: "La durée de la story est invalide",
        code: "VALIDATION_ERROR",
      });
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
      .take(20);
  },
});

export const listActiveAdCampaigns = query({
  args: {},

  handler: async (ctx) => {
    return await ctx.db
      .query("adCampaigns")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(10);
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

    const title = requireNonEmptyString(args.title, "Le titre", 160);

    const description = requireNonEmptyString(
      args.description,
      "La description",
      5000,
    );

    const mediaUrl = optionalString(args.mediaUrl, "mediaUrl", 4000);

    const targetUrl = optionalString(args.targetUrl, "targetUrl", 4000);

    const currency = requireNonEmptyString(
      args.currency,
      "La devise",
      20,
    ).toUpperCase();

    const targetAudience = optionalString(
      args.targetAudience,
      "targetAudience",
      1000,
    );

    const budget = requirePositiveNumber(args.budget, "Le budget");

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

      // Une campagne nouvellement créée reste un brouillon.
      // L'activation doit être une action explicite.
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

    // Une campagne terminée ne doit pas être réactivée.
    if (campaign.status === "completed" && args.status !== "completed") {
      throw new ConvexError({
        message: "Une campagne terminée ne peut plus être réactivée",
        code: "INVALID_STATUS_TRANSITION",
      });
    }

    // Vérification des dates avant activation.
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
      .collect();

    const totalCampaigns = campaigns.length;

    const activeCampaigns = campaigns.filter(
      (campaign) => campaign.status === "active",
    ).length;

    const totalImpressions = campaigns.reduce(
      (sum, campaign) =>
        sum +
        (typeof campaign.impressions === "number" ? campaign.impressions : 0),
      0,
    );

    const totalClicks = campaigns.reduce(
      (sum, campaign) =>
        sum + (typeof campaign.clicks === "number" ? campaign.clicks : 0),
      0,
    );

    const totalSpent = campaigns.reduce(
      (sum, campaign) =>
        sum + (typeof campaign.spent === "number" ? campaign.spent : 0),
      0,
    );

    return {
      totalCampaigns,
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
      .take(20);
  },
});

export const listMyProjects = query({
  args: {},

  handler: async (ctx) => {
    const user = await requireUser(ctx);

    // Projets créés par l'utilisateur.
    const created = await ctx.db
      .query("collaborativeProjects")
      .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
      .take(10);

    // Projets auxquels l'utilisateur contribue.
    const contributions = await ctx.db
      .query("projectContributors")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(10);

    const contributedProjects = await Promise.all(
      contributions.map((contribution) => ctx.db.get(contribution.projectId)),
    );

    const all = [
      ...created,
      ...contributedProjects.filter(
        (project): project is NonNullable<typeof project> => project !== null,
      ),
    ];

    // Déduplication.
    const seen = new Set<string>();

    return all.filter((project) => {
      if (seen.has(project._id)) {
        return false;
      }

      seen.add(project._id);
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

    const title = requireNonEmptyString(args.title, "Le titre", 160);

    const description = requireNonEmptyString(
      args.description,
      "La description",
      5000,
    );

    const category = requireNonEmptyString(args.category, "La catégorie", 100);

    const coverImage = optionalString(args.coverImage, "coverImage", 4000);

    const tags = normalizeTags(args.tags);

    if (
      args.maxContributors !== undefined &&
      (!Number.isInteger(args.maxContributors) || args.maxContributors < 1)
    ) {
      throw new ConvexError({
        message: "maxContributors doit être un entier positif",
        code: "VALIDATION_ERROR",
      });
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

    // Le créateur devient automatiquement le premier contributeur.
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

    const role = requireNonEmptyString(args.role, "Le rôle", 120);

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

    // Vérifier si l'utilisateur participe déjà.
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

    // Respect de la capacité maximale lorsqu'elle existe.
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
