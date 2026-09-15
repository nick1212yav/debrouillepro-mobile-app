// convex/publications.ts
import { v, ConvexError } from "convex/values";
import {
  query,
  mutation,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import type { Doc, Id } from "./_generated/dataModel.d.ts";

// ── File Upload ───────────────────────────────────────────────────────────────

export const generatePublicationUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity)
      throw new ConvexError({
        message: "Non authentifié",
        code: "UNAUTHENTICATED",
      });
    return await ctx.storage.generateUploadUrl();
  },
});

export const getStorageUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    try {
      return await ctx.storage.getUrl(args.storageId as `kg${string}`);
    } catch {
      return null;
    }
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

export async function requireUser(ctx: MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity)
    throw new ConvexError({
      message: "Non authentifié",
      code: "UNAUTHENTICATED",
    });
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
  if (!user)
    throw new ConvexError({
      message: "Utilisateur introuvable",
      code: "NOT_FOUND",
    });
  return user;
}

export async function requireQueryUser(ctx: QueryCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity)
    throw new ConvexError({
      message: "Non authentifié",
      code: "UNAUTHENTICATED",
    });
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
  if (!user)
    throw new ConvexError({
      message: "Utilisateur introuvable",
      code: "NOT_FOUND",
    });
  return user;
}

/**
 * Résout les IDs d'images (storageId Convex ou URLs) en URLs publiques.
 * Les URLs déjà publiques (http, https, data:image) sont conservées.
 * Les storageId Convex (format kg...) sont résolus via ctx.storage.getUrl.
 * Les blob: URLs sont ignorées (renvoie null).
 */
async function resolvePublicationImages(
  ctx: QueryCtx,
  imageIds: (string | undefined)[],
): Promise<string[]> {
  if (!imageIds || imageIds.length === 0) {
    return [];
  }

  const resolved = await Promise.all(
    imageIds.map(async (imgId) => {
      if (!imgId) return null;
      // URL déjà publique
      if (
        imgId.startsWith("http://") ||
        imgId.startsWith("https://") ||
        imgId.startsWith("data:image")
      ) {
        return imgId;
      }
      // Blob URL temporaire : ne doit jamais être persistée
      if (imgId.startsWith("blob:")) {
        return null;
      }
      // Storage ID Convex
      try {
        const url = await ctx.storage.getUrl(imgId as Id<"_storage">);
        return url || null;
      } catch {
        return null;
      }
    }),
  );

  return resolved.filter((url): url is string => url !== null);
}

// ── Queries ───────────────────────────────────────────────────────────────────

export const listFeed = query({
  args: {
    paginationOpts: paginationOptsValidator,
    type: v.optional(
      v.union(
        v.literal("immo"),
        v.literal("job"),
        v.literal("service"),
        v.literal("evenement"),
        v.literal("community"),
        v.literal("agri"),
        v.literal("sante"),
        v.literal("transport"),
        v.literal("annonce"),
        v.literal("restauration"),
        v.literal("hebergement"),
        v.literal("energie"),
        v.literal("ong"),
        v.literal("video"),
        v.literal("article"),
        v.literal("sondage"),
        v.literal("marketplace"),
        v.literal("network"),
        v.literal("voyages"),
      ),
    ),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    page: Array<
      Doc<"publications"> & {
        author: { name?: string; avatar?: string } | null;
        likedByMe: boolean;
      }
    >;
    isDone: boolean;
    continueCursor: string;
  }> => {
    let currentUser: Doc<"users"> | null = null;
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (identity) {
        currentUser = await ctx.db
          .query("users")
          .withIndex("by_token", (q) =>
            q.eq("tokenIdentifier", identity.tokenIdentifier),
          )
          .unique();
      }
    } catch {
      // unauthenticated — feed is public
    }

    let baseQ = ctx.db.query("publications");
    if (args.type) {
      baseQ = baseQ.filter((q) => q.eq(q.field("type"), args.type));
    }

    const results = await baseQ.order("desc").paginate(args.paginationOpts);

    const page = await Promise.all(
      results.page.map(async (pub) => {
        const author = await ctx.db.get(pub.authorId);

        let likedByMe = false;
        if (currentUser) {
          const like = await ctx.db
            .query("publicationLikes")
            .withIndex("by_user_and_publication", (q) =>
              q.eq("userId", currentUser!._id).eq("publicationId", pub._id),
            )
            .unique();
          likedByMe = like !== null;
        }

        // Parse meta
        let meta: any = {};
        if (pub.meta) {
          try {
            meta =
              typeof pub.meta === "string" ? JSON.parse(pub.meta) : pub.meta;
          } catch {
            meta = {};
          }
        }

        // Collecter toutes les sources d'images
        const imageSources: string[] = [
          ...(meta.images || []),
          ...(meta.gallery || []),
          ...(meta.coverImage ? [meta.coverImage] : []),
          ...(pub.images || []),
        ];

        // Résoudre les images via le helper
        const resolvedImages = await resolvePublicationImages(
          ctx,
          imageSources,
        );

        // Mettre à jour le meta avec les URLs résolues
        const enrichedMeta = {
          ...meta,
          images: resolvedImages,
          gallery: resolvedImages,
          coverImage:
            resolvedImages.length > 0 ? resolvedImages[0] : meta.coverImage,
        };

        return {
          ...pub,
          images: resolvedImages,
          meta: JSON.stringify(enrichedMeta),
          author: author ? { name: author.name, avatar: author.avatar } : null,
          likedByMe,
        };
      }),
    );

    return { ...results, page };
  },
});

