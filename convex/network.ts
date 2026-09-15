// convex/network.ts
import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

async function getCurrentUser(ctx: QueryCtx) {
  try {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
  } catch {
    return null;
  }
}

async function ensureOwnership<T extends { userId: Id<"users"> }>(
  ctx: QueryCtx | MutationCtx,
  entityId: Id<any>,
  _tableName: string,
  userId: Id<"users">,
): Promise<T> {
  const entity = (await ctx.db.get(entityId)) as T | null;
  if (!entity)
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Élément introuvable",
    });
  if (entity.userId !== userId)
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Vous n'êtes pas autorisé à modifier cet élément",
    });
  return entity;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. PROFIL UTILISATEUR
// ─────────────────────────────────────────────────────────────────────────────

export const getPublicProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const experiences = await ctx.db
      .query("networkExperiences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const educations = await ctx.db
      .query("networkEducations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const skills = await ctx.db
      .query("networkSkills")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const services = await ctx.db
      .query("networkServices")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const recommendations = await ctx.db
      .query("networkRecommendations")
      .withIndex("by_receiver", (q) => q.eq("receiverId", args.userId))
      .collect();

    const follows = await ctx.db.query("follows").collect();
    const followerCount = follows.filter(
      (f) => f.followingId === args.userId,
    ).length;
    const followingCount = follows.filter(
      (f) => f.followerId === args.userId,
    ).length;

    return {
      ...user,
      experiences,
      educations,
      skills,
      services,
      recommendations,
      followerCount,
      followingCount,
    };
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    headline: v.optional(v.string()),
    bio: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    roles: v.optional(v.array(v.string())),
    interests: v.optional(v.array(v.string())),
    avatar: v.optional(v.string()),
    cover: v.optional(v.string()),
    availability: v.optional(
      v.union(
        v.literal("available"),
        v.literal("limited"),
        v.literal("unavailable"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.headline !== undefined) updates.headline = args.headline;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.city !== undefined) updates.city = args.city;
    if (args.country !== undefined) updates.country = args.country;
    if (args.roles !== undefined) updates.roles = args.roles;
    if (args.interests !== undefined) updates.interests = args.interests;
    if (args.avatar !== undefined) updates.avatar = args.avatar;
    if (args.cover !== undefined) updates.cover = args.cover;
    if (args.availability !== undefined)
      updates.availability = args.availability;
    updates.updatedAt = new Date().toISOString();
    await ctx.db.patch(user._id, updates);
    return { success: true };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. EXPÉRIENCES PROFESSIONNELLES
// ─────────────────────────────────────────────────────────────────────────────

export const getUserExperiences = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("networkExperiences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const addExperience = mutation({
  args: {
    title: v.string(),
    company: v.string(),
    location: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    current: v.boolean(),
    description: v.optional(v.string()),
    achievements: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const id = await ctx.db.insert("networkExperiences", {
      userId: user._id,
      title: args.title,
      company: args.company,
      location: args.location,
      startDate: args.startDate,
      endDate: args.endDate,
      current: args.current,
      description: args.description,
      achievements: args.achievements || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return id;
  },
});

export const updateExperience = mutation({
  args: {
    id: v.id("networkExperiences"),
    title: v.optional(v.string()),
    company: v.optional(v.string()),
    location: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    current: v.optional(v.boolean()),
    description: v.optional(v.string()),
    achievements: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await ensureOwnership<any>(ctx, args.id, "networkExperiences", user._id);
    const updates: any = { updatedAt: new Date().toISOString() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.company !== undefined) updates.company = args.company;
    if (args.location !== undefined) updates.location = args.location;
    if (args.startDate !== undefined) updates.startDate = args.startDate;
    if (args.endDate !== undefined) updates.endDate = args.endDate;
    if (args.current !== undefined) updates.current = args.current;
    if (args.description !== undefined) updates.description = args.description;
    if (args.achievements !== undefined)
      updates.achievements = args.achievements;
    await ctx.db.patch(args.id, updates);
    return { success: true };
  },
});

export const deleteExperience = mutation({
  args: { id: v.id("networkExperiences") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await ensureOwnership<any>(ctx, args.id, "networkExperiences", user._id);
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. FORMATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const getUserEducations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("networkEducations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const addEducation = mutation({
  args: {
    school: v.string(),
    degree: v.string(),
    field: v.optional(v.string()),
    location: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    current: v.boolean(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const id = await ctx.db.insert("networkEducations", {
      userId: user._id,
      school: args.school,
      degree: args.degree,
      field: args.field,
      location: args.location,
      startDate: args.startDate,
      endDate: args.endDate,
      current: args.current,
      description: args.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return id;
  },
});

export const updateEducation = mutation({
  args: {
    id: v.id("networkEducations"),
    school: v.optional(v.string()),
    degree: v.optional(v.string()),
    field: v.optional(v.string()),
    location: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    current: v.optional(v.boolean()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await ensureOwnership<any>(ctx, args.id, "networkEducations", user._id);
    const updates: any = { updatedAt: new Date().toISOString() };
    if (args.school !== undefined) updates.school = args.school;
    if (args.degree !== undefined) updates.degree = args.degree;
    if (args.field !== undefined) updates.field = args.field;
    if (args.location !== undefined) updates.location = args.location;
    if (args.startDate !== undefined) updates.startDate = args.startDate;
    if (args.endDate !== undefined) updates.endDate = args.endDate;
    if (args.current !== undefined) updates.current = args.current;
    if (args.description !== undefined) updates.description = args.description;
    await ctx.db.patch(args.id, updates);
    return { success: true };
  },
});

export const deleteEducation = mutation({
  args: { id: v.id("networkEducations") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await ensureOwnership<any>(ctx, args.id, "networkEducations", user._id);
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. COMPÉTENCES
// ─────────────────────────────────────────────────────────────────────────────

export const getUserSkills = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("networkSkills")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const addSkill = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("networkSkills")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
    if (existing) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Cette compétence existe déjà",
      });
    }
    const id = await ctx.db.insert("networkSkills", {
      userId: user._id,
      name: args.name,
      endorsements: 0,
      endorsedBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return id;
  },
});

export const deleteSkill = mutation({
  args: { id: v.id("networkSkills") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await ensureOwnership<any>(ctx, args.id, "networkSkills", user._id);
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const endorseSkill = mutation({
  args: { skillId: v.id("networkSkills") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const skill = await ctx.db.get(args.skillId);
    if (!skill)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Compétence introuvable",
      });
    if (skill.userId === user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous ne pouvez pas endorser votre propre compétence",
      });
    }
    const endorsedBy = skill.endorsedBy || [];
    if (endorsedBy.includes(user._id)) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Vous avez déjà endorsé cette compétence",
      });
    }
    endorsedBy.push(user._id);
    await ctx.db.patch(args.skillId, {
      endorsements: (skill.endorsements || 0) + 1,
      endorsedBy,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. CERTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const getUserCertifications = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("networkCertifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const addCertification = mutation({
  args: {
    name: v.string(),
    issuer: v.string(),
    issueDate: v.string(),
    expiryDate: v.optional(v.string()),
    credentialId: v.optional(v.string()),
    credentialUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const id = await ctx.db.insert("networkCertifications", {
      userId: user._id,
      name: args.name,
      issuer: args.issuer,
      issueDate: args.issueDate,
      expiryDate: args.expiryDate,
      credentialId: args.credentialId,
      credentialUrl: args.credentialUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return id;
  },
});

export const updateCertification = mutation({
  args: {
    id: v.id("networkCertifications"),
    name: v.optional(v.string()),
    issuer: v.optional(v.string()),
    issueDate: v.optional(v.string()),
    expiryDate: v.optional(v.string()),
    credentialId: v.optional(v.string()),
    credentialUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await ensureOwnership<any>(ctx, args.id, "networkCertifications", user._id);
    const updates: any = { updatedAt: new Date().toISOString() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.issuer !== undefined) updates.issuer = args.issuer;
    if (args.issueDate !== undefined) updates.issueDate = args.issueDate;
    if (args.expiryDate !== undefined) updates.expiryDate = args.expiryDate;
    if (args.credentialId !== undefined)
      updates.credentialId = args.credentialId;
    if (args.credentialUrl !== undefined)
      updates.credentialUrl = args.credentialUrl;
    await ctx.db.patch(args.id, updates);
    return { success: true };
  },
});

export const deleteCertification = mutation({
  args: { id: v.id("networkCertifications") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await ensureOwnership<any>(ctx, args.id, "networkCertifications", user._id);
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. SERVICES
// ─────────────────────────────────────────────────────────────────────────────

export const getUserServices = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("networkServices")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const addService = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    price: v.optional(v.string()),
    category: v.string(),
    location: v.optional(v.string()),
    deliveryTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const id = await ctx.db.insert("networkServices", {
      userId: user._id,
      title: args.title,
      description: args.description,
      price: args.price,
      category: args.category,
      location: args.location,
      deliveryTime: args.deliveryTime,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return id;
  },
});

export const updateService = mutation({
  args: {
    id: v.id("networkServices"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.string()),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    deliveryTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await ensureOwnership<any>(ctx, args.id, "networkServices", user._id);
    const updates: any = { updatedAt: new Date().toISOString() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.price !== undefined) updates.price = args.price;
    if (args.category !== undefined) updates.category = args.category;
    if (args.location !== undefined) updates.location = args.location;
    if (args.deliveryTime !== undefined)
      updates.deliveryTime = args.deliveryTime;
    await ctx.db.patch(args.id, updates);
    return { success: true };
  },
});

export const deleteService = mutation({
  args: { id: v.id("networkServices") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await ensureOwnership<any>(ctx, args.id, "networkServices", user._id);
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. PORTFOLIO
// ─────────────────────────────────────────────────────────────────────────────

export const getUserPortfolio = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("networkPortfolio")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const addPortfolioItem = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("image"),
      v.literal("video"),
      v.literal("document"),
      v.literal("link"),
    ),
    url: v.string(),
    thumbnail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const id = await ctx.db.insert("networkPortfolio", {
      userId: user._id,
      title: args.title,
      description: args.description,
      type: args.type,
      url: args.url,
      thumbnail: args.thumbnail,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return id;
  },
});

export const deletePortfolioItem = mutation({
  args: { id: v.id("networkPortfolio") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await ensureOwnership<any>(ctx, args.id, "networkPortfolio", user._id);
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. RECOMMANDATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const getUserRecommendations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("networkRecommendations")
      .withIndex("by_receiver", (q) => q.eq("receiverId", args.userId))
      .collect();
  },
});

export const addRecommendation = mutation({
  args: {
    receiverId: v.id("users"),
    rating: v.number(),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user._id === args.receiverId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous ne pouvez pas vous recommander vous-même",
      });
    }
    const id = await ctx.db.insert("networkRecommendations", {
      fromUserId: user._id,
      fromName: user.name || "Utilisateur",
      fromAvatar: user.avatar,
      receiverId: args.receiverId,
      rating: args.rating,
      comment: args.comment,
      createdAt: new Date().toISOString(),
    });
    return id;
  },
});

export const deleteRecommendation = mutation({
  args: { id: v.id("networkRecommendations") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const rec = await ctx.db.get(args.id);
    if (!rec)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Recommandation introuvable",
      });
    if (rec.fromUserId !== user._id && rec.receiverId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Action non autorisée",
      });
    }
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. ABONNEMENTS (FOLLOWS)
// ─────────────────────────────────────────────────────────────────────────────

export const toggleFollow = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user._id === args.targetUserId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous ne pouvez pas vous suivre vous-même",
      });
    }
    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", user._id).eq("followingId", args.targetUserId),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    } else {
      await ctx.db.insert("follows", {
        followerId: user._id,
        followingId: args.targetUserId,
      });
      return true;
    }
  },
});

export const getFollowStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const follows = await ctx.db.query("follows").collect();

    const followers = follows.filter((f) => f.followingId === args.userId);
    const following = follows.filter((f) => f.followerId === args.userId);

    const isFollowing = currentUser
      ? follows.some(
          (f) =>
            f.followerId === currentUser._id && f.followingId === args.userId,
        )
      : false;

    return {
      followerCount: followers.length,
      followingCount: following.length,
      isFollowing,
    };
  },
});

