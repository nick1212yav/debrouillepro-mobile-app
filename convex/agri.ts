// convex/agri.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// ─── Helpers de validation de Session ──────────────────────────────────────────
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

async function requireAdmin(ctx: MutationCtx) {
  const user = await requireUser(ctx);
  if (!user.roles?.includes("admin"))
    throw new ConvexError({ code: "FORBIDDEN", message: "Admin requis" });
  return user;
}

// ─── Résolution des images Convex Storage → URLs publiques ────────────────────
async function resolveAgriImages(
  ctx: QueryCtx,
  images?: string[],
): Promise<string[]> {
  if (!Array.isArray(images)) return [];

  const resolved = await Promise.all(
    images.map(async (image) => {
      if (!image) return null;

      // URL déjà publique (ex: CDN ou hébergement externe)
      if (image.startsWith("http://") || image.startsWith("https://")) {
        return image;
      }

      // Les blob: URLs sont éphémères et locales au navigateur de l'auteur.
      // Elles ne doivent jamais être enregistrées directement dans Convex.
      if (image.startsWith("blob:")) {
        console.warn("[AGRI] Blob URL invalide détectée en base:", image);
        return null;
      }

      // Résolution du Storage ID Convex d'origine
      try {
        const url = await ctx.storage.getUrl(image as Id<"_storage">);
        return url ?? null;
      } catch (error) {
        console.warn("[AGRI] Impossible de résoudre l'image:", image, error);
        return null;
      }
    }),
  );

  return resolved.filter((url): url is string => Boolean(url));
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. PRODUITS AGRICOLES – CRUD
// ─────────────────────────────────────────────────────────────────────────────

export const listProducts = query({
  args: {
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    maxPrice: v.optional(v.number()),
    minRating: v.optional(v.number()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    sort: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let products = await ctx.db.query("agriProducts").collect();

    // Filtre de catégorie
    if (args.category) {
      products = products.filter((p) => p.category === args.category);
    }

    // Filtre de localisation (ville)
    if (args.location) {
      products = products.filter(
        (p) => p.location.city.toLowerCase() === args.location!.toLowerCase(),
      );
    }

    // Filtre de prix maximum
    if (args.maxPrice) {
      products = products.filter((p) => p.pricing.price <= args.maxPrice!);
    }

    // Filtre de réputation minimale du vendeur
    if (args.minRating) {
      products = products.filter(
        (p) => (p.seller.rating ?? 0) >= args.minRating!,
      );
    }

    // Filtre de recherche textuelle globale (titre, description, variété)
    if (args.search) {
      const s = args.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(s) ||
          p.description.toLowerCase().includes(s) ||
          (p.variety && p.variety.toLowerCase().includes(s)),
      );
    }

    // Application du tri
    if (args.sort === "price_asc") {
      products.sort((a, b) => a.pricing.price - b.pricing.price);
    } else if (args.sort === "price_desc") {
      products.sort((a, b) => b.pricing.price - a.pricing.price);
    } else if (args.sort === "rating") {
      products.sort((a, b) => (b.seller.rating ?? 0) - (a.seller.rating ?? 0));
    } else if (args.sort === "stock_desc") {
      products.sort((a, b) => b.quantity.available - a.quantity.available);
    } else {
      // Tri par défaut : du plus récent au plus ancien
      products.sort((a, b) => b._creationTime - a._creationTime);
    }

    if (args.limit) products = products.slice(0, args.limit);

    // Résolution des IDs de stockage en URLs publiques d'affichage pour toutes les cartes
    return await Promise.all(
      products.map(async (product) => ({
        ...product,
        media: {
          ...product.media,
          images: await resolveAgriImages(ctx, product.media?.images),
        },
      })),
    );
  },
});

export const getProduct = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    let resolvedId: Id<"agriProducts"> | null = null;

    const directId = ctx.db.normalizeId("agriProducts", args.id);
    if (directId) {
      resolvedId = directId;
    } else {
      // Résolution si l'ID provient d'un élément du fil de publication général
      const pubId = ctx.db.normalizeId("publications", args.id);
      if (pubId) {
        const publication = await ctx.db.get(pubId);
        if (publication && publication.meta) {
          try {
            const meta = JSON.parse(publication.meta);
            const prdId = meta.productId || meta.id || publication.meta;
            const testId = ctx.db.normalizeId("agriProducts", prdId);
            if (testId) resolvedId = testId;
          } catch {
            const testId = ctx.db.normalizeId("agriProducts", publication.meta);
            if (testId) resolvedId = testId;
          }
        }
      }
    }

    if (!resolvedId) return null;
    const product = await ctx.db.get(resolvedId);
    if (!product) return null;

    // Résolution des images du produit à l'ouverture de sa page de détails
    return {
      ...product,
      media: {
        ...product.media,
        images: await resolveAgriImages(ctx, product.media?.images),
      },
    };
  },
});