export const getPublication = query({
  args: { id: v.id("publications") },
  handler: async (ctx, args) => {
    const publication = await ctx.db.get(args.id);
    if (!publication) return null;

    const identity = await ctx.auth.getUserIdentity();
    let currentUser = null;
    if (identity) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();
    }

    const author = await ctx.db.get(publication.authorId);
    const authorName = author?.name || undefined;
    const authorAvatar = author?.avatar || undefined;

    let meta: any = {};
    if (publication.meta) {
      try {
        meta =
          typeof publication.meta === "string"
            ? JSON.parse(publication.meta)
            : publication.meta;
      } catch {
        meta = {};
      }
    }

    // Récupérer toutes les sources d'images
    const imageSources: string[] = [
      ...(meta.images || []),
      ...(meta.gallery || []),
      ...(meta.coverImage ? [meta.coverImage] : []),
      ...(publication.images || []),
    ];

    // Résoudre les images via le helper
    const resolvedImages = await resolvePublicationImages(ctx, imageSources);

    let likedByMe = false;
    let bookmarkedByMe = false;
    let isMine = false;
    let shareCount = publication.shareCount || 0;
    let bookmarkCount = 0;

    if (currentUser) {
      isMine = currentUser._id === publication.authorId;

      const like = await ctx.db
        .query("publicationLikes")
        .withIndex("by_user_and_publication", (q) =>
          q.eq("userId", currentUser!._id).eq("publicationId", publication._id),
        )
        .unique();
      likedByMe = like !== null;

      const bookmark = await ctx.db
        .query("bookmarks")
        .withIndex("by_user_and_publication", (q) =>
          q.eq("userId", currentUser!._id).eq("publicationId", publication._id),
        )
        .unique();
      bookmarkedByMe = bookmark !== null;
    }

    // Mettre à jour le meta avec les URLs résolues
    const enrichedMeta = {
      ...meta,
      images: resolvedImages,
      gallery: resolvedImages,
      coverImage:
        resolvedImages.length > 0 ? resolvedImages[0] : meta.coverImage,
    };

    return {
      ...publication,
      images: resolvedImages,
      meta: enrichedMeta,
      authorName,
      authorAvatar,
      likedByMe,
      bookmarkedByMe,
      isMine,
      shareCount,
      bookmarkCount,
    };
  },
});

export const getMyPublications = query({
  args: {},
  handler: async (ctx): Promise<Doc<"publications">[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) return [];
    return await ctx.db
      .query("publications")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .order("desc")
      .take(50);
  },
});