export const getFollowers = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const follows = await ctx.db.query("follows").collect();
    const followerRelations = follows.filter(
      (f) => f.followingId === args.userId,
    );
    const limit = args.limit || 20;

    const followers = [];
    for (const rel of followerRelations.slice(0, limit)) {
      const user = await ctx.db.get(rel.followerId);
      if (user) {
        const isFollowedByMe = currentUser
          ? follows.some(
              (f) =>
                f.followerId === currentUser._id && f.followingId === user._id,
            )
          : false;
        followers.push({
          ...user,
          isFollowedByMe,
          followedAt: new Date(rel._creationTime).toISOString(),
        });
      }
    }
    return followers;
  },
});

export const getFollowing = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const follows = await ctx.db.query("follows").collect();
    const followingRelations = follows.filter(
      (f) => f.followerId === args.userId,
    );
    const limit = args.limit || 20;

    const following = [];
    for (const rel of followingRelations.slice(0, limit)) {
      const user = await ctx.db.get(rel.followingId);
      if (user) {
        const isFollowedByMe = currentUser
          ? follows.some(
              (f) =>
                f.followerId === currentUser._id && f.followingId === user._id,
            )
          : false;
        following.push({
          ...user,
          isFollowedByMe,
          followedAt: new Date(rel._creationTime).toISOString(),
        });
      }
    }
    return following;
  },
});

