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

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type PublicationMeta = Record<string, unknown>;

type PublicationStatus = "active" | "sold";

type PublicationUpdate = Partial<{
  title: string;
  description: string;
  price: string;
  location: string;
  category: string;
  images: string[];
  tags: string[];
  meta: string;
  currency: string;
  status: PublicationStatus;
}>;

// ─────────────────────────────────────────────────────────────────────────────
// File Upload
// ─────────────────────────────────────────────────────────────────────────────

export const generatePublicationUploadUrl = mutation({
  args: {},

  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new ConvexError({
        message: "Non authentifié",
        code: "UNAUTHENTICATED",
      });
    }

    return await ctx.storage.generateUploadUrl();
  },
});

export const getStorageUrl = query({
  args: {
    storageId: v.string(),
  },

  handler: async (ctx, args) => {
    try {
      return await ctx.storage.getUrl(args.storageId as Id<"_storage">);
    } catch {
      return null;
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Authentication
// ─────────────────────────────────────────────────────────────────────────────

export async function requireUser(ctx: MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError({
      message: "Non authentifié",
      code: "UNAUTHENTICATED",
    });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new ConvexError({
      message: "Utilisateur introuvable",
      code: "NOT_FOUND",
    });
  }

  return user;
}

export async function requireQueryUser(ctx: QueryCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError({
      message: "Non authentifié",
      code: "UNAUTHENTICATED",
    });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new ConvexError({
      message: "Utilisateur introuvable",
      code: "NOT_FOUND",
    });
  }

  return user;
}

// ─────────────────────────────────────────────────────────────────────────────
// Meta helpers
// ─────────────────────────────────────────────────────────────────────────────

function parsePublicationMeta(value: unknown): PublicationMeta {
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);

      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        return parsed as PublicationMeta;
      }

      return {};
    } catch {
      return {};
    }
  }

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as PublicationMeta;
  }

  return {};
}