export const getMyCreatorStats = query({
  args: {
    email: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    publications: Array<{
      _id: string;
      title: string;
      type: string;
      likeCount: number;
      viewCount: number;
      commentCount: number;
      createdAt: number;
      category?: string;
    }>;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    engagementRate: string;
    pubsThisWeek: number;
    isActiveCreator: boolean;
    typeBreakdown: Record<string, number>;
    topPublication: {
      _id: string;
      title: string;
      likeCount: number;
      viewCount: number;
    } | null;
    recentActivity: Array<{ date: string; count: number }>;
  }> => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      return {
        publications: [],
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        engagementRate: "0",
        pubsThisWeek: 0,
        isActiveCreator: false,
        typeBreakdown: {},
        topPublication: null,
        recentActivity: [],
      };
    }

    const pubs = await ctx.db
      .query("publications")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .order("desc")
      .take(100);

    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const pubsThisWeek = pubs.filter(
      (p) => now - p._creationTime < oneWeek,
    ).length;
    const isActiveCreator = pubsThisWeek >= 3;

    const totalViews = pubs.reduce((s, p) => s + p.viewCount, 0);
    const totalLikes = pubs.reduce((s, p) => s + p.likeCount, 0);
    const totalComments = pubs.reduce((s, p) => s + p.commentCount, 0);
    const engagementRate =
      totalViews > 0
        ? (((totalLikes + totalComments) / totalViews) * 100).toFixed(1)
        : "0";

    const typeBreakdown: Record<string, number> = {};
    for (const p of pubs) {
      typeBreakdown[p.type] = (typeBreakdown[p.type] ?? 0) + 1;
    }

    const topPublication =
      pubs.length > 0
        ? pubs.reduce(
            (best, p) => (p.viewCount > best.viewCount ? p : best),
            pubs[0],
          )
        : null;

    const activityMap: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      activityMap[key] = 0;
    }
    for (const p of pubs) {
      const d = new Date(p._creationTime);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (key in activityMap) activityMap[key]++;
    }
    const recentActivity = Object.entries(activityMap).map(([date, count]) => ({
      date,
      count,
    }));

    return {
      publications: pubs.map((p) => ({
        _id: p._id,
        title: p.title,
        type: p.type,
        likeCount: p.likeCount,
        viewCount: p.viewCount,
        commentCount: p.commentCount,
        createdAt: p._creationTime,
        category: p.category,
      })),
      totalViews,
      totalLikes,
      totalComments,
      engagementRate,
      pubsThisWeek,
      isActiveCreator,
      typeBreakdown,
      topPublication: topPublication
        ? {
            _id: topPublication._id,
            title: topPublication.title,
            likeCount: topPublication.likeCount,
            viewCount: topPublication.viewCount,
          }
        : null,
      recentActivity,
    };
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const createPublication = mutation({
  args: {
    type: v.union(
      v.literal("immo"),
      v.literal("job"),
      v.literal("service"),
      v.literal("evenement"),
      v.literal("community"),
      v.literal("agri"),
      v.literal("sante"),
      v.literal("transport"),
      v.literal("annonce"),
      v.literal("restauration"),
      v.literal("hebergement"),
      v.literal("energie"),
      v.literal("ong"),
      v.literal("video"),
      v.literal("article"),
      v.literal("sondage"),
      v.literal("marketplace"),
      v.literal("network"),
    ),
    title: v.string(),
    description: v.string(),
    price: v.optional(v.string()),
    location: v.optional(v.string()),
    category: v.optional(v.string()),
    images: v.array(v.string()),
    tags: v.array(v.string()),
    meta: v.optional(v.any()),
    jobId: v.optional(v.id("jobListings")),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Id<"publications">> => {
    const user = await requireUser(ctx);
    let meta = args.meta;
    if (args.jobId) {
      if (typeof meta === "string") {
        try {
          meta = JSON.parse(meta);
        } catch {
          meta = {};
        }
      }
      if (!meta || typeof meta !== "object") {
        meta = {};
      }
      meta.jobId = args.jobId;
    }
    return await ctx.db.insert("publications", {
      ...args,
      meta,
      authorId: user._id,
      likeCount: 0,
      viewCount: 0,
      commentCount: 0,
      status: "active",
    });
  },
});

export const likePublication = mutation({
  args: { publicationId: v.id("publications") },
  handler: async (ctx, args): Promise<void> => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("publicationLikes")
      .withIndex("by_user_and_publication", (q) =>
        q.eq("userId", user._id).eq("publicationId", args.publicationId),
      )
      .unique();

    const pub = await ctx.db.get(args.publicationId);
    if (!pub)
      throw new ConvexError({
        message: "Publication introuvable",
        code: "NOT_FOUND",
      });

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.publicationId, {
        likeCount: Math.max(0, pub.likeCount - 1),
      });
    } else {
      await ctx.db.insert("publicationLikes", {
        publicationId: args.publicationId,
        userId: user._id,
      });
      await ctx.db.patch(args.publicationId, { likeCount: pub.likeCount + 1 });
    }
  },
});

