import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";

// Helper requireUser pour les deux contextes
async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity)
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Connexion requise",
    });
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

// ─────────────────────────────────────────────────────────────────────────────
// FOLLOW / UNFOLLOW (ajouté pour Annonces)
// ─────────────────────────────────────────────────────────────────────────────
export const followUser = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user._id === args.targetUserId) {
      throw new ConvexError({
        message: "Vous ne pouvez pas vous suivre vous-même",
        code: "FORBIDDEN",
      });
    }
    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", user._id).eq("followingId", args.targetUserId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { followed: false };
    } else {
      await ctx.db.insert("follows", {
        followerId: user._id,
        followingId: args.targetUserId,
      });
      return { followed: true };
    }
  },
});

export const checkFollow = query({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) return false;
    const follow = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", user._id).eq("followingId", args.targetUserId),
      )
      .unique();
    return follow !== null;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// GROUPS (déjà présent, on garde)
// ─────────────────────────────────────────────────────────────────────────────
export const listGroups = query({
  args: {
    category: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    if (args.category) {
      return ctx.db
        .query("groups")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .paginate(args.paginationOpts);
    }
    return ctx.db.query("groups").order("desc").paginate(args.paginationOpts);
  },
});

export const getGroup = query({
  args: { id: v.id("groups") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.id);
    if (!group) return null;
    const admin = await ctx.db.get(group.adminId);
    return { ...group, adminName: admin?.name, adminAvatar: admin?.avatar };
  },
});

export const searchGroups = query({
  args: { q: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("groups")
      .withSearchIndex("search_groups", (qi) => qi.search("name", args.q))
      .take(20);
  },
});

export const createGroup = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    coverImage: v.optional(v.string()),
    avatar: v.optional(v.string()),
    category: v.string(),
    isPrivate: v.boolean(),
    city: v.optional(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const groupId = await ctx.db.insert("groups", {
      ...args,
      adminId: user._id,
      memberCount: 1,
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
    if (existing)
      throw new ConvexError({ code: "CONFLICT", message: "Déjà membre" });
    const group = await ctx.db.get(args.groupId);
    if (!group)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Groupe introuvable",
      });
    await ctx.db.insert("groupMembers", {
      groupId: args.groupId,
      userId: user._id,
      role: "member",
      joinedAt: new Date().toISOString(),
      status: group.isPrivate ? "pending" : "active",
    });
    if (!group.isPrivate)
      await ctx.db.patch(args.groupId, { memberCount: group.memberCount + 1 });
  },
});

export const leaveGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const member = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", user._id),
      )
      .unique();
    if (!member)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Vous n'êtes pas membre",
      });
    await ctx.db.delete(member._id);
    const group = await ctx.db.get(args.groupId);
    if (group)
      await ctx.db.patch(args.groupId, {
        memberCount: Math.max(0, group.memberCount - 1),
      });
  },
});

export const getGroupMembers = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(50);
    return Promise.all(
      members.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return { ...m, name: user?.name, avatar: user?.avatar };
      }),
    );
  },
});

export const getMyGroups = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) return [];
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return Promise.all(
      memberships.map(async (m) => {
        const group = await ctx.db.get(m.groupId);
        return { ...m, group };
      }),
    );
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// GROUP POSTS
// ─────────────────────────────────────────────────────────────────────────────
export const getGroupPosts = query({
  args: {
    groupId: v.id("groups"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("groupPosts")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .order("desc")
      .paginate(args.paginationOpts);
    return {
      ...result,
      page: await Promise.all(
        result.page.map(async (post) => {
          const author = await ctx.db.get(post.authorId);
          return {
            ...post,
            authorName: author?.name,
            authorAvatar: author?.avatar,
          };
        }),
      ),
    };
  },
});

export const createGroupPost = mutation({
  args: {
    groupId: v.id("groups"),
    content: v.string(),
    images: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const member = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", user._id),
      )
      .unique();
    if (!member || member.status !== "active")
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous devez être membre actif",
      });
    return ctx.db.insert("groupPosts", {
      ...args,
      authorId: user._id,
      likeCount: 0,
      commentCount: 0,
      pinned: false,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// NGO
// ─────────────────────────────────────────────────────────────────────────────
export const listNgos = query({
  args: {
    category: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    if (args.category) {
      return ctx.db
        .query("ngoProfiles")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .paginate(args.paginationOpts);
    }
    return ctx.db
      .query("ngoProfiles")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const createNgoProfile = mutation({
  args: {
    name: v.string(),
    mission: v.string(),
    description: v.string(),
    logo: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    category: v.string(),
    city: v.string(),
    country: v.string(),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("ngoProfiles", {
      ...args,
      userId: user._id,
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
    coverImage: v.optional(v.string()),
    deadline: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return ctx.db.insert("ngoCampaigns", {
      ...args,
      raised: 0,
      donorCount: 0,
      status: "active",
    });
  },
});

export const listCampaigns = query({
  args: { ngoId: v.optional(v.id("ngoProfiles")) },
  handler: async (ctx, args) => {
    if (args.ngoId) {
      return ctx.db
        .query("ngoCampaigns")
        .withIndex("by_ngo", (q) => q.eq("ngoId", args.ngoId!))
        .collect();
    }
    return ctx.db
      .query("ngoCampaigns")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(20);
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
    const donationId = await ctx.db.insert("donations", {
      ...args,
      donorId: user._id,
      paidAt: new Date().toISOString(),
    });
    const campaign = await ctx.db.get(args.campaignId);
    if (campaign) {
      await ctx.db.patch(args.campaignId, {
        raised: campaign.raised + args.amount,
        donorCount: campaign.donorCount + 1,
      });
    }
    return donationId;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// REPUTATION
// ─────────────────────────────────────────────────────────────────────────────
export const getReputationScore = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let uid = args.userId;
    if (!uid) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return null;
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();
      if (!user) return null;
      uid = user._id;
    }
    const events = await ctx.db
      .query("reputationEvents")
      .withIndex("by_user", (q) => q.eq("userId", uid!))
      .collect();
    const total = events.reduce((s, e) => s + e.points, 0);
    const recent = events.slice(-10);
    return {
      total,
      recent,
      level:
        total >= 500
          ? "expert"
          : total >= 200
            ? "avance"
            : total >= 50
              ? "intermediaire"
              : "debutant",
    };
  },
});

export const addReputationEvent = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("publication_liked"),
      v.literal("comment_liked"),
      v.literal("followed"),
      v.literal("review_received"),
      v.literal("sale_completed"),
      v.literal("badge_earned"),
      v.literal("verified"),
    ),
    points: v.number(),
    sourceId: v.optional(v.string()),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("reputationEvents", args);
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        reputationScore: (user.reputationScore ?? 0) + args.points,
      });
    }
  },
});