function serializePublicationMeta(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

function readStringArray(meta: PublicationMeta, key: string): string[] {
  const value = meta[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function readString(meta: PublicationMeta, key: string): string | undefined {
  const value = meta[key];

  return typeof value === "string" ? value : undefined;
}

function readBoolean(meta: PublicationMeta, key: string): boolean | undefined {
  const value = meta[key];

  return typeof value === "boolean" ? value : undefined;
}

function readNumber(meta: PublicationMeta, key: string): number | undefined {
  const value = meta[key];

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Image helpers
// ─────────────────────────────────────────────────────────────────────────────

async function resolvePublicationImages(
  ctx: QueryCtx,
  imageIds: Array<string | undefined>,
): Promise<string[]> {
  if (imageIds.length === 0) {
    return [];
  }

  const resolved = await Promise.all(
    imageIds.map(async (imgId) => {
      if (!imgId) {
        return null;
      }

      if (
        imgId.startsWith("http://") ||
        imgId.startsWith("https://") ||
        imgId.startsWith("data:image")
      ) {
        return imgId;
      }

      if (imgId.startsWith("blob:")) {
        return null;
      }

      try {
        return await ctx.storage.getUrl(imgId as Id<"_storage">);
      } catch {
        return null;
      }
    }),
  );

  return resolved.filter((url): url is string => url !== null);
}

// ─────────────────────────────────────────────────────────────────────────────
// Feed
// ─────────────────────────────────────────────────────────────────────────────

export const listFeed = query({
  args: {
    paginationOpts: paginationOptsValidator,

    type: v.optional(
      v.union(
        v.literal("agri"),
        v.literal("annonce"),
        v.literal("article"),
        v.literal("business"),
        v.literal("community"),
        v.literal("creator"),
        v.literal("education"),
        v.literal("energie"),
        v.literal("environnement"),
        v.literal("evenement"),
        v.literal("finance"),
        v.literal("groupes"),
        v.literal("hebergement"),
        v.literal("immo"),
        v.literal("job"),
        v.literal("justice"),
        v.literal("marketplace"),
        v.literal("media"),
        v.literal("network"),
        v.literal("ong"),
        v.literal("restauration"),
        v.literal("sante"),
        v.literal("service"),
        v.literal("sondage"),
        v.literal("transport"),
        v.literal("video"),
        v.literal("voyages"),
      ),
    ),
  },

  handler: async (ctx, args) => {
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
      currentUser = null;
    }

    let baseQuery = ctx.db.query("publications");

    if (args.type) {
      baseQuery = baseQuery.filter((q) => q.eq(q.field("type"), args.type));
    }

    const results = await baseQuery.order("desc").paginate(args.paginationOpts);

    const page = await Promise.all(
      results.page.map(async (pub) => {
        const author = await ctx.db.get(pub.authorId);

        let likedByMe = false;

        if (currentUser) {
          const like = await ctx.db
            .query("publicationLikes")
            .withIndex("by_user_and_publication", (q) =>
              q.eq("userId", currentUser._id).eq("publicationId", pub._id),
            )
            .unique();

          likedByMe = like !== null;
        }

        const meta = parsePublicationMeta(pub.meta);

        const imageSources: string[] = [
          ...readStringArray(meta, "images"),
          ...readStringArray(meta, "gallery"),
          ...(readString(meta, "coverImage")
            ? [readString(meta, "coverImage")!]
            : []),
          ...(pub.images ?? []),
        ];

        const resolvedImages = await resolvePublicationImages(
          ctx,
          imageSources,
        );

        const enrichedMeta: PublicationMeta = {
          ...meta,
          images: resolvedImages,
          gallery: resolvedImages,
          coverImage:
            resolvedImages.length > 0
              ? resolvedImages[0]
              : readString(meta, "coverImage"),
        };

        return {
          ...pub,
          images: resolvedImages,
          meta: serializePublicationMeta(enrichedMeta),
          author: author
            ? {
                name: author.name,
                avatar: author.avatar,
              }
            : null,
          likedByMe,
        };
      }),
    );

    return {
      ...results,
      page,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Get publication
// ─────────────────────────────────────────────────────────────────────────────

export const getPublication = query({
  args: {
    id: v.id("publications"),
  },

  handler: async (ctx, args) => {
    const publication = await ctx.db.get(args.id);

    if (!publication) {
      return null;
    }

    const identity = await ctx.auth.getUserIdentity();

    let currentUser: Doc<"users"> | null = null;

    if (identity) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();
    }

    const author = await ctx.db.get(publication.authorId);

    const meta = parsePublicationMeta(publication.meta);

    const imageSources: string[] = [
      ...readStringArray(meta, "images"),
      ...readStringArray(meta, "gallery"),
      ...(readString(meta, "coverImage")
        ? [readString(meta, "coverImage")!]
        : []),
      ...(publication.images ?? []),
    ];

    const resolvedImages = await resolvePublicationImages(ctx, imageSources);

    let likedByMe = false;
    let bookmarkedByMe = false;
    let isMine = false;

    const shareCount = publication.shareCount ?? 0;

    let bookmarkCount = 0;

    if (currentUser) {
      isMine = currentUser._id === publication.authorId;

      const like = await ctx.db
        .query("publicationLikes")
        .withIndex("by_user_and_publication", (q) =>
          q.eq("userId", currentUser._id).eq("publicationId", publication._id),
        )
        .unique();

      likedByMe = like !== null;

      const bookmark = await ctx.db
        .query("bookmarks")
        .withIndex("by_user_and_publication", (q) =>
          q.eq("userId", currentUser._id).eq("publicationId", publication._id),
        )
        .unique();

      bookmarkedByMe = bookmark !== null;

      if (bookmark) {
        bookmarkCount = 1;
      }
    }

    const enrichedMeta: PublicationMeta = {
      ...meta,
      images: resolvedImages,
      gallery: resolvedImages,
      coverImage:
        resolvedImages.length > 0
          ? resolvedImages[0]
          : readString(meta, "coverImage"),
    };

    return {
      ...publication,
      images: resolvedImages,
      meta: enrichedMeta,
      authorName: author?.name ?? undefined,
      authorAvatar: author?.avatar ?? undefined,
      likedByMe,
      bookmarkedByMe,
      isMine,
      shareCount,
      bookmarkCount,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// My publications
// ─────────────────────────────────────────────────────────────────────────────

export const getMyPublications = query({
  args: {},

  handler: async (ctx): Promise<Doc<"publications">[]> => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("publications")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .order("desc")
      .take(50);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Creator stats
// ─────────────────────────────────────────────────────────────────────────────

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
    recentActivity: Array<{
      date: string;
      count: number;
    }>;
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
      (publication) => now - publication._creationTime < oneWeek,
    ).length;

    const totalViews = pubs.reduce(
      (sum, publication) => sum + publication.viewCount,
      0,
    );

    const totalLikes = pubs.reduce(
      (sum, publication) => sum + publication.likeCount,
      0,
    );

    const totalComments = pubs.reduce(
      (sum, publication) => sum + publication.commentCount,
      0,
    );

    const engagementRate =
      totalViews > 0
        ? (((totalLikes + totalComments) / totalViews) * 100).toFixed(1)
        : "0";

    const typeBreakdown: Record<string, number> = {};

    for (const publication of pubs) {
      typeBreakdown[publication.type] =
        (typeBreakdown[publication.type] ?? 0) + 1;
    }

    const topPublication =
      pubs.length > 0
        ? pubs.reduce(
            (best, publication) =>
              publication.viewCount > best.viewCount ? publication : best,
            pubs[0],
          )
        : null;

    const activityMap: Record<string, number> = {};

    for (let i = 13; i >= 0; i -= 1) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);

      const key = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");

      activityMap[key] = 0;
    }

    for (const publication of pubs) {
      const date = new Date(publication._creationTime);

      const key = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");

      if (key in activityMap) {
        activityMap[key] += 1;
      }
    }

    const recentActivity = Object.entries(activityMap).map(([date, count]) => ({
      date,
      count,
    }));

    return {
      publications: pubs.map((publication) => ({
        _id: publication._id,
        title: publication.title,
        type: publication.type,
        likeCount: publication.likeCount,
        viewCount: publication.viewCount,
        commentCount: publication.commentCount,
        createdAt: publication._creationTime,
        category: publication.category,
      })),

      totalViews,
      totalLikes,
      totalComments,
      engagementRate,
      pubsThisWeek,
      isActiveCreator: pubsThisWeek >= 3,
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

// ─────────────────────────────────────────────────────────────────────────────
// Create publication
// ─────────────────────────────────────────────────────────────────────────────

export const createPublication = mutation({
  args: {
    type: v.union(
      v.literal("agri"),
      v.literal("annonce"),
      v.literal("article"),
      v.literal("business"),
      v.literal("community"),
      v.literal("creator"),
      v.literal("education"),
      v.literal("energie"),
      v.literal("environnement"),
      v.literal("evenement"),
      v.literal("finance"),
      v.literal("groupes"),
      v.literal("hebergement"),
      v.literal("immo"),
      v.literal("job"),
      v.literal("justice"),
      v.literal("marketplace"),
      v.literal("media"),
      v.literal("network"),
      v.literal("ong"),
      v.literal("restauration"),
      v.literal("sante"),
      v.literal("service"),
      v.literal("sondage"),
      v.literal("transport"),
      v.literal("video"),
      v.literal("voyages"),
    ),

    title: v.string(),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
    location: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    price: v.optional(v.string()),
    category: v.optional(v.string()),
    meta: v.optional(v.any()),
    images: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),

    visibility: v.optional(
      v.union(
        v.literal("public"),
        v.literal("private"),
        v.literal("followers"),
      ),
    ),

    isSponsored: v.optional(v.boolean()),
    sponsoredUntil: v.optional(v.number()),

    /**
     * Identifiant métier optionnel du module Emploi.
     * Conservé dans meta.jobId car le schéma publications
     * ne possède pas de colonne racine jobId.
     */
    jobId: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new ConvexError({
        message: "Non authentifié",
        code: "UNAUTHENTICATED",
      });
    }

    /**
     * Le schéma users utilise :
     *   index: by_token
     *   field: tokenIdentifier
     */
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "Utilisateur introuvable",
        code: "NOT_FOUND",
      });
    }

    /**
     * Toutes les données spécifiques aux modules restent dans meta.
     * Cela permet de conserver une API riche sans inventer de colonnes
     * qui n'existent pas dans le schéma publications.
     */
    const publicationMeta = parsePublicationMeta(args.meta);

    if (args.jobId) {
      publicationMeta.jobId = args.jobId;
    }

    if (args.content !== undefined) {
      publicationMeta.content = args.content;
    }

    if (args.visibility !== undefined) {
      publicationMeta.visibility = args.visibility;
    }

    if (args.isSponsored !== undefined) {
      publicationMeta.isSponsored = args.isSponsored;
    }

    if (args.sponsoredUntil !== undefined) {
      publicationMeta.sponsoredUntil = args.sponsoredUntil;
    }

    const serializedMeta =
      Object.keys(publicationMeta).length > 0
        ? JSON.stringify(publicationMeta)
        : undefined;

    /**
     * Le schéma publications exige actuellement :
     * - description
     * - images
     * - tags
     *
     * Les données métier supplémentaires restent dans meta.
     */
    const description = args.description ?? "";
    const images = args.images ?? [];
    const tags = args.tags ?? [];

    return await ctx.db.insert("publications", {
      type: args.type,
      title: args.title,
      description,

      location: args.location,
      latitude: args.latitude,
      longitude: args.longitude,

      price: args.price,
      category: args.category,

      meta: serializedMeta,

      images,
      tags,

      authorId: user._id,

      status: "active",

      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      viewCount: 0,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Like
// ─────────────────────────────────────────────────────────────────────────────

export const likePublication = mutation({
  args: {
    publicationId: v.id("publications"),
  },

  handler: async (ctx, args): Promise<void> => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query("publicationLikes")
      .withIndex("by_user_and_publication", (q) =>
        q.eq("userId", user._id).eq("publicationId", args.publicationId),
      )
      .unique();

    const pub = await ctx.db.get(args.publicationId);

    if (!pub) {
      throw new ConvexError({
        message: "Publication introuvable",
        code: "NOT_FOUND",
      });
    }

    if (existing) {
      await ctx.db.delete(existing._id);

      await ctx.db.patch(args.publicationId, {
        likeCount: Math.max(0, pub.likeCount - 1),
      });

      return;
    }

    await ctx.db.insert("publicationLikes", {
      publicationId: args.publicationId,
      userId: user._id,
    });

    await ctx.db.patch(args.publicationId, {
      likeCount: pub.likeCount + 1,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Delete
// ─────────────────────────────────────────────────────────────────────────────

export const deletePublication = mutation({
  args: {
    publicationId: v.id("publications"),
  },

  handler: async (ctx, args): Promise<void> => {
    const user = await requireUser(ctx);

    const pub = await ctx.db.get(args.publicationId);

    if (!pub) {
      throw new ConvexError({
        message: "Publication introuvable",
        code: "NOT_FOUND",
      });
    }

    if (pub.authorId !== user._id) {
      throw new ConvexError({
        message: "Non autorisé",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.delete(args.publicationId);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Views
// ─────────────────────────────────────────────────────────────────────────────

export const incrementView = mutation({
  args: {
    publicationId: v.id("publications"),
  },

  handler: async (ctx, args): Promise<void> => {
    const pub = await ctx.db.get(args.publicationId);

    if (!pub) {
      return;
    }

    await ctx.db.patch(args.publicationId, {
      viewCount: pub.viewCount + 1,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Update
// ─────────────────────────────────────────────────────────────────────────────

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

    status: v.optional(v.union(v.literal("active"), v.literal("sold"))),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const pub = await ctx.db.get(args.publicationId);

    if (!pub) {
      throw new ConvexError({
        message: "Publication introuvable",
        code: "NOT_FOUND",
      });
    }

    if (pub.authorId !== user._id) {
      throw new ConvexError({
        message: "Non autorisé",
        code: "FORBIDDEN",
      });
    }

    const updates: PublicationUpdate = {};

    if (args.title !== undefined) {
      updates.title = args.title;
    }

    if (args.description !== undefined) {
      updates.description = args.description;
    }

    if (args.price !== undefined) {
      updates.price = args.price;
    }

    if (args.location !== undefined) {
      updates.location = args.location;
    }

    if (args.category !== undefined) {
      updates.category = args.category;
    }

    if (args.images !== undefined) {
      updates.images = args.images;
    }

    if (args.tags !== undefined) {
      updates.tags = args.tags;
    }

    if (args.meta !== undefined) {
      const serializedMeta = serializePublicationMeta(args.meta);

      if (serializedMeta !== undefined) {
        updates.meta = serializedMeta;
      }
    }

    if (args.currency !== undefined) {
      updates.currency = args.currency;
    }

    if (args.status !== undefined) {
      updates.status = args.status;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.publicationId, updates);
    }

    return {
      success: true,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Favorites
// ─────────────────────────────────────────────────────────────────────────────

export const toggleFavorite = mutation({
  args: {
    publicationId: v.id("publications"),
  },

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

      return {
        favorited: false,
      };
    }

    await ctx.db.insert("publicationFavorites", {
      userId: user._id,
      publicationId: args.publicationId,
      createdAt: Date.now(),
    });

    return {
      favorited: true,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Track view
// ─────────────────────────────────────────────────────────────────────────────

export const trackView = mutation({
  args: {
    publicationId: v.id("publications"),
  },

  handler: async (ctx, args) => {
    const pub = await ctx.db.get(args.publicationId);

    if (!pub) {
      return;
    }

    await ctx.db.patch(args.publicationId, {
      viewCount: pub.viewCount + 1,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Share
// ─────────────────────────────────────────────────────────────────────────────

export const incrementShare = mutation({
  args: {
    publicationId: v.id("publications"),
  },

  handler: async (ctx, args) => {
    const pub = await ctx.db.get(args.publicationId);

    if (!pub) {
      return;
    }

    await ctx.db.patch(args.publicationId, {
      shareCount: (pub.shareCount ?? 0) + 1,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Offers
// ─────────────────────────────────────────────────────────────────────────────

export const createOffer = mutation({
  args: {
    publicationId: v.id("publications"),
    amount: v.number(),
    message: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const pub = await ctx.db.get(args.publicationId);

    if (!pub) {
      throw new ConvexError({
        message: "Publication introuvable",
        code: "NOT_FOUND",
      });
    }

    if (pub.authorId === user._id) {
      throw new ConvexError({
        message: "Vous ne pouvez pas faire d'offre sur votre propre annonce",
        code: "FORBIDDEN",
      });
    }

    const offerId = await ctx.db.insert("publicationOffers", {
      publicationId: args.publicationId,
      buyerId: user._id,
      amount: args.amount,
      message: args.message,
      status: "pending",
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.publicationId, {
      offerCount: (pub.offerCount ?? 0) + 1,
    });

    return {
      offerId,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Reserve
// ─────────────────────────────────────────────────────────────────────────────

export const reserve = mutation({
  args: {
    publicationId: v.id("publications"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const pub = await ctx.db.get(args.publicationId);

    if (!pub) {
      throw new ConvexError({
        message: "Publication introuvable",
        code: "NOT_FOUND",
      });
    }

    if (pub.authorId !== user._id) {
      throw new ConvexError({
        message: "Seul le propriétaire peut réserver",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.publicationId, {
      isReserved: true,
    });

    return {
      success: true,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Mark sold
// ─────────────────────────────────────────────────────────────────────────────

export const markSold = mutation({
  args: {
    publicationId: v.id("publications"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const pub = await ctx.db.get(args.publicationId);

    if (!pub) {
      throw new ConvexError({
        message: "Publication introuvable",
        code: "NOT_FOUND",
      });
    }

    if (pub.authorId !== user._id) {
      throw new ConvexError({
        message: "Seul le propriétaire peut marquer comme vendu",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.publicationId, {
      isSold: true,
      status: "sold",
    });

    return {
      success: true,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Promote
// ─────────────────────────────────────────────────────────────────────────────

export const promote = mutation({
  args: {
    publicationId: v.id("publications"),
    duration: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const pub = await ctx.db.get(args.publicationId);

    if (!pub) {
      throw new ConvexError({
        message: "Publication introuvable",
        code: "NOT_FOUND",
      });
    }

    if (pub.authorId !== user._id) {
      throw new ConvexError({
        message: "Non autorisé",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.publicationId, {
      isPromoted: true,
      promotionEnd: Date.now() + (args.duration ?? 7 * 24 * 60 * 60 * 1000),
    });

    return {
      success: true,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Boost
// ─────────────────────────────────────────────────────────────────────────────

export const boost = mutation({
  args: {
    publicationId: v.id("publications"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const pub = await ctx.db.get(args.publicationId);

    if (!pub) {
      throw new ConvexError({
        message: "Publication introuvable",
        code: "NOT_FOUND",
      });
    }

    if (pub.authorId !== user._id) {
      throw new ConvexError({
        message: "Non autorisé",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.publicationId, {
      isPromoted: true,
    });

    return {
      success: true,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Search annonces
// ─────────────────────────────────────────────────────────────────────────────

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
    let publicationsQuery = ctx.db
      .query("publications")
      .withIndex("by_status", (q) => q.eq("status", "active"));

    if (args.type) {
      publicationsQuery = publicationsQuery.filter((q) =>
        q.eq(q.field("type"), args.type),
      );
    }

    if (args.location) {
      publicationsQuery = publicationsQuery.filter((q) =>
        q.eq(q.field("location"), args.location),
      );
    }

    const results = await publicationsQuery.order("desc").take(500);

    const normalizedSearch = args.search?.trim().toLowerCase();

    const filtered = results.filter((publication) => {
      const meta = parsePublicationMeta(publication.meta);

      if (normalizedSearch) {
        const haystack = [
          publication.title,
          publication.description,
          publication.category ?? "",
          publication.location ?? "",
          ...publication.tags,
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(normalizedSearch)) {
          return false;
        }
      }

      if (args.minPrice !== undefined) {
        const price = Number(publication.price?.replace(/[^\d.-]/g, "") ?? "");

        if (!Number.isFinite(price) || price < args.minPrice) {
          return false;
        }
      }

      if (args.maxPrice !== undefined) {
        const price = Number(publication.price?.replace(/[^\d.-]/g, "") ?? "");

        if (!Number.isFinite(price) || price > args.maxPrice) {
          return false;
        }
      }

      if (args.condition && readString(meta, "condition") !== args.condition) {
        return false;
      }

      if (
        args.negotiable !== undefined &&
        readBoolean(meta, "negotiable") !== args.negotiable
      ) {
        return false;
      }

      if (
        args.delivery !== undefined &&
        readBoolean(meta, "delivery") !== args.delivery
      ) {
        return false;
      }

      return true;
    });

    const sorted = [...filtered];

    if (args.sort === "price_asc") {
      sorted.sort(
        (a, b) =>
          (readNumber(parsePublicationMeta(a.meta), "price") ??
            Number(a.price?.replace(/[^\d.-]/g, "") ?? 0)) -
          (readNumber(parsePublicationMeta(b.meta), "price") ??
            Number(b.price?.replace(/[^\d.-]/g, "") ?? 0)),
      );
    }

    if (args.sort === "price_desc") {
      sorted.sort(
        (a, b) =>
          (readNumber(parsePublicationMeta(b.meta), "price") ??
            Number(b.price?.replace(/[^\d.-]/g, "") ?? 0)) -
          (readNumber(parsePublicationMeta(a.meta), "price") ??
            Number(a.price?.replace(/[^\d.-]/g, "") ?? 0)),
      );
    }

    return sorted.slice(0, args.limit ?? 50);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Bridge
// ─────────────────────────────────────────────────────────────────────────────

export const getBridgeData = query({
  args: {
    type: v.string(),
    id: v.string(),
  },

  handler: async (ctx, args) => {
    if (args.type !== "publication") {
      return null;
    }

    const publicationId = args.id as Id<"publications">;

    return await ctx.db.get(publicationId);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Demo seed
// ─────────────────────────────────────────────────────────────────────────────

export const seedDemoPublications = mutation({
  args: {},

  handler: async (
    ctx,
  ): Promise<{
    inserted: number;
  }> => {
    const existing = await ctx.db.query("publications").take(1);

    if (existing.length > 0) {
      return {
        inserted: 0,
      };
    }

    const users = await ctx.db.query("users").take(1);

    if (users.length === 0) {
      return {
        inserted: 0,
      };
    }

    const authorId = users[0]._id;

    const demo: Array<
      Omit<Doc<"publications">, "_id" | "_creationTime" | "authorId">
    > = [
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
        meta: JSON.stringify({
          condition: "comme neuf",
          negotiable: false,
        }),
      },
    ];

    let inserted = 0;

    for (const publication of demo) {
      await ctx.db.insert("publications", {
        ...publication,
        authorId,
      });

      inserted += 1;
    }

    return {
      inserted,
    };
  },
});
