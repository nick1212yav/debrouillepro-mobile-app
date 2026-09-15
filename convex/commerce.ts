// convex/commerce.ts
// Module Marketplace – Backend Convex – Version finale avec résolution d'images et logs de débogage

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

// ── Helpers ──────────────────────────────────────────────────────────────────
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
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

// ✅ Résolution des images (storageId → URL) avec logs
async function resolveProductImages(
  ctx: QueryCtx | MutationCtx,
  product: Doc<"products">,
): Promise<Doc<"products"> & { images: string[] }> {
  console.log(
    "🔍 [resolveProductImages] Input product.images:",
    product.images,
  );

  const rawImages = product.images || [];
  console.log("🔍 [resolveProductImages] rawImages length:", rawImages.length);

  const resolvedImages = await Promise.all(
    rawImages.map(async (img) => {
      if (!img) return null;
      // Si c'est déjà une URL publique, on la garde
      if (
        img.startsWith("http://") ||
        img.startsWith("https://") ||
        img.startsWith("data:")
      ) {
        console.log("✅ [resolveProductImages] URL déjà publique:", img);
        return img;
      }
      try {
        const url = await ctx.storage.getUrl(img as Id<"_storage">);
        console.log(
          `✅ [resolveProductImages] storageId ${img} → ${url || "null"}`,
        );
        return url ?? null;
      } catch (e) {
        console.error("❌ [resolveProductImages] Erreur pour", img, e);
        return null;
      }
    }),
  );

  const filtered = resolvedImages.filter((url): url is string => url !== null);
  console.log(
    "🔍 [resolveProductImages] Résultat final :",
    filtered.length,
    "images",
  );

  return {
    ...product,
    images: filtered,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────
export const listProducts = query({
  args: {
    category: v.optional(v.string()),
    status: v.optional(v.string()),
    sellerId: v.optional(v.id("users")),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("products");
    if (args.sellerId) {
      q = q.withIndex("by_seller", (qi: any) =>
        qi.eq("sellerId", args.sellerId!),
      );
    } else if (args.status) {
      q = q.withIndex("by_status", (qi: any) =>
        qi.eq("status", args.status as "active" | "out_of_stock" | "archived"),
      );
    } else if (args.category) {
      q = q.withIndex("by_category", (qi: any) =>
        qi.eq("category", args.category!),
      );
    }
    const result = await q.order("desc").paginate(args.paginationOpts);
    const page = await Promise.all(
      result.page.map((product: Doc<"products">) =>
        resolveProductImages(ctx, product),
      ),
    );
    return { ...result, page };
  },
});

export const getProduct = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    console.log("🔍 [getProduct] Début pour id:", args.id);
    const product = await ctx.db.get(args.id);
    if (!product) {
      console.warn("❌ [getProduct] Produit introuvable");
      return null;
    }

    console.log(
      "🔍 [getProduct] product.images avant résolution:",
      product.images,
    );

    // ✅ Résoudre les images
    const resolved = await resolveProductImages(ctx, product);

    console.log(
      "🔍 [getProduct] après résolution, images:",
      resolved.images.length,
    );

    // Récupérer le vendeur
    const seller = await ctx.db.get(product.sellerId);

    // Récupérer les avis
    const reviews = await ctx.db
      .query("productReviews")
      .withIndex("by_product", (q) => q.eq("productId", args.id))
      .collect();

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : undefined;

    const result = {
      ...resolved,
      sellerName: seller?.name ?? "Vendeur",
      sellerAvatar: seller?.avatar,
      rating: avgRating,
      reviewCount: reviews.length,
    };

    console.log("✅ [getProduct] Résultat final :", {
      id: result._id,
      title: result.title,
      imagesCount: result.images.length,
      firstImage: result.images[0] || "aucune",
    });

    return result;
  },
});

// ─── Le reste du fichier est inchangé ──────────────────────────────────────
// (Toutes les autres fonctions restent identiques à ton code existant)
// ─────────────────────────────────────────────────────────────────────────────

