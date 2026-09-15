// convex/community/index.ts

import { query, mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "../_generated/server";

// ── Helper d'Authentification ──────────────────────────────────────────────────
async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity)
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "Non connecté" });
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
  if (!user)
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Utilisateur introuvable",
    });
  return user;
}

// ══════════════════════════════════════════════════════════════════════════════
// GROUPS
// ══════════════════════════════════════════════════════════════════════════════

export const listGroups = query({
  args: { category: v.optional(v.string()), search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let groupsQuery;
    if (args.search) {
      groupsQuery = await ctx.db
        .query("groups")
        .withSearchIndex("search_groups", (q) => q.search("name", args.search!))
        .take(50);
    } else if (args.category && args.category !== "all") {
      groupsQuery = await ctx.db
        .query("groups")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
    } else {
      groupsQuery = await ctx.db.query("groups").order("desc").take(50);
    }

    let memberMap: Record<string, string> = {};
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();
      if (user) {
        const memberships = await ctx.db
          .query("groupMembers")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();
        for (const m of memberships) {
          memberMap[m.groupId] = m.role;
        }
      }
    }

    // Association de couleurs et émojis par défaut si non définis
    const defaultStyles = [
      { color: "#8B5CF6", emoji: "🏠" },
      { color: "#10B981", emoji: "💼" },
      { color: "#F97316", emoji: "🌾" },
      { color: "#3B82F6", emoji: "🔧" },
    ];

    return groupsQuery.map((g, index) => {
      const style = defaultStyles[index % defaultStyles.length];
      return {
        _id: g._id,
        name: g.name,
        description: g.description,
        category: g.category,
        isPrivate: g.isPrivate,
        memberCount: g.memberCount,
        city: g.city,
        tags: g.tags,
        isMember: memberMap[g._id] !== undefined,
        role: memberMap[g._id],
        color: style.color,
        emoji: style.emoji,
      };
    });
  },
});

export const createGroup = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    category: v.string(),
    isPrivate: v.boolean(),
    city: v.optional(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const groupId = await ctx.db.insert("groups", {
      adminId: user._id,
      name: args.name,
      description: args.description,
      category: args.category,
      isPrivate: args.isPrivate,
      memberCount: 1,
      city: args.city,
      tags: args.tags,
    });
    await ctx.db.insert("groupMembers", {
      groupId,
      userId: user._id,
      role: "admin",
      joinedAt: new Date().toISOString(),
      status: "active",
    });
    return groupId;
  },
});

export const joinGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", user._id),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      const group = await ctx.db.get(args.groupId);
      if (group)
        await ctx.db.patch(args.groupId, {
          memberCount: Math.max(0, group.memberCount - 1),
        });
      return { joined: false };
    } else {
      await ctx.db.insert("groupMembers", {
        groupId: args.groupId,
        userId: user._id,
        role: "member",
        joinedAt: new Date().toISOString(),
        status: "active",
      });
      const group = await ctx.db.get(args.groupId);
      if (group)
        await ctx.db.patch(args.groupId, {
          memberCount: group.memberCount + 1,
        });
      return { joined: true };
    }
  },
});

export const getGroupPosts = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("groupPosts")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .order("desc")
      .take(50);
  },
});

export const createGroupPost = mutation({
  args: { groupId: v.id("groups"), content: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return await ctx.db.insert("groupPosts", {
      groupId: args.groupId,
      authorId: user._id,
      content: args.content,
      images: [],
      likeCount: 0,
      commentCount: 0,
      pinned: false,
    });
  },
});

