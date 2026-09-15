import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";

// ─── Helpers d'autorisation et d'identification ──────────────────────────────
async function requireUser(ctx: QueryCtx | MutationCtx) {
  const db = ctx.db as any;
  const identity = await ctx.auth.getUserIdentity();
  if (!identity)
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Connexion requise",
    });
  const user = await db
    .query("users")
    .withIndex("by_token", (q: any) =>
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

async function requireRestaurantOwner(ctx: MutationCtx, restaurantId: string) {
  const user = await requireUser(ctx);
  const db = ctx.db as any;
  const restaurant = await db.get(restaurantId);
  if (!restaurant)
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Restaurant introuvable",
    });

  if (restaurant.ownerId !== user._id && !user.roles?.includes("admin")) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Accès non autorisé à l'établissement",
    });
  }
  return user;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. RESTAURANTS & MAQUIS
// ─────────────────────────────────────────────────────────────────────────────

export const listRestaurants = query({
  args: {
    cuisine: v.optional(v.string()),
    openOnly: v.optional(v.boolean()),
    priceRange: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    let list = await db.query("restaurants").collect();

    if (args.cuisine) {
      list = list.filter((r: any) => r.cuisine === args.cuisine);
    }
    if (args.openOnly !== undefined) {
      list = list.filter((r: any) => r.open === args.openOnly);
    }
    if (args.priceRange) {
      list = list.filter((r: any) => r.priceRange === args.priceRange);
    }
    if (args.search) {
      const s = args.search.toLowerCase();
      list = list.filter(
        (r: any) =>
          r.name.toLowerCase().includes(s) ||
          r.location.toLowerCase().includes(s) ||
          r.speciality.toLowerCase().includes(s),
      );
    }

    list.sort((a: any, b: any) => b.rating - a.rating);
    if (args.limit) list = list.slice(0, args.limit);
    return list;
  },
});

export const getRestaurant = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const restaurant = await db.get(args.id);
    if (!restaurant)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Restaurant introuvable",
      });
    return restaurant;
  },
});

