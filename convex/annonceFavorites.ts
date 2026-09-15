import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./publications";

// ── Queries ───────────────────────────────────────────────────────────────────

export const listFavorites = query({
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

    const favorites = await ctx.db
      .query("publicationFavorites")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return await Promise.all(
      favorites.map(async (fav) => {
        const pub = await ctx.db.get(fav.publicationId);
        return { ...fav, publication: pub };
      }),
    );
  },
});

export const checkFavorite = query({
  args: { publicationId: v.id("publications") },
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

    const fav = await ctx.db
      .query("publicationFavorites")
      .withIndex("by_user_and_publication", (q) =>
        q.eq("userId", user._id).eq("publicationId", args.publicationId),
      )
      .unique();
    return fav !== null;
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const toggleFavorite = mutation({
  args: { publicationId: v.id("publications") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query("publicationFavorites")
      .withIndex("by_user_and_publication", (q) =>
        q.eq("userId", user._id).eq("publicationId", args.publicationId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      // Décrémenter le compteur de likes dans la publication
      const pub = await ctx.db.get(args.publicationId);
      if (pub) {
        await ctx.db.patch(args.publicationId, {
          likeCount: Math.max(0, pub.likeCount - 1),
        });
      }
      return { favorited: false };
    } else {
      await ctx.db.insert("publicationFavorites", {
        userId: user._id,
        publicationId: args.publicationId,
        createdAt: Date.now(),
      });
      // Incrémenter le compteur de likes
      const pub = await ctx.db.get(args.publicationId);
      if (pub) {
        await ctx.db.patch(args.publicationId, {
          likeCount: pub.likeCount + 1,
        });
      }
      return { favorited: true };
    }
  },
});