export const deletePublication = mutation({
  args: { publicationId: v.id("publications") },
  handler: async (ctx, args): Promise<void> => {
    const user = await requireUser(ctx);
    const pub = await ctx.db.get(args.publicationId);
    if (!pub)
      throw new ConvexError({
        message: "Publication introuvable",
        code: "NOT_FOUND",
      });
    if (pub.authorId !== user._id)
      throw new ConvexError({ message: "Non autorisé", code: "FORBIDDEN" });
    await ctx.db.delete(args.publicationId);
  },
});

export const incrementView = mutation({
  args: { publicationId: v.id("publications") },
  handler: async (ctx, args): Promise<void> => {
    const pub = await ctx.db.get(args.publicationId);
    if (!pub) return;
    await ctx.db.patch(args.publicationId, { viewCount: pub.viewCount + 1 });
  },
});

// ── Nouvelles fonctions ──────────────────────────────────────────────────────

export const updatePublication = mutation({
  args: {
    publicationId: v.id("publications"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.string()),
    location: v.optional(v.string()),
    category: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    meta: v.optional(v.any()),
    currency: v.optional(v.string()),
    videos: v.optional(v.array(v.string())),
    condition: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const pub = await ctx.db.get(args.publicationId);
    if (!pub)
      throw new ConvexError({
        message: "Publication introuvable",
        code: "NOT_FOUND",
      });
    if (pub.authorId !== user._id)
      throw new ConvexError({ message: "Non autorisé", code: "FORBIDDEN" });

    const updates: any = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.price !== undefined) updates.price = args.price;
    if (args.location !== undefined) updates.location = args.location;
    if (args.category !== undefined) updates.category = args.category;
    if (args.images !== undefined) updates.images = args.images;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.meta !== undefined) updates.meta = args.meta;
    if (args.currency !== undefined) updates.currency = args.currency;
    if (args.videos !== undefined) updates.videos = args.videos;
    if (args.condition !== undefined) updates.condition = args.condition;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.publicationId, updates);
    return { success: true };
  },
});

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

export const trackView = mutation({
  args: { publicationId: v.id("publications") },
  handler: async (ctx, args) => {
    const pub = await ctx.db.get(args.publicationId);
    if (!pub) return;
    await ctx.db.patch(args.publicationId, { viewCount: pub.viewCount + 1 });
  },
});

export const incrementShare = mutation({
  args: { publicationId: v.id("publications") },
  handler: async (ctx, args) => {
    const pub = await ctx.db.get(args.publicationId);
    if (!pub) return;
    await ctx.db.patch(args.publicationId, {
      shareCount: (pub.shareCount || 0) + 1,
    });
  },
});