export const createProduct = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    subcategory: v.optional(v.string()),
    variety: v.optional(v.string()),
    quality: v.string(),
    condition: v.optional(v.string()),
    pricing: v.object({
      price: v.number(),
      currency: v.string(),
      priceUnit: v.string(),
      negotiable: v.boolean(),
    }),
    quantity: v.object({
      available: v.number(),
      unit: v.string(),
      minimumOrder: v.optional(v.number()),
    }),
    location: v.object({
      country: v.string(),
      province: v.optional(v.string()),
      city: v.string(),
      territory: v.optional(v.string()),
    }),
    delivery: v.object({
      available: v.boolean(),
      radius: v.optional(v.number()),
      price: v.optional(v.number()),
      pickupAvailable: v.boolean(),
    }),
    images: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    // Nettoyage de sécurité : on exclut les blob URLs locales du processus d'écriture
    const sanitizedImages = (args.images || []).filter(
      (img) => !img.startsWith("blob:"),
    );

    // 1. Enregistrement dans la table "agriProducts"
    const productId = await ctx.db.insert("agriProducts", {
      title: args.title,
      description: args.description,
      category: args.category,
      subcategory: args.subcategory,
      variety: args.variety,
      quality: args.quality,
      condition: args.condition,
      pricing: args.pricing,
      quantity: args.quantity,
      location: args.location,
      delivery: args.delivery,
      media: {
        images: sanitizedImages,
      },
      seller: {
        userId: user._id,
        name: user.name || "Producteur local",
        verified: user.roles?.includes("verified_seller") || false,
        rating: 5.0,
        reviewCount: 0,
        joinedAt: new Date(user._creationTime).toISOString().slice(0, 7),
      },
      stats: {
        views: 0,
        favorites: 0,
        contacts: 0,
      },
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
    });

    // 2. Publication associée dans le fil général "publications" [1]
    await ctx.db.insert("publications", {
      type: "agri",
      title: args.title,
      description: args.description,
      authorId: user._id,
      tags: [args.category],
      images: sanitizedImages,
      meta: JSON.stringify({
        productId,
        category: args.category,
        variety: args.variety,
        price: args.pricing.price,
        currency: args.pricing.currency,
        unit: args.pricing.priceUnit,
        city: args.location.city,
      }),
      likeCount: 0,
      commentCount: 0,
      viewCount: 0,
      status: "active",
    });

    return productId;
  },
});

export const updateProduct = mutation({
  args: {
    id: v.id("agriProducts"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    subcategory: v.optional(v.string()),
    variety: v.optional(v.string()),
    quality: v.optional(v.string()),
    condition: v.optional(v.string()),
    pricing: v.optional(
      v.object({
        price: v.number(),
        currency: v.string(),
        priceUnit: v.string(),
        negotiable: v.boolean(),
      }),
    ),
    quantity: v.optional(
      v.object({
        available: v.number(),
        unit: v.string(),
        minimumOrder: v.optional(v.number()),
      }),
    ),
    location: v.optional(
      v.object({
        country: v.string(),
        province: v.optional(v.string()),
        city: v.string(),
        territory: v.optional(v.string()),
      }),
    ),
    delivery: v.optional(
      v.object({
        available: v.boolean(),
        radius: v.optional(v.number()),
        price: v.optional(v.number()),
        pickupAvailable: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const { id, ...updates } = args;
    const product = await ctx.db.get(id);

    if (!product) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Annonce agricole introuvable",
      });
    }

    if (product.seller.userId !== user._id && !user.roles?.includes("admin")) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const deleteProduct = mutation({
  args: { id: v.id("agriProducts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const product = await ctx.db.get(args.id);

    if (!product) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Annonce agricole introuvable",
      });
    }

    if (product.seller.userId !== user._id && !user.roles?.includes("admin")) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    }

    await ctx.db.delete(args.id);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. COMMANDES / RESERVATIONS AGRICOLES
// ─────────────────────────────────────────────────────────────────────────────

export const listBookings = query({
  args: {
    productId: v.optional(v.id("agriProducts")),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    let bookings = await ctx.db.query("agriBookings").collect();

    if (args.productId) {
      bookings = bookings.filter((b) => b.productId === args.productId);
    } else {
      bookings = bookings.filter((b) => b.userId === user._id);
    }

    if (args.status) {
      bookings = bookings.filter((b) => b.status === args.status);
    }

    bookings.sort((a, b) => b._creationTime - a._creationTime);
    if (args.limit) bookings = bookings.slice(0, args.limit);
    return bookings;
  },
});

export const createBooking = mutation({
  args: {
    productId: v.id("agriProducts"),
    quantity: v.number(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const product = await ctx.db.get(args.productId);

    if (!product) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Produit agricole introuvable",
      });
    }

    if (args.quantity > product.quantity.available) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "La quantité demandée dépasse le stock disponible",
      });
    }

    const total = product.pricing.price * args.quantity;

    const bookingId = await ctx.db.insert("agriBookings", {
      userId: user._id,
      productId: args.productId,
      quantity: args.quantity,
      totalAmount: total,
      currency: product.pricing.currency || "USD",
      status: "pending",
      message: args.message,
    });

    // Mettre à jour les statistiques de contacts
    await ctx.db.patch(args.productId, {
      stats: {
        ...product.stats,
        contacts: (product.stats.contacts ?? 0) + 1,
      },
    });

    return { bookingId, total };
  },
});

