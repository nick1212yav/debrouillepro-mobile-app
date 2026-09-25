import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("inspirations")
      .withIndex("by_created")
      .order("desc")
      .take(50);
  },
});

export const toggleLike = mutation({
  args: {
    inspirationId: v.id("inspirations"),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Non authentifié");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new Error("Utilisateur introuvable");
    }

    const inspiration = await ctx.db.get(args.inspirationId);

    if (!inspiration) {
      throw new Error("Inspiration introuvable");
    }

    const existingLike = await ctx.db
      .query("inspirationLikes")
      .withIndex("by_user_and_inspiration", (q) =>
        q.eq("userId", user._id).eq("inspirationId", args.inspirationId),
      )
      .unique();

    if (existingLike) {
      await ctx.db.delete(existingLike._id);

      const likeCount = Math.max(0, inspiration.likeCount - 1);

      await ctx.db.patch(args.inspirationId, {
        likeCount,
      });

      return {
        liked: false,
        likeCount,
      };
    }

    await ctx.db.insert("inspirationLikes", {
      inspirationId: args.inspirationId,
      userId: user._id,
      createdAt: Date.now(),
    });

    const likeCount = inspiration.likeCount + 1;

    await ctx.db.patch(args.inspirationId, {
      likeCount,
    });

    return {
      liked: true,
      likeCount,
    };
  },
});