export const likeGroupPost = mutation({
  args: { postId: v.id("groupPosts"), increment: v.boolean() },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return;
    await ctx.db.patch(args.postId, {
      likeCount: Math.max(0, post.likeCount + (args.increment ? 1 : -1)),
    });
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// COMMUNITY POSTS
// ══════════════════════════════════════════════════════════════════════════════

export const listCommunityPosts = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let currentUserId: string | null = null;
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (identity) {
        const me = await ctx.db
          .query("users")
          .withIndex("by_token", (q) =>
            q.eq("tokenIdentifier", identity.tokenIdentifier),
          )
          .unique();
        if (me) currentUserId = me._id;
      }
    } catch {
      /* invité non authentifié */
    }

    const posts = await ctx.db
      .query("publications")
      .withIndex("by_type", (q) => q.eq("type", "community"))
      .order("desc")
      .take(50);

    const enriched = await Promise.all(
      posts.map(async (p) => {
        const author = await ctx.db.get(p.authorId);
        let likedByMe = false;
        let votedOptionId: string | null = null;

        if (currentUserId) {
          const like = await ctx.db
            .query("publicationLikes")
            .withIndex("by_user_and_publication", (q) =>
              q
                .eq("userId", currentUserId as typeof p.authorId)
                .eq("publicationId", p._id),
            )
            .unique();
          likedByMe = like !== null;

          if (p.meta) {
            try {
              const parsedMeta = JSON.parse(p.meta);
              if (parsedMeta.voters && parsedMeta.voters[currentUserId]) {
                votedOptionId = parsedMeta.voters[currentUserId];
              }
            } catch {
              /* meta non lisible */
            }
          }
        }

        return {
          ...p,
          authorName: author?.name ?? "Membre",
          authorAvatar: author?.avatar ?? undefined,
          likedByMe,
          isMine: currentUserId === p.authorId,
          votedOptionId,
        };
      }),
    );

    if (args.search) {
      const q = args.search.toLowerCase();
      return enriched.filter(
        (p) =>
          p.description?.toLowerCase().includes(q) ||
          p.title?.toLowerCase().includes(q),
      );
    }
    return enriched;
  },
});

export const createCommunityPost = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    tags: v.array(v.string()),
    meta: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return await ctx.db.insert("publications", {
      authorId: user._id,
      type: "community",
      title: args.title,
      description: args.description,
      images: [],
      tags: args.tags,
      likeCount: 0,
      viewCount: 0,
      commentCount: 0,
      status: "active",
      meta: args.meta,
    });
  },
});

export const likeCommunityPost = mutation({
  args: { publicationId: v.id("publications") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get(args.publicationId);
    if (!post)
      throw new ConvexError({ code: "NOT_FOUND", message: "Post introuvable" });

    const existingLike = await ctx.db
      .query("publicationLikes")
      .withIndex("by_user_and_publication", (q) =>
        q.eq("userId", user._id).eq("publicationId", args.publicationId),
      )
      .unique();

    if (existingLike) {
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.publicationId, {
        likeCount: Math.max(0, post.likeCount - 1),
      });
      return { liked: false };
    } else {
      await ctx.db.insert("publicationLikes", {
        userId: user._id,
        publicationId: args.publicationId,
      });
      await ctx.db.patch(args.publicationId, {
        likeCount: post.likeCount + 1,
      });
      return { liked: true };
    }
  },
});

export const deleteCommunityPost = mutation({
  args: { publicationId: v.id("publications") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get(args.publicationId);
    if (!post)
      throw new ConvexError({ code: "NOT_FOUND", message: "Post introuvable" });
    if (post.authorId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Action non autorisée",
      });
    }
    await ctx.db.delete(args.publicationId);
    return { success: true };
  },
});

export const votePoll = mutation({
  args: { publicationId: v.id("publications"), optionId: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get(args.publicationId);
    if (!post)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Sondage introuvable",
      });

    let meta: any = {};
    if (post.meta) {
      try {
        meta = JSON.parse(post.meta);
      } catch {
        throw new ConvexError({
          code: "BAD_REQUEST",
          message: "Format du post invalide",
        });
      }
    }

    if (meta.postType !== "poll" || !meta.pollOptions) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Ce post n'est pas un sondage",
      });
    }

    if (!meta.voters) meta.voters = {};

    if (meta.voters[user._id]) {
      throw new ConvexError({
        code: "ALREADY_VOTED",
        message: "Vous avez déjà voté",
      });
    }

    // Enregistrer le vote de l'utilisateur
    meta.voters[user._id] = args.optionId;

    // Incrémenter l'option correspondante
    meta.pollOptions = meta.pollOptions.map((opt: any) => {
      if (opt.id === args.optionId) {
        return { ...opt, votes: (opt.votes || 0) + 1 };
      }
      return opt;
    });

    await ctx.db.patch(args.publicationId, {
      meta: JSON.stringify(meta),
    });

    return { success: true };
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// ONG / NGO (Inchangé)
// ══════════════════════════════════════════════════════════════════════════════