export const searchProducts = query({
  args: { q: v.string(), category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("products")
      .withSearchIndex("search_products", (qi) =>
        args.category
          ? qi.search("title", args.q).eq("category", args.category)
          : qi.search("title", args.q),
      )
      .take(20);
    return Promise.all(results.map((p) => resolveProductImages(ctx, p)));
  },
});

export const createProduct = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    price: v.number(),
    currency: v.string(),
    category: v.string(),
    images: v.array(v.string()),
    stock: v.number(),
    unit: v.optional(v.string()),
    tags: v.array(v.string()),
    isDigital: v.boolean(),
    deliveryAvailable: v.boolean(),
    location: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    console.log("🔍 [createProduct] images reçues:", args.images);
    return ctx.db.insert("products", {
      ...args,
      sellerId: user._id,
      status: "active",
    });
  },
});

export const updateProduct = mutation({
  args: {
    id: v.id("products"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    stock: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("out_of_stock"),
        v.literal("archived"),
      ),
    ),
    images: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const { id, ...updates } = args;
    const product = await ctx.db.get(id);
    if (!product)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Produit introuvable",
      });
    if (product.sellerId !== user._id && !user.isAdmin)
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    await ctx.db.patch(id, updates);
  },
});

export const deleteProduct = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const product = await ctx.db.get(args.id);
    if (!product)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Produit introuvable",
      });
    if (product.sellerId !== user._id && !user.isAdmin)
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    await ctx.db.delete(args.id);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. CART
// ─────────────────────────────────────────────────────────────────────────────
export const getMyCart = query({
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
    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return Promise.all(
      items.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        const resolvedProduct = product
          ? await resolveProductImages(ctx, product)
          : null;
        return { ...item, product: resolvedProduct };
      }),
    );
  },
});

export const addToCart = mutation({
  args: { productId: v.id("products"), quantity: v.number() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_user_and_product", (q) =>
        q.eq("userId", user._id).eq("productId", args.productId),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        quantity: existing.quantity + args.quantity,
      });
    } else {
      await ctx.db.insert("cartItems", {
        userId: user._id,
        productId: args.productId,
        quantity: args.quantity,
      });
    }
  },
});

export const updateCartItem = mutation({
  args: { itemId: v.id("cartItems"), quantity: v.number() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const item = await ctx.db.get(args.itemId);
    if (!item || item.userId !== user._id)
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    if (args.quantity <= 0) {
      await ctx.db.delete(args.itemId);
    } else {
      await ctx.db.patch(args.itemId, { quantity: args.quantity });
    }
  },
});

export const clearCart = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    await Promise.all(items.map((i) => ctx.db.delete(i._id)));
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. ORDERS
// ─────────────────────────────────────────────────────────────────────────────
export const createOrder = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
    deliveryAddress: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const product = await ctx.db.get(args.productId);
    if (!product)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Produit introuvable",
      });
    if (product.stock < args.quantity)
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Stock insuffisant",
      });
    const totalAmount = product.price * args.quantity;
    const orderId = await ctx.db.insert("orders", {
      buyerId: user._id,
      sellerId: product.sellerId,
      productId: args.productId,
      quantity: args.quantity,
      totalAmount,
      currency: product.currency,
      status: "pending",
      deliveryAddress: args.deliveryAddress,
      note: args.note,
    });
    await ctx.db.patch(args.productId, {
      stock: product.stock - args.quantity,
    });
    return orderId;
  },
});

export const getMyOrders = query({
  args: { role: v.union(v.literal("buyer"), v.literal("seller")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) return [];
    const orders =
      args.role === "buyer"
        ? await ctx.db
            .query("orders")
            .withIndex("by_buyer", (q) => q.eq("buyerId", user._id))
            .order("desc")
            .take(50)
        : await ctx.db
            .query("orders")
            .withIndex("by_seller", (q) => q.eq("sellerId", user._id))
            .order("desc")
            .take(50);
    return Promise.all(
      orders.map(async (order) => {
        const product = await ctx.db.get(order.productId);
        const resolvedProduct = product
          ? await resolveProductImages(ctx, product)
          : null;
        const counterpart = await ctx.db.get(
          args.role === "buyer" ? order.sellerId : order.buyerId,
        );
        return {
          ...order,
          product: resolvedProduct,
          counterpartName: counterpart?.name,
        };
      }),
    );
  },
});