export const createRestaurant = mutation({
  args: {
    name: v.string(),
    cuisine: v.string(),
    location: v.string(),
    priceRange: v.string(),
    deliveryTime: v.string(),
    deliveryFee: v.number(),
    image: v.string(),
    gallery: v.array(v.string()),
    tags: v.array(v.string()),
    open: v.boolean(),
    openingHours: v.string(),
    minOrder: v.number(),
    speciality: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);

    return db.insert("restaurants", {
      ...args,
      ownerId: user._id,
      rating: 5.0,
      reviewsCount: 0,
      menu: [], // Initialise une carte de menu vide
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

export const updateRestaurant = mutation({
  args: {
    id: v.string(),
    name: v.optional(v.string()),
    cuisine: v.optional(v.string()),
    location: v.optional(v.string()),
    priceRange: v.optional(v.string()),
    deliveryTime: v.optional(v.string()),
    deliveryFee: v.optional(v.number()),
    image: v.optional(v.string()),
    gallery: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    open: v.optional(v.boolean()),
    openingHours: v.optional(v.string()),
    minOrder: v.optional(v.number()),
    speciality: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    await requireRestaurantOwner(ctx, args.id);

    const { id, ...updates } = args;
    await db.patch(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const deleteRestaurant = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    await requireRestaurantOwner(ctx, args.id);
    await db.delete(args.id);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. MENUS & PLATS
// ─────────────────────────────────────────────────────────────────────────────

export const addMenuCategory = mutation({
  args: {
    restaurantId: v.string(),
    categoryName: v.string(),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    await requireRestaurantOwner(ctx, args.restaurantId);

    const restaurant = await db.get(args.restaurantId);
    const menu = restaurant.menu || [];

    const categoryExists = menu.some(
      (m: any) => m.category.toLowerCase() === args.categoryName.toLowerCase(),
    );
    if (categoryExists) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Cette catégorie existe déjà",
      });
    }

    menu.push({
      category: args.categoryName,
      items: [],
    });

    await db.patch(args.restaurantId, {
      menu,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const addMenuItem = mutation({
  args: {
    restaurantId: v.string(),
    categoryName: v.string(),
    name: v.string(),
    price: v.number(),
    description: v.string(),
    tag: v.optional(v.string()),
    calories: v.number(),
    prepTime: v.string(),
    allergens: v.array(v.string()),
    dietaryRestrictions: v.array(v.string()),
    isVeggie: v.optional(v.boolean()),
    costToProduce: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    await requireRestaurantOwner(ctx, args.restaurantId);

    const restaurant = await db.get(args.restaurantId);
    const menu = restaurant.menu || [];

    const categoryIndex = menu.findIndex(
      (m: any) => m.category.toLowerCase() === args.categoryName.toLowerCase(),
    );
    if (categoryIndex === -1) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Catégorie de menu introuvable",
      });
    }

    const { restaurantId, categoryName, ...itemData } = args;

    const newItem = {
      ...itemData,
      isVeggie: args.isVeggie ?? false,
      costToProduce: args.costToProduce ?? Math.round(args.price * 0.4),
      category: args.categoryName,
    };

    menu[categoryIndex].items.push(newItem);

    await db.patch(args.restaurantId, {
      menu,
      updatedAt: new Date().toISOString(),
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. COMMANDES (ORDERS)
// ─────────────────────────────────────────────────────────────────────────────

export const listOrders = query({
  args: {
    restaurantId: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    let orders = await db.query("restaurantOrders").collect();

    if (args.restaurantId) {
      orders = orders.filter((o: any) => o.restaurantId === args.restaurantId);
    } else {
      orders = orders.filter((o: any) => o.userId === user._id);
    }

    if (args.status) {
      orders = orders.filter((o: any) => o.status === args.status);
    }

    orders.sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    if (args.limit) orders = orders.slice(0, args.limit);
    return orders;
  },
});

export const createOrder = mutation({
  args: {
    restaurantId: v.string(),
    items: v.array(
      v.object({
        name: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
      }),
    ),
    deliveryAddress: v.string(),
    paymentMethod: v.string(),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    const restaurant = await db.get(args.restaurantId);

    if (!restaurant) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Restaurant introuvable",
      });
    }

    const subtotal = args.items.reduce(
      (sum, i) => sum + i.unitPrice * i.quantity,
      0,
    );
    const tax = Math.round(subtotal * 0.05);
    const deliveryFee = restaurant.deliveryFee;
    const total = subtotal + tax + deliveryFee;

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;

    return db.insert("restaurantOrders", {
      id: orderId,
      restaurantId: args.restaurantId,
      restaurantName: restaurant.name,
      userId: user._id,
      items: args.items,
      subtotal,
      deliveryFee,
      tax,
      total,
      deliveryAddress: args.deliveryAddress,
      paymentMethod: args.paymentMethod,
      status: "received",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

export const updateOrderStatus = mutation({
  args: {
    orderId: v.string(),
    status: v.union(
      v.literal("received"),
      v.literal("preparing"),
      v.literal("ready_for_pickup"),
      v.literal("in_delivery"),
      v.literal("delivered"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const order = await db.get(args.orderId);
    if (!order) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Commande introuvable",
      });
    }

    await requireRestaurantOwner(ctx, order.restaurantId);

    await db.patch(args.orderId, {
      status: args.status,
      updatedAt: new Date().toISOString(),
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. RÉSERVATIONS DE TABLES
// ─────────────────────────────────────────────────────────────────────────────

export const listReservations = query({
  args: {
    restaurantId: v.optional(v.string()),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    let bookings = await db.query("restaurantReservations").collect();

    if (args.restaurantId) {
      bookings = bookings.filter(
        (b: any) => b.restaurantId === args.restaurantId,
      );
    } else {
      bookings = bookings.filter((b: any) => b.userId === user._id);
    }

    if (args.date) {
      bookings = bookings.filter((b: any) => b.bookingDate === args.date);
    }

    return bookings;
  },
});

export const bookTable = mutation({
  args: {
    restaurantId: v.string(),
    bookingDate: v.string(),
    bookingTime: v.string(),
    guestsCount: v.number(),
    section: v.string(),
    specialRequest: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    const restaurant = await db.get(args.restaurantId);

    if (!restaurant) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Restaurant introuvable",
      });
    }

    const bookingId = `RES-${Date.now().toString().slice(-5)}`;
    const tableNumber = Math.floor(1 + Math.random() * 30);

    return db.insert("restaurantReservations", {
      id: bookingId,
      restaurantId: args.restaurantId,
      userId: user._id,
      tableNumber,
      bookingDate: args.bookingDate,
      bookingTime: args.bookingTime,
      guestsCount: args.guestsCount,
      section: args.section,
      specialRequest: args.specialRequest,
      isCancelled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

export const cancelReservation = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    const booking = await db.get(args.id);

    if (!booking) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Réservation introuvable",
      });
    }

    if (booking.userId !== user._id && !user.roles?.includes("admin")) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Action non autorisée",
      });
    }

    await db.patch(args.id, {
      isCancelled: true,
      updatedAt: new Date().toISOString(),
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. CHEF À DOMICILE & COMPTE SÉQUESTRE (ESCROW)
// ─────────────────────────────────────────────────────────────────────────────

export const bookChef = mutation({
  args: {
    chefName: v.string(),
    eventDate: v.string(),
    guestsCount: v.number(),
    menuSelected: v.string(),
    totalCost: v.number(),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);

    const bookingId = `CHEF-BK-${Date.now().toString().slice(-4)}`;
    const escrowId = `ESC-${Date.now().toString().slice(-4)}`;

    // Insertion du compte séquestre bloqué
    await db.insert("escrowAccounts", {
      escrowId,
      orderId: bookingId,
      amount: args.totalCost,
      status: "held",
      createdAt: new Date().toISOString(),
    });

    return db.insert("chefBookings", {
      id: bookingId,
      chefName: args.chefName,
      userId: user._id,
      eventDate: args.eventDate,
      guestsCount: args.guestsCount,
      menuSelected: args.menuSelected,
      totalCost: args.totalCost,
      escrowId,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

export const releaseEscrowFunds = mutation({
  args: { escrowId: v.string() },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);

    // Seul un admin ou un régulateur de plateforme certifié libère les fonds
    if (!user.roles?.includes("admin")) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Action réservée aux régulateurs",
      });
    }

    const escrow = await db
      .query("escrowAccounts")
      .withIndex("by_escrow", (q: any) => q.eq("escrowId", args.escrowId))
      .unique();

    if (!escrow || escrow.status !== "held") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Fonds indisponibles",
      });
    }

    await db.patch(escrow._id, { status: "released" });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. SUIVI GÉOLOCALISÉ DES LIVRAISONS (DELIVERIES)
// ─────────────────────────────────────────────────────────────────────────────

export const assignCourierToOrder = mutation({
  args: {
    orderId: v.string(),
    courierId: v.string(),
    courierName: v.string(),
    courierPhone: v.string(),
    vehiclePlate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const order = await db.get(args.orderId);
    if (!order) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Commande introuvable",
      });
    }

    await requireRestaurantOwner(ctx, order.restaurantId);

    const deliveryId = `DEL-${Date.now().toString().slice(-4)}`;

    await db.insert("deliveries", {
      deliveryId,
      orderId: args.orderId,
      courierId: args.courierId,
      courierName: args.courierName,
      courierPhone: args.courierPhone,
      vehiclePlate: args.vehiclePlate || "N/A",
      currentLat: 5.3484, // Position initiale par défaut (Abidjan)
      currentLng: -3.9785,
      etaMinutes: 20,
      distanceRemainingKm: 3.2,
      speedKmh: 0,
      createdAt: new Date().toISOString(),
    });

    await db.patch(args.orderId, {
      status: "in_delivery",
      updatedAt: new Date().toISOString(),
    });
  },
});

export const updateDeliveryLocation = mutation({
  args: {
    deliveryId: v.string(),
    lat: v.number(),
    lng: v.number(),
    speedKmh: v.number(),
    distanceRemainingKm: v.number(),
    etaMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const delivery = await db
      .query("deliveries")
      .withIndex("by_delivery", (q: any) => q.eq("deliveryId", args.deliveryId))
      .unique();

    if (!delivery) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Livraison introuvable",
      });
    }

    await db.patch(delivery._id, {
      currentLat: args.lat,
      currentLng: args.lng,
      speedKmh: args.speedKmh,
      distanceRemainingKm: args.distanceRemainingKm,
      etaMinutes: args.etaMinutes,
    });
  },
});

export const getDeliveryTracker = query({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    return db
      .query("deliveries")
      .withIndex("by_order", (q: any) => q.eq("orderId", args.orderId))
      .unique();
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. AVIS ET NOTATIONS (REVIEWS)
// ─────────────────────────────────────────────────────────────────────────────

export const addRestaurantReview = mutation({
  args: {
    restaurantId: v.string(),
    rating: v.number(),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);

    const reviewId = await db.insert("restaurantReviews", {
      restaurantId: args.restaurantId,
      userId: user._id,
      userName: user.name || "Anonyme",
      userAvatar: user.avatar || "",
      rating: args.rating,
      comment: args.comment,
      createdAt: new Date().toISOString(),
    });

    // Recalcul de la moyenne d'évaluation de l'établissement
    const reviews = await db
      .query("restaurantReviews")
      .withIndex("by_restaurant", (q: any) =>
        q.eq("restaurantId", args.restaurantId),
      )
      .collect();

    const sum = reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
    const avg = Number((sum / reviews.length).toFixed(1));

    await db.patch(args.restaurantId, {
      rating: avg,
      reviewsCount: reviews.length,
    });

    return reviewId;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. PROMOTIONS & BONS D'ACHATS
// ─────────────────────────────────────────────────────────────────────────────

export const createPromotion = mutation({
  args: {
    restaurantId: v.string(),
    code: v.string(),
    discountType: v.union(v.literal("percent"), v.literal("fixed")),
    discountValue: v.number(),
    minPurchaseRequired: v.number(),
    expiryDate: v.string(),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    await requireRestaurantOwner(ctx, args.restaurantId);

    return db.insert("restaurantPromotions", {
      ...args,
      active: true,
      createdAt: new Date().toISOString(),
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. STATISTIQUES ET TABLEAU DE BORD (ANALYTICS)
// ─────────────────────────────────────────────────────────────────────────────

export const getRestaurantStats = query({
  args: { restaurantId: v.string() },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);

    const restaurant = await db.get(args.restaurantId);
    if (!restaurant) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Restaurant introuvable",
      });
    }

    if (restaurant.ownerId !== user._id && !user.roles?.includes("admin")) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
    }

    const [orders, bookings, reviews] = await Promise.all([
      db.query("restaurantOrders").collect(),
      db.query("restaurantReservations").collect(),
      db.query("restaurantReviews").collect(),
    ]);

    const rOrders = orders.filter(
      (o: any) => o.restaurantId === args.restaurantId,
    );
    const rBookings = bookings.filter(
      (b: any) => b.restaurantId === args.restaurantId,
    );
    const rReviews = reviews.filter(
      (r: any) => r.restaurantId === args.restaurantId,
    );

    const completed = rOrders.filter((o: any) => o.status === "delivered");
    const revenue = completed.reduce((sum: number, o: any) => sum + o.total, 0);

    return {
      revenue,
      activeOrdersCount: rOrders.filter(
        (o: any) => o.status !== "delivered" && o.status !== "cancelled",
      ).length,
      pendingBookingsCount: rBookings.filter((b: any) => !b.isCancelled).length,
      rating: restaurant.rating || 5.0,
      totalReviews: rReviews.length,
    };
  },
});