export const listNGOs = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.category) {
      return await ctx.db
        .query("ngoProfiles")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .take(30);
    }
    return await ctx.db.query("ngoProfiles").order("desc").take(30);
  },
});

export const getNGOCampaigns = query({
  args: { ngoId: v.id("ngoProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ngoCampaigns")
      .withIndex("by_ngo", (q) => q.eq("ngoId", args.ngoId))
      .collect();
  },
});

export const listActiveCampaigns = query({
  args: {},
  handler: async (ctx) => {
    const campaigns = await ctx.db
      .query("ngoCampaigns")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(20);
    return await Promise.all(
      campaigns.map(async (c) => {
        const ngo = await ctx.db.get(c.ngoId);
        return { ...c, ngoName: ngo?.name ?? "ONG", ngoLogo: ngo?.logo };
      }),
    );
  },
});

export const createNGO = mutation({
  args: {
    name: v.string(),
    mission: v.string(),
    description: v.string(),
    category: v.string(),
    city: v.string(),
    country: v.string(),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return await ctx.db.insert("ngoProfiles", {
      userId: user._id,
      name: args.name,
      mission: args.mission,
      description: args.description,
      category: args.category,
      city: args.city,
      country: args.country,
      website: args.website,
      phone: args.phone,
      verified: false,
      totalDonations: 0,
      donorCount: 0,
    });
  },
});

export const createCampaign = mutation({
  args: {
    ngoId: v.id("ngoProfiles"),
    title: v.string(),
    description: v.string(),
    goal: v.number(),
    currency: v.string(),
    deadline: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db.insert("ngoCampaigns", {
      ngoId: args.ngoId,
      title: args.title,
      description: args.description,
      goal: args.goal,
      currency: args.currency,
      raised: 0,
      donorCount: 0,
      deadline: args.deadline,
      status: "active",
    });
  },
});

export const donate = mutation({
  args: {
    campaignId: v.id("ngoCampaigns"),
    amount: v.number(),
    currency: v.string(),
    anonymous: v.boolean(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Campagne introuvable",
      });

    await ctx.db.insert("donations", {
      campaignId: args.campaignId,
      donorId: user._id,
      amount: args.amount,
      currency: args.currency,
      anonymous: args.anonymous,
      message: args.message,
      paidAt: new Date().toISOString(),
    });

    await ctx.db.patch(args.campaignId, {
      raised: campaign.raised + args.amount,
      donorCount: campaign.donorCount + 1,
    });

    const ngo = await ctx.db.get(campaign.ngoId);
    if (ngo) {
      await ctx.db.patch(campaign.ngoId, {
        totalDonations: ngo.totalDonations + args.amount,
        donorCount: ngo.donorCount + 1,
      });
    }
    return true;
  },
});

export const getDonations = query({
  args: { campaignId: v.id("ngoCampaigns") },
  handler: async (ctx, args) => {
    const donations = await ctx.db
      .query("donations")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .order("desc")
      .take(20);
    return await Promise.all(
      donations.map(async (d) => {
        if (d.anonymous) return { ...d, donorName: "Anonyme" };
        const donor = await ctx.db.get(d.donorId);
        return { ...d, donorName: donor?.name ?? "Inconnu" };
      }),
    );
  },
});

export const getMyNGO = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) return null;
    return await ctx.db
      .query("ngoProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
  },
});