export const updateOrderStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.union(
      v.literal("confirmed"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("refunded"),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const order = await ctx.db.get(args.id);
    if (!order)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Commande introuvable",
      });
    if (
      order.sellerId !== user._id &&
      order.buyerId !== user._id &&
      !user.isAdmin
    )
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    const patch: Partial<{
      status: typeof args.status;
      deliveredAt: string;
      paidAt: string;
    }> = { status: args.status };
    if (args.status === "delivered")
      patch.deliveredAt = new Date().toISOString();
    if (args.status === "confirmed") patch.paidAt = new Date().toISOString();
    await ctx.db.patch(args.id, patch);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. PRODUCT REVIEWS
// ─────────────────────────────────────────────────────────────────────────────
export const getProductReviews = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("productReviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .order("desc")
      .take(20);
    return Promise.all(
      reviews.map(async (r) => {
        const reviewer = await ctx.db.get(r.reviewerId);
        return {
          ...r,
          reviewerName: reviewer?.name,
          reviewerAvatar: reviewer?.avatar,
        };
      }),
    );
  },
});

export const createReview = mutation({
  args: {
    productId: v.id("products"),
    orderId: v.id("orders"),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await ctx.db.insert("productReviews", { ...args, reviewerId: user._id });
  },
});

export const likeReview = mutation({
  args: { reviewId: v.id("productReviews") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const review = await ctx.db.get(args.reviewId);
    if (!review)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Avis introuvable",
      });
    const existing = await ctx.db
      .query("reviewLikes")
      .withIndex("by_user_and_review", (q) =>
        q.eq("userId", user._id).eq("reviewId", args.reviewId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { liked: false };
    }
    await ctx.db.insert("reviewLikes", {
      userId: user._id,
      reviewId: args.reviewId,
    });
    return { liked: true };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. WISHLIST
// ─────────────────────────────────────────────────────────────────────────────
export const getWishlist = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const items = await ctx.db
      .query("wishlistItems")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return Promise.all(
      items.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        const resolvedProduct = product
          ? await resolveProductImages(ctx, product)
          : null;
        return { ...item, product: resolvedProduct };
      }),
    );
  },
});

export const toggleWishlist = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("wishlistItems")
      .withIndex("by_user_and_product", (q) =>
        q.eq("userId", user._id).eq("productId", args.productId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { added: false };
    }
    await ctx.db.insert("wishlistItems", {
      userId: user._id,
      productId: args.productId,
    });
    return { added: true };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. RECOMMENDATIONS
// ─────────────────────────────────────────────────────────────────────────────
export const getRecommendations = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const products = await ctx.db.query("products").order("desc").take(6);
    const filtered = products.filter((p) => p._id !== args.productId);
    return Promise.all(filtered.map((p) => resolveProductImages(ctx, p)));
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. CATEGORIES & STATS
// ─────────────────────────────────────────────────────────────────────────────
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").take(100);
    const categories = [...new Set(products.map((p) => p.category))];
    return categories.map((cat) => ({
      id: cat,
      label: cat,
      count: products.filter((p) => p.category === cat).length,
    }));
  },
});