export const cancelBooking = mutation({
  args: { id: v.id("agriBookings") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const booking = await ctx.db.get(args.id);

    if (!booking) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Commande introuvable",
      });
    }

    if (booking.userId !== user._id && !user.roles?.includes("admin")) {
      const product = await ctx.db.get(booking.productId);
      if (product?.seller.userId !== user._id) {
        throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
      }
    }

    await ctx.db.patch(args.id, { status: "cancelled" });
    return { success: true };
  },
});

export const confirmBooking = mutation({
  args: { id: v.id("agriBookings") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const booking = await ctx.db.get(args.id);

    if (!booking) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Commande introuvable",
      });
    }

    const product = await ctx.db.get(booking.productId);
    if (!product) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Produit agricole associé introuvable",
      });
    }

    if (product.seller.userId !== user._id && !user.roles?.includes("admin")) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    }

    if (booking.status !== "pending") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Commande déjà traitée",
      });
    }

    // Déduire la quantité achetée du stock
    if (product.quantity.available >= booking.quantity) {
      const nextAvailable = product.quantity.available - booking.quantity;
      const currentStatus = product.availability?.status ?? "available";
      const nextStatus = (nextAvailable <= 0 ? "sold_out" : currentStatus) as
        | "available"
        | "limited"
        | "sold_out"
        | "unavailable";

      await ctx.db.patch(booking.productId, {
        quantity: {
          ...product.quantity,
          available: nextAvailable,
        },
        availability: {
          status: nextStatus,
        },
      });
    }

    await ctx.db.patch(args.id, { status: "confirmed" });
    return { success: true };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. REVIEWS (Commentaires & Évaluations)
// ─────────────────────────────────────────────────────────────────────────────

export const getProductReviews = query({
  args: { productId: v.id("agriProducts") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db.query("agriReviews").collect();
    return reviews.filter((r) => r.productId === args.productId);
  },
});

export const addReview = mutation({
  args: {
    productId: v.id("agriProducts"),
    rating: v.number(),
    comment: v.optional(v.string()),
    bookingId: v.id("agriBookings"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const product = await ctx.db.get(args.productId);

    if (!product) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Produit agricole introuvable",
      });
    }

    const existing = await ctx.db
      .query("agriReviews")
      .filter((q) =>
        q.and(
          q.eq(q.field("productId"), args.productId),
          q.eq(q.field("reviewerId"), user._id),
        ),
      )
      .first();

    if (existing) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Vous avez déjà posté un avis pour ce produit",
      });
    }

    const reviewId = await ctx.db.insert("agriReviews", {
      productId: args.productId,
      reviewerId: user._id,
      authorName: user.name || "Acheteur anonyme",
      rating: args.rating,
      comment: args.comment,
      bookingId: args.bookingId,
    });

    // Recalculer la moyenne globale d'étoiles du produit
    const allReviews = await ctx.db.query("agriReviews").collect();
    const productReviews = allReviews.filter(
      (r) => r.productId === args.productId,
    );
    const avg =
      productReviews.reduce((sum, r) => sum + r.rating, 0) /
      productReviews.length;

    await ctx.db.patch(args.productId, {
      seller: {
        ...product.seller,
        rating: Number(avg.toFixed(1)),
        reviewCount: productReviews.length,
      },
    });

    return reviewId;
  },
});

