import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api.js";
import type { Doc, Id } from "./_generated/dataModel.d.ts";

// ─── Public profile data ──────────────────────────────────────────────────────

type PublicProfile = Doc<"users"> & {
  followerCount: number;
  followingCount: number;
  publicationCount: number;
  isFollowedByMe: boolean;
};

export const getPublicProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<PublicProfile | null> => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const [followers, following, publications] = await Promise.all([
      ctx.db
        .query("follows")
        .withIndex("by_following", (q) => q.eq("followingId", args.userId))
        .collect(),
      ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
        .collect(),
      ctx.db
        .query("publications")
        .withIndex("by_author", (q) => q.eq("authorId", args.userId))
        .collect(),
    ]);

    let isFollowedByMe = false;
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      const currentUser = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();
      if (currentUser && currentUser._id !== args.userId) {
        const follow = await ctx.db
          .query("follows")
          .withIndex("by_follower_and_following", (q) =>
            q.eq("followerId", currentUser._id).eq("followingId", args.userId),
          )
          .unique();
        isFollowedByMe = follow !== null;
      }
    }

    return {
      ...user,
      followerCount: followers.length,
      followingCount: following.length,
      publicationCount: publications.length,
      isFollowedByMe,
    };
  },
});

// Get public publications for a user
export const getPublicPublications = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<Doc<"publications">[]> => {
    return ctx.db
      .query("publications")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .order("desc")
      .take(20);
  },
});

// Toggle follow/unfollow – returns true if now following
export const toggleFollow = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args): Promise<boolean> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity)
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Connexion requise",
      });

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!currentUser)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Utilisateur introuvable",
      });

    if (currentUser._id === args.targetUserId) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Vous ne pouvez pas vous suivre vous-même",
      });
    }

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q
          .eq("followerId", currentUser._id)
          .eq("followingId", args.targetUserId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }

    await ctx.db.insert("follows", {
      followerId: currentUser._id,
      followingId: args.targetUserId,
    });

    // Notify the followed user
    await ctx.scheduler.runAfter(0, internal.notifications.createSocial, {
      toUserId: args.targetUserId,
      fromUserId: currentUser._id,
      type: "follow",
      fromUserName: currentUser.name,
      fromUserAvatar: currentUser.avatar,
      title: `${currentUser.name ?? "Quelqu'un"} vous suit`,
      body: "Un nouvel abonné a rejoint votre réseau.",
      actionPage: "profile",
    });

    return true;
  },
});

// Get followers list
export const getFollowers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<(Doc<"users"> | null)[]> => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .take(50);
    return Promise.all(follows.map((f) => ctx.db.get(f.followerId)));
  },
});

// Get following list
export const getFollowing = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<(Doc<"users"> | null)[]> => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .take(50);
    return Promise.all(follows.map((f) => ctx.db.get(f.followingId)));
  },
});

// Get suggested users to follow (users not yet followed by current user)
export const getSuggestedUsers = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<
    Array<{ _id: Id<"users">; name?: string; avatar?: string; bio?: string }>
  > => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!currentUser) return [];

    // Get IDs of users already followed
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", currentUser._id))
      .collect();
    const followedIds = new Set(following.map((f) => f.followingId));

    // Get recent users not already followed (limit to 10 suggestions)
    const allUsers = await ctx.db.query("users").order("desc").take(50);
    const suggestions = allUsers
      .filter((u) => u._id !== currentUser._id && !followedIds.has(u._id))
      .slice(0, 10)
      .map((u) => ({
        _id: u._id,
        name: u.name,
        avatar: u.avatar,
        bio: u.bio,
      }));

    return suggestions;
  },
});

// Get current user's follower/following counts
export const getMyFollowStats = query({
  args: {
    email: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ followerCount: number; followingCount: number } | null> => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) return null;

    const [followers, following] = await Promise.all([
      ctx.db
        .query("follows")
        .withIndex("by_following", (q) => q.eq("followingId", user._id))
        .collect(),
      ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", user._id))
        .collect(),
    ]);

    return {
      followerCount: followers.length,
      followingCount: following.length,
    };
  },
});