export const createOffer = mutation({
  args: {
    publicationId: v.id("publications"),
    amount: v.number(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const pub = await ctx.db.get(args.publicationId);
    if (!pub)
      throw new ConvexError({
        message: "Publication introuvable",
        code: "NOT_FOUND",
      });
    if (pub.authorId === user._id)
      throw new ConvexError({
        message: "Vous ne pouvez pas faire d'offre sur votre propre annonce",
        code: "FORBIDDEN",
      });

    const offerId = await ctx.db.insert("publicationOffers", {
      publicationId: args.publicationId,
      buyerId: user._id,
      amount: args.amount,
      message: args.message,
      status: "pending",
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.publicationId, {
      offerCount: (pub.offerCount || 0) + 1,
    });
    return { offerId };
  },
});

export const reserve = mutation({
  args: { publicationId: v.id("publications") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const pub = await ctx.db.get(args.publicationId);
    if (!pub)
      throw new ConvexError({
        message: "Publication introuvable",
        code: "NOT_FOUND",
      });
    if (pub.authorId !== user._id)
      throw new ConvexError({
        message: "Seul le propriétaire peut réserver",
        code: "FORBIDDEN",
      });
    await ctx.db.patch(args.publicationId, { isReserved: true });
    return { success: true };
  },
});

export const markSold = mutation({
  args: { publicationId: v.id("publications") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const pub = await ctx.db.get(args.publicationId);
    if (!pub)
      throw new ConvexError({
        message: "Publication introuvable",
        code: "NOT_FOUND",
      });
    if (pub.authorId !== user._id)
      throw new ConvexError({
        message: "Seul le propriétaire peut marquer comme vendu",
        code: "FORBIDDEN",
      });
    await ctx.db.patch(args.publicationId, { isSold: true, status: "sold" });
    return { success: true };
  },
});

export const promote = mutation({
  args: {
    publicationId: v.id("publications"),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const pub = await ctx.db.get(args.publicationId);
    if (!pub)
      throw new ConvexError({
        message: "Publication introuvable",
        code: "NOT_FOUND",
      });
    if (pub.authorId !== user._id)
      throw new ConvexError({ message: "Non autorisé", code: "FORBIDDEN" });
    await ctx.db.patch(args.publicationId, {
      isPromoted: true,
      promotionEnd: Date.now() + (args.duration || 7 * 24 * 60 * 60 * 1000),
    });
    return { success: true };
  },
});

export const boost = mutation({
  args: { publicationId: v.id("publications") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const pub = await ctx.db.get(args.publicationId);
    if (!pub)
      throw new ConvexError({
        message: "Publication introuvable",
        code: "NOT_FOUND",
      });
    if (pub.authorId !== user._id)
      throw new ConvexError({ message: "Non autorisé", code: "FORBIDDEN" });
    await ctx.db.patch(args.publicationId, { isPromoted: true });
    return { success: true };
  },
});

export const searchAnnonces = query({
  args: {
    search: v.optional(v.string()),
    type: v.optional(v.string()),
    location: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    condition: v.optional(v.string()),
    negotiable: v.optional(v.boolean()),
    delivery: v.optional(v.boolean()),
    sort: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("publications")
      .withIndex("by_status", (q) => q.eq("status", "active"));

    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }

    if (args.location) {
      query = query.filter((q) =>
        q.gt(q.field("location"), args.location! + ""),
      );
    }

    const results = await query.take(args.limit || 50);
    return results;
  },
});

export const getBridgeData = query({
  args: { type: v.string(), id: v.string() },
  handler: async (ctx, args) => {
    if (args.type === "publication") {
      const pub = await ctx.db.get(args.id as any);
      return pub;
    }
    return null;
  },
});

// ── Demo seed ─────────────────────────────────────────────────────────────────

export const seedDemoPublications = mutation({
  args: {},
  handler: async (ctx): Promise<{ inserted: number }> => {
    const existing = await ctx.db.query("publications").take(1);
    if (existing.length > 0) return { inserted: 0 };

    const anyUser = await ctx.db.query("users").take(1);
    if (anyUser.length === 0) return { inserted: 0 };
    const authorId = anyUser[0]._id;

    const DEMO: Omit<
      Doc<"publications">,
      "_id" | "_creationTime" | "authorId"
    >[] = [
      {
        type: "annonce",
        title: "iPhone 15 Pro Max 256GB – Comme neuf",
        description: "Vendu avec boîte d'origine, chargeur, 2 coques.",
        price: "850 000 FCFA",
        location: "Dakar, Sénégal",
        category: "Électronique",
        images: [],
        tags: ["iphone", "apple", "smartphone"],
        likeCount: 44,
        viewCount: 580,
        commentCount: 23,
        status: "active",
        meta: JSON.stringify({ condition: "comme neuf", negotiable: false }),
      },
    ];

    let inserted = 0;
    for (const pub of DEMO) {
      await ctx.db.insert("publications", { ...pub, authorId });
      inserted++;
    }
    return { inserted: 1 };
  },
});
