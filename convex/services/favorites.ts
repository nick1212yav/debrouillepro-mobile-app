// convex/services/favorites.ts
//
// Backend Services V1 — favoris.
//
// Portée :
//   - toggle (ajout/retrait atomique)
//   - liste complète des favoris du client
//   - vérification d'état (pour UI)

import { query, mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

// ────────────────────────────────────────────────────────────────
// AUTH
// ────────────────────────────────────────────────────────────────

async function getUser(ctx: Ctx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

async function requireUser(ctx: Ctx): Promise<Doc<"users">> {
  const user = await getUser(ctx);
  if (!user) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Connexion requise",
    });
  }
  return user;
}

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

async function resolveImageUrl(ctx: Ctx, imgId: string): Promise<string> {
  if (imgId.startsWith("http://") || imgId.startsWith("https://")) return imgId;
  if (!/^[a-z0-9]{32}$/.test(imgId)) return imgId;
  try {
    const url = await ctx.storage.getUrl(imgId as Id<"_storage">);
    return url ?? imgId;
  } catch {
    return imgId;
  }
}

// ────────────────────────────────────────────────────────────────
// TOGGLE — atomique sous OCC
// ────────────────────────────────────────────────────────────────

export const toggleFavorite = mutation({
  args: { providerId: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const provider = await ctx.db.get(args.providerId);
    if (!provider) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Prestataire introuvable",
      });
    }

    const existing = await ctx.db
      .query("serviceFavorites")
      .withIndex("by_user_and_provider", (q) =>
        q.eq("userId", user._id).eq("providerId", args.providerId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { favorited: false };
    }

    await ctx.db.insert("serviceFavorites", {
      userId: user._id,
      providerId: args.providerId,
      createdAt: Date.now(),
    });

    return { favorited: true };
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE — mes favoris avec providers résolus
// ────────────────────────────────────────────────────────────────

export const listMyFavorites = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return [];

    const favorites = await ctx.db
      .query("serviceFavorites")
      .withIndex("by_user_and_provider", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    const results = await Promise.all(
      favorites.map(async (fav) => {
        const provider = await ctx.db.get(fav.providerId);
        if (!provider) return null;
        if (provider.status === "archived") return null;

        const imageUrl = provider.imageUrl
          ? await resolveImageUrl(ctx, provider.imageUrl)
          : undefined;

        return {
          favoriteId: fav._id,
          createdAt: fav.createdAt,
          provider: { ...provider, imageUrl },
        };
      }),
    );

    return results.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});

// ────────────────────────────────────────────────────────────────
// VÉRIFICATION D'ÉTAT — UI
// ────────────────────────────────────────────────────────────────

export const isFavorited = query({
  args: { providerId: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) return false;

    const existing = await ctx.db
      .query("serviceFavorites")
      .withIndex("by_user_and_provider", (q) =>
        q.eq("userId", user._id).eq("providerId", args.providerId),
      )
      .unique();

    return existing !== null;
  },
});

// ────────────────────────────────────────────────────────────────
// COMPTE — nombre de favoris pour un provider (stat publique)
// ────────────────────────────────────────────────────────────────

export const getFavoriteCount = query({
  args: { providerId: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("serviceFavorites")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .collect();

    return { count: favorites.length };
  },
});