export const removeFollower = mutation({
  args: { userId: v.id("users"), followerId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user._id !== args.userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Action non autorisée",
      });
    }
    const relation = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", args.followerId).eq("followingId", args.userId),
      )
      .first();
    if (!relation) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Relation introuvable",
      });
    }
    await ctx.db.delete(relation._id);
    return { success: true };
  },
});

export const unfollow = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const relation = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", user._id).eq("followingId", args.targetUserId),
      )
      .first();
    if (!relation) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Relation introuvable",
      });
    }
    await ctx.db.delete(relation._id);
    return { success: true };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. DEMANDES DE CONNEXION
// ─────────────────────────────────────────────────────────────────────────────

export const sendConnectionRequest = mutation({
  args: { targetUserId: v.id("users"), message: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user._id === args.targetUserId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous ne pouvez pas vous envoyer une demande à vous-même",
      });
    }
    const existing = await ctx.db
      .query("networkConnectionRequests")
      .withIndex("by_sender", (q) => q.eq("senderId", user._id))
      .filter((q) => q.eq(q.field("receiverId"), args.targetUserId))
      .first();
    if (existing) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Une demande est déjà en cours",
      });
    }
    const id = await ctx.db.insert("networkConnectionRequests", {
      senderId: user._id,
      receiverId: args.targetUserId,
      message: args.message,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return id;
  },
});

