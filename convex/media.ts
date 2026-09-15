import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";

// ─── Auth helper ────────────────────────────────────────────────────────────

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ message: "Non authentifié", code: "UNAUTHENTICATED" });
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) throw new ConvexError({ message: "Utilisateur introuvable", code: "NOT_FOUND" });
  return user;
}

// ─── Media Articles ──────────────────────────────────────────────────────────

export const listPublishedArticles = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const articles = await ctx.db
      .query("mediaArticles")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .order("desc")
      .take(30);
    if (args.category && args.category !== "Tout") {
      return articles.filter((a) => a.category === args.category);
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
  args: { articleId: v.id("mediaArticles") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const article = await ctx.db.get(args.articleId);
    if (!article) throw new ConvexError({ message: "Article introuvable", code: "NOT_FOUND" });
    await ctx.db.patch(args.articleId, { likeCount: article.likeCount + 1 });
  },
});

// ─── Stories ──────────────────────────────────────────────────────────────────

export const listActiveStories = query({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    const stories = await ctx.db
      .query("stories")
      .order("desc")
      .take(50);
    return stories.filter((s) => s.expiresAt > now);
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
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    return await ctx.db.insert("stories", {
      authorId: user._id,
      mediaUrl: args.mediaUrl,
      mediaType: args.mediaType,
      caption: args.caption,
      duration: args.duration,
      viewCount: 0,
      expiresAt,
      isHighlight: false,
    });
  },
});

// ─── Ad Campaigns ─────────────────────────────────────────────────────────────

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
    return await ctx.db.insert("adCampaigns", {
      advertiserId: user._id,
      title: args.title,
      description: args.description,
      mediaUrl: args.mediaUrl,
      targetUrl: args.targetUrl,
      budget: args.budget,
      currency: args.currency,
      spent: 0,
      impressions: 0,
      clicks: 0,
      targetAudience: args.targetAudience,
      startDate: args.startDate,
      endDate: args.endDate,
      status: "draft",
    });
  },
});

export const updateCampaignStatus = mutation({
  args: {
    campaignId: v.id("adCampaigns"),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("paused"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new ConvexError({ message: "Campagne introuvable", code: "NOT_FOUND" });
    if (campaign.advertiserId !== user._id) throw new ConvexError({ message: "Accès refusé", code: "FORBIDDEN" });
    await ctx.db.patch(args.campaignId, { status: args.status });
  },
});

// ─── Collaborative Projects ───────────────────────────────────────────────────

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
    // Projects I created
    const created = await ctx.db
      .query("collaborativeProjects")
      .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
      .take(10);
    // Projects I contribute to
    const contributions = await ctx.db
      .query("projectContributors")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(10);
    const contributedProjects = await Promise.all(
      contributions.map((c) => ctx.db.get(c.projectId))
    );
    const all = [
      ...created,
      ...contributedProjects.filter((p): p is NonNullable<typeof p> => p !== null),
    ];
    // deduplicate by _id
    const seen = new Set<string>();
    return all.filter((p) => {
      if (seen.has(p._id)) return false;
      seen.add(p._id);
      return true;
    });
  },
});

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
    const projectId = await ctx.db.insert("collaborativeProjects", {
      creatorId: user._id,
      title: args.title,
      description: args.description,
      category: args.category,
      coverImage: args.coverImage,
      tags: args.tags,
      maxContributors: args.maxContributors,
      contributorCount: 1,
      status: "open",
    });
    // Add creator as contributor
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

export const joinProject = mutation({
  args: { projectId: v.id("collaborativeProjects"), role: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    // Check not already a contributor
    const existing = await ctx.db
      .query("projectContributors")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();
    if (existing) throw new ConvexError({ message: "Déjà contributeur", code: "CONFLICT" });
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new ConvexError({ message: "Projet introuvable", code: "NOT_FOUND" });
    await ctx.db.insert("projectContributors", {
      projectId: args.projectId,
      userId: user._id,
      role: args.role,
      joinedAt: new Date().toISOString(),
      status: "active",
    });
    await ctx.db.patch(args.projectId, { contributorCount: project.contributorCount + 1 });
  },
});

export const getAdStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const campaigns = await ctx.db
      .query("adCampaigns")
      .withIndex("by_advertiser", (q) => q.eq("advertiserId", user._id))
      .collect();
    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === "active").length,
      totalImpressions: campaigns.reduce((s, c) => s + c.impressions, 0),
      totalClicks: campaigns.reduce((s, c) => s + c.clicks, 0),
      totalSpent: campaigns.reduce((s, c) => s + c.spent, 0),
    };
  },
});