export const getMarketplaceStats = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const orders = await ctx.db.query("orders").collect();
    const totalRevenue = orders
      .filter((o) => o.status === "delivered")
      .reduce((s, o) => s + o.totalAmount, 0);
    return {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue,
      activeSellers: new Set(products.map((p) => p.sellerId)).size,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. FLASH DEALS
// ─────────────────────────────────────────────────────────────────────────────
export const getFlashDeals = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("products").take(20);
    const deals = all.slice(0, 4);
    const resolved = await Promise.all(
      deals.map((p) => resolveProductImages(ctx, p)),
    );
    return resolved.map((p, i) => ({
      ...p,
      flashPrice: p.price * (0.7 + Math.random() * 0.2),
      originalPrice: p.price,
      endsAt: new Date(Date.now() + 3600000 * (2 + i)).toISOString(),
    }));
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
export const getNotifications = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    return ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. SELLER
// ─────────────────────────────────────────────────────────────────────────────
export const getSeller = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    const products = await ctx.db
      .query("products")
      .withIndex("by_seller", (q) => q.eq("sellerId", args.userId))
      .collect();
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_seller", (q) => q.eq("sellerId", args.userId))
      .collect();
    const delivered = orders.filter((o) => o.status === "delivered");
    const totalSales = delivered.reduce((s, o) => s + o.totalAmount, 0);
    const productIds = products.map((p) => p._id);
    let reviews: Doc<"productReviews">[] = [];
    for (const pid of productIds.slice(0, 5)) {
      const r = await ctx.db
        .query("productReviews")
        .withIndex("by_product", (q) => q.eq("productId", pid))
        .take(10);
      reviews = reviews.concat(r);
    }
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : undefined;
    return {
      ...user,
      totalProducts: products.length,
      totalOrders: orders.length,
      totalSales,
      rating: avgRating,
      reviewCount: reviews.length,
    };
  },
});

export const followSeller = mutation({
  args: { sellerId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("sellerFollowers")
      .withIndex("by_user_and_seller", (q) =>
        q.eq("userId", user._id).eq("sellerId", args.sellerId),
      )
      .unique();
    if (existing) return { followed: false };
    await ctx.db.insert("sellerFollowers", {
      userId: user._id,
      sellerId: args.sellerId,
    });
    return { followed: true };
  },
});

export const unfollowSeller = mutation({
  args: { sellerId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("sellerFollowers")
      .withIndex("by_user_and_seller", (q) =>
        q.eq("userId", user._id).eq("sellerId", args.sellerId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { unfollowed: true };
    }
    return { unfollowed: false };
  },
});

export const getSellerFollowers = query({
  args: { sellerId: v.id("users") },
  handler: async (ctx, args) => {
    const followers = await ctx.db
      .query("sellerFollowers")
      .withIndex("by_seller", (q) => q.eq("sellerId", args.sellerId))
      .collect();
    return Promise.all(
      followers.map(async (f) => {
        const user = await ctx.db.get(f.userId);
        return { ...f, user };
      }),
    );
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. QUESTIONS
// ─────────────────────────────────────────────────────────────────────────────
export const getProductQuestions = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("productQuestions")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .order("desc")
      .take(20);
    return Promise.all(
      questions.map(async (q) => {
        const author = await ctx.db.get(q.authorId);
        return { ...q, authorName: author?.name, authorAvatar: author?.avatar };
      }),
    );
  },
});

export const askQuestion = mutation({
  args: { productId: v.id("products"), question: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await ctx.db.insert("productQuestions", {
      productId: args.productId,
      authorId: user._id,
      question: args.question,
      createdAt: Date.now(),
    });
  },
});

export const answerQuestion = mutation({
  args: { questionId: v.id("productQuestions"), answer: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const question = await ctx.db.get(args.questionId);
    if (!question)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Question introuvable",
      });
    const product = await ctx.db.get(question.productId);
    if (!product || (product.sellerId !== user._id && !user.isAdmin))
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Non autorisé",
      });
    await ctx.db.patch(args.questionId, {
      answer: args.answer,
      answeredAt: Date.now(),
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. RECENTLY VIEWED
// ─────────────────────────────────────────────────────────────────────────────
export const getRecentlyViewed = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const views = await ctx.db
      .query("recentlyViewed")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(10);
    return Promise.all(
      views.map(async (v) => {
        const product = await ctx.db.get(v.productId);
        const resolvedProduct = product
          ? await resolveProductImages(ctx, product)
          : null;
        return { ...v, product: resolvedProduct };
      }),
    );
  },
});