export const acceptConnectionRequest = mutation({
  args: { requestId: v.id("networkConnectionRequests") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Demande introuvable",
      });
    if (request.receiverId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'êtes pas le destinataire",
      });
    }
    await ctx.db.patch(args.requestId, {
      status: "accepted",
      updatedAt: new Date().toISOString(),
    });
    await ctx.db.insert("follows", {
      followerId: request.senderId,
      followingId: user._id,
    });
    await ctx.db.insert("follows", {
      followerId: user._id,
      followingId: request.senderId,
    });
    return { success: true };
  },
});

export const declineConnectionRequest = mutation({
  args: { requestId: v.id("networkConnectionRequests") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Demande introuvable",
      });
    if (request.receiverId !== user._id && request.senderId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Action non autorisée",
      });
    }
    await ctx.db.patch(args.requestId, {
      status: "declined",
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  },
});

export const getConnectionRequests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) return [];
    const requests = await ctx.db
      .query("networkConnectionRequests")
      .filter((q) =>
        q.or(
          q.eq(q.field("receiverId"), currentUser._id),
          q.eq(q.field("senderId"), currentUser._id),
        ),
      )
      .collect();
    const enriched = [];
    for (const req of requests) {
      const sender = await ctx.db.get(req.senderId);
      const receiver = await ctx.db.get(req.receiverId);
      enriched.push({
        ...req,
        sender: sender ? { name: sender.name, avatar: sender.avatar } : null,
        receiver: receiver
          ? { name: receiver.name, avatar: receiver.avatar }
          : null,
      });
    }
    return enriched;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. RECHERCHE & SUGGESTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const searchProfiles = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    type: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const q = args.query.toLowerCase().trim();
    const limit = args.limit || 20;
    const users = await ctx.db.query("users").collect();

    let results = users.filter((u) => {
      if (!q) return true;
      return (
        u.name?.toLowerCase().includes(q) ||
        u.bio?.toLowerCase().includes(q) ||
        u.interests?.some((i) => i.toLowerCase().includes(q)) ||
        u.city?.toLowerCase().includes(q)
      );
    });

    if (args.type) {
      results = results.filter((u) => u.roles?.includes(args.type as string));
    }
    if (args.location) {
      results = results.filter(
        (u) => u.city?.toLowerCase() === args.location?.toLowerCase(),
      );
    }

    return results.slice(0, limit);
  },
});

export const getNetworkSuggestions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const limit = args.limit || 10;
    const allUsers = await ctx.db.query("users").collect();

    if (!currentUser) {
      return allUsers.slice(0, limit);
    }

    const follows = await ctx.db.query("follows").collect();
    const followedIds = follows
      .filter((f) => f.followerId === currentUser._id)
      .map((f) => f.followingId);

    const candidates = allUsers.filter(
      (u) => u._id !== currentUser._id && !followedIds.includes(u._id),
    );

    const scored = candidates.map((u) => {
      let score = 0;
      if (u.city && currentUser.city && u.city === currentUser.city)
        score += 10;
      if (u.interests && currentUser.interests) {
        const common = u.interests.filter((i) =>
          currentUser.interests?.includes(i),
        );
        score += common.length * 5;
      }
      if (
        u.roles?.includes("verified_seller") ||
        u.roles?.includes("professionnel")
      ) {
        score += 3;
      }
      return { user: u, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.user).slice(0, limit);
  },
});