export const deleteReview = mutation({
  args: { id: v.id("agriReviews") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const review = await ctx.db.get(args.id);

    if (!review) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Avis introuvable" });
    }

    if (review.reviewerId !== user._id && !user.roles?.includes("admin")) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    }

    await ctx.db.delete(args.id);

    const product = await ctx.db.get(review.productId);
    if (product) {
      const allReviews = await ctx.db.query("agriReviews").collect();
      const productReviews = allReviews.filter(
        (r) => r.productId === review.productId,
      );

      if (productReviews.length > 0) {
        const avg =
          productReviews.reduce((sum, r) => sum + r.rating, 0) /
          productReviews.length;
        await ctx.db.patch(review.productId, {
          seller: {
            ...product.seller,
            rating: Number(avg.toFixed(1)),
            reviewCount: productReviews.length,
          },
        });
      } else {
        await ctx.db.patch(review.productId, {
          seller: {
            ...product.seller,
            rating: 5.0,
            reviewCount: 0,
          },
        });
      }
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. FAVORIS
// ─────────────────────────────────────────────────────────────────────────────

export const getUserFavorites = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const favorites = await ctx.db
      .query("agriFavorites")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return favorites.map((f) => f.productId);
  },
});

export const toggleFavorite = mutation({
  args: { productId: v.id("agriProducts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("agriFavorites")
      .withIndex("by_user_and_product", (q) =>
        q.eq("userId", user._id).eq("productId", args.productId),
      )
      .unique();

    const product = await ctx.db.get(args.productId);

    if (existing) {
      await ctx.db.delete(existing._id);
      if (product) {
        await ctx.db.patch(args.productId, {
          stats: {
            ...product.stats,
            favorites: Math.max(0, (product.stats.favorites ?? 0) - 1),
          },
        });
      }
      return { favorited: false };
    } else {
      await ctx.db.insert("agriFavorites", {
        userId: user._id,
        productId: args.productId,
        createdAt: Date.now(),
      });
      if (product) {
        await ctx.db.patch(args.productId, {
          stats: {
            ...product.stats,
            favorites: (product.stats.favorites ?? 0) + 1,
          },
        });
      }
      return { favorited: true };
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. SELLER PROFILE / SHOP (useAgriSeller)
// ─────────────────────────────────────────────────────────────────────────────

export const getSellerProfile = query({
  args: { sellerId: v.string() },
  handler: async (ctx, args) => {
    const sellerIdCast = ctx.db.normalizeId("users", args.sellerId);
    if (!sellerIdCast) return null;

    const user = await ctx.db.get(sellerIdCast);
    if (!user) return null;

    return {
      userId: user._id,
      name: user.name || "Producteur local",
      verified: user.roles?.includes("verified_seller") || false,
      rating: 5.0, // Peut être synchronisé dynamiquement
      reviewCount: 0,
      joinedAt: new Date(user._creationTime).toISOString().slice(0, 7),
    };
  },
});

export const getSellerProducts = query({
  args: { sellerId: v.string() },
  handler: async (ctx, args) => {
    const sellerIdCast = ctx.db.normalizeId("users", args.sellerId);
    if (!sellerIdCast) return [];

    const products = await ctx.db.query("agriProducts").collect();
    const sellerProducts = products.filter(
      (p) => p.seller.userId === sellerIdCast,
    );

    return await Promise.all(
      sellerProducts.map(async (product) => ({
        ...product,
        media: {
          ...product.media,
          images: await resolveAgriImages(ctx, product.media?.images),
        },
      })),
    );
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. STATISTIQUES (pour Dashboard agricole)
// ─────────────────────────────────────────────────────────────────────────────

export const getAgriStats = query({
  args: { productId: v.id("agriProducts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const product = await ctx.db.get(args.productId);

    if (!product) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Produit agricole introuvable",
      });
    }

    if (product.seller.userId !== user._id && !user.roles?.includes("admin")) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    }

    const bookings = await ctx.db.query("agriBookings").collect();
    const productBookings = bookings.filter(
      (b) => b.productId === args.productId,
    );

    const totalOrders = productBookings.length;
    const confirmed = productBookings.filter(
      (b) => b.status === "confirmed" || b.status === "completed",
    );
    const revenue = confirmed.reduce((sum, b) => sum + b.totalAmount, 0);
    const quantitySold = confirmed.reduce((sum, b) => sum + b.quantity, 0);

    return {
      totalOrders,
      confirmedOrders: confirmed.length,
      revenue,
      quantitySold,
      views: product.stats.views ?? 0,
      favorites: product.stats.favorites ?? 0,
      rating: product.seller.rating ?? 0,
    };
  },
});
