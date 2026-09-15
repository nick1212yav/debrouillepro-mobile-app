// convex/bookmarks.ts
import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

type EnrichedBookmark = Doc<"bookmarks"> & {
  publication: Doc<"publications"> | null;
};

// Toggle bookmark – returns true if now bookmarked, false if removed
export const toggle = mutation({
  // ✅ Acceptation d'un string générique pour être polymorphe aux tables [2]
  args: { publicationId: v.string() },
  handler: async (ctx, args): Promise<boolean> => {
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

    // 1. Tenter de normaliser l'identifiant pour la table accommodations
    const accId = ctx.db.normalizeId("accommodations", args.publicationId);
    if (accId) {
      const existingFavorite = await ctx.db
        .query("accommodationFavorites")
        .withIndex("by_user_and_accommodation", (q) =>
          q.eq("userId", user._id).eq("accommodationId", accId),
        )
        .unique();

      if (existingFavorite) {
        await ctx.db.delete(existingFavorite._id);
        return false;
      }

      await ctx.db.insert("accommodationFavorites", {
        userId: user._id,
        accommodationId: accId,
        createdAt: Date.now(), // ✅ Renseigne le createdAt obligatoire du schéma [2]
      });
      return true;
    }

    // 2. Normalisation standard pour la table publications
    const pubId = ctx.db.normalizeId("publications", args.publicationId);
    if (!pubId) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Identifiant invalide",
      });
    }

    const existingBookmark = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_and_publication", (q) =>
        q.eq("userId", user._id).eq("publicationId", pubId),
      )
      .unique();

    if (existingBookmark) {
      await ctx.db.delete(existingBookmark._id);
      return false;
    }

    await ctx.db.insert("bookmarks", {
      publicationId: pubId,
      userId: user._id,
    });
    return true;
  },
});

// Check if current user has bookmarked a publication (or favorited an accommodation)
export const isBookmarked = query({
  args: { publicationId: v.string() },
  handler: async (ctx, args): Promise<boolean> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) return false;

    // 1. Vérification pour les hébergements [2]
    const accId = ctx.db.normalizeId("accommodations", args.publicationId);
    if (accId) {
      const existingFavorite = await ctx.db
        .query("accommodationFavorites")
        .withIndex("by_user_and_accommodation", (q) =>
          q.eq("userId", user._id).eq("accommodationId", accId),
        )
        .unique();
      return existingFavorite !== null;
    }

    // 2. Vérification pour les publications [2]
    const pubId = ctx.db.normalizeId("publications", args.publicationId);
    if (!pubId) return false;

    const existingBookmark = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_and_publication", (q) =>
        q.eq("userId", user._id).eq("publicationId", pubId),
      )
      .unique();

    return existingBookmark !== null;
  },
});

// List current user's bookmarked publications
export const listMine = query({
  args: {},
  handler: async (ctx): Promise<EnrichedBookmark[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) return [];

    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);

    return Promise.all(
      bookmarks.map(async (b) => ({
        ...b,
        publication: await ctx.db.get(b.publicationId),
      })),
    );
  },
});