export const getNearbyUsers = query({
  args: { lat: v.number(), lng: v.number(), radius: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    return users.slice(0, 10);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

export const getProfileAnalytics = query({
  args: { userId: v.id("users"), period: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser || currentUser._id !== args.userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Accès non autorisé",
      });
    }
    const follows = await ctx.db.query("follows").collect();
    const followers = follows.filter((f) => f.followingId === args.userId);
    const posts = await ctx.db
      .query("publications")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .collect();

    const totalLikes = posts.reduce((acc, p) => acc + (p.likeCount || 0), 0);
    const totalComments = posts.reduce(
      (acc, p) => acc + (p.commentCount || 0),
      0,
    );
    const engagement =
      posts.length > 0 ? (totalLikes + totalComments) / posts.length : 0;

    return {
      profileViews: 0,
      connectionsGained: followers.length,
      postsEngagement: engagement,
      searchAppearances: 0,
      opportunitiesGenerated: 0,
      recentFollowers: followers.slice(0, 5).map((f) => f.followerId),
    };
  },
});

export const trackProfileView = mutation({
  args: { viewedUserId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return;
    if (user._id === args.viewedUserId) return;
    // Pourrait stocker dans une table profileViews
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const getUserNotifications = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const notifications = await ctx.db
      .query("networkNotifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
    return notifications;
  },
});

export const markNotificationRead = mutation({
  args: { id: v.id("networkNotifications") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const notif = await ctx.db.get(args.id);
    if (!notif)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Notification introuvable",
      });
    if (notif.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Action non autorisée",
      });
    }
    await ctx.db.patch(args.id, { read: true });
    return { success: true };
  },
});

export const markAllNotificationsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const notifications = await ctx.db
      .query("networkNotifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("read"), false))
      .collect();
    for (const n of notifications) {
      await ctx.db.patch(n._id, { read: true });
    }
    return { success: true };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. NOUVEAU : Récupération d'une publication réseau (type "network") ──────
// ─────────────────────────────────────────────────────────────────────────────

export const getPost = query({
  args: { publicationId: v.id("publications") },
  handler: async (ctx, args) => {
    const publication = await ctx.db.get(args.publicationId);
    if (!publication) return null;

    // Seules les publications de type "network" sont gérées ici
    if (publication.type !== "network") {
      return null;
    }

    // Récupérer l'utilisateur courant pour savoir s'il a liké
    const currentUser = await getCurrentUser(ctx);

    // Vérifier si l'utilisateur courant a liké cette publication
    let likedByMe = false;
    if (currentUser) {
      const like = await ctx.db
        .query("publicationLikes")
        .withIndex("by_user_and_publication", (q) =>
          q
            .eq("userId", currentUser._id)
            .eq("publicationId", args.publicationId),
        )
        .unique();
      likedByMe = like !== null;
    }

    // Récupérer l'auteur
    const author = await ctx.db.get(publication.authorId);

    // Résoudre les images (storage IDs → URLs)
    const imageSources = publication.images ?? [];
    const images = (
      await Promise.all(
        imageSources.map(async (imgId) => {
          if (!imgId) return null;
          // Déjà une URL publique
          if (
            imgId.startsWith("http://") ||
            imgId.startsWith("https://") ||
            imgId.startsWith("data:")
          ) {
            return imgId;
          }
          // Blob URL : inutilisable côté serveur
          if (imgId.startsWith("blob:")) return null;
          try {
            return await ctx.storage.getUrl(imgId as Id<"_storage">);
          } catch {
            return null;
          }
        }),
      )
    ).filter((url): url is string => Boolean(url));

    // Construire l'objet retour
    return {
      ...publication,
      images,
      likedByMe, // ✅ Ajout pour savoir si l'utilisateur actuel a liké
      author: author
        ? {
            _id: author._id,
            name: author.name ?? "Utilisateur",
            avatar: author.avatar ?? null,
            bio: author.bio ?? null,
            city: author.city ?? null,
            country: author.country ?? null,
            headline: (author as any).headline ?? null, // si le champ existe
            roles: author.roles ?? [],
          }
        : null,
    };
  },
});