export const trackRecentlyViewed = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return;
    const existing = await ctx.db
      .query("recentlyViewed")
      .withIndex("by_user_and_product", (q) =>
        q.eq("userId", user._id).eq("productId", args.productId),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { viewedAt: Date.now() });
    } else {
      await ctx.db.insert("recentlyViewed", {
        userId: user._id,
        productId: args.productId,
        viewedAt: Date.now(),
      });
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. PAYMENT (simulation)
// ─────────────────────────────────────────────────────────────────────────────
export const processPayment = mutation({
  args: {
    orderId: v.id("orders"),
    amount: v.number(),
    method: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order || order.buyerId !== user._id)
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Commande invalide",
      });
    await ctx.db.patch(args.orderId, { status: "confirmed" });
    return { success: true, paymentId: `PAY_${Date.now()}` };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. COUPONS
// ─────────────────────────────────────────────────────────────────────────────
export const getAvailableCoupons = query({
  args: {},
  handler: async (ctx) => {
    return [
      {
        id: "c1",
        code: "BIENVENUE10",
        discount: 10,
        type: "percentage",
        description: "10% de réduction",
        expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
        minPurchase: 0,
      },
      {
        id: "c2",
        code: "FREESHIP",
        discount: 2000,
        type: "fixed",
        description: "Livraison offerte",
        expiresAt: new Date(Date.now() + 86400000 * 15).toISOString(),
        minPurchase: 20000,
      },
    ];
  },
});

export const applyCoupon = mutation({
  args: { code: v.string(), orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Commande introuvable",
      });
    const discount = order.totalAmount * 0.1;
    await ctx.db.patch(args.orderId, {
      totalAmount: order.totalAmount - discount,
    });
    return { discount };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. DELIVERY
// ─────────────────────────────────────────────────────────────────────────────
export const getDeliveryOptions = query({
  args: { productId: v.id("products"), location: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return [
      { id: "std", label: "Standard", cost: 2000, days: 3 },
      { id: "exp", label: "Express", cost: 5000, days: 1 },
      { id: "pickup", label: "Retrait en magasin", cost: 0, days: 0 },
    ];
  },
});

export const getPickupPoints = query({
  args: { location: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return [
      {
        id: "p1",
        name: "Centre ville",
        address: "123 Rue Principale",
        distance: 1.2,
      },
      {
        id: "p2",
        name: "Marché central",
        address: "45 Avenue de la Liberté",
        distance: 2.5,
      },
    ];
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 16. LIVE SHOPPING
// ─────────────────────────────────────────────────────────────────────────────
export const getLiveSessions = query({
  args: {},
  handler: async (ctx) => {
    return [
      {
        id: "live1",
        title: "Mode africaine en direct",
        streamUrl: "https://example.com/live1",
        viewers: 245,
        isLive: true,
      },
      {
        id: "live2",
        title: "Tech & Gadgets",
        streamUrl: "https://example.com/live2",
        viewers: 120,
        isLive: true,
      },
    ];
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 17. SELLER PRODUCTS (helper)
// ─────────────────────────────────────────────────────────────────────────────
export const getSellerProducts = query({
  args: { sellerId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_seller", (q) => q.eq("sellerId", args.sellerId))
      .take(args.limit || 50);
    return Promise.all(products.map((p) => resolveProductImages(ctx, p)));
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 18. ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────
export const getMarketplaceAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const orders = await ctx.db.query("orders").collect();
    const totalRevenue = orders
      .filter((o) => o.status === "delivered")
      .reduce((s, o) => s + o.totalAmount, 0);
    return {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue,
      conversionRate:
        products.length > 0 ? (orders.length / products.length) * 100 : 0,
      activeSellers: new Set(products.map((p) => p.sellerId)).size,
    };
  },
});

export const getProductStats = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();
    const reviews = await ctx.db
      .query("productReviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();
    const views = await ctx.db
      .query("recentlyViewed")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();
    return {
      totalOrders: orders.length,
      totalViews: views.length,
      averageRating:
        reviews.length > 0
          ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
          : undefined,
      totalRevenue: orders
        .filter((o) => o.status === "delivered")
        .reduce((s, o) => s + o.totalAmount, 0),
    };
  },
});

export const getProductVideos = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    return [
      {
        id: "v1",
        url: "https://example.com/video1.mp4",
        thumbnail:
          "https://via.placeholder.com/300x200/1a0a2e/8B5CF6?text=Video",
        title: "Présentation du produit",
      },
    ];
  },
});
