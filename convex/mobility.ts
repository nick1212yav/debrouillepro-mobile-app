import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";

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

// ─────────────────────────────────────────────────────────────────────────────
// TRANSPORT ROUTES
// ─────────────────────────────────────────────────────────────────────────────
export const listTransportRoutes = query({
  args: {
    status: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("transportRoutes")
      .withIndex("by_status", (q) =>
        q.eq(
          "status",
          (args.status ?? "scheduled") as
            | "scheduled"
            | "in_progress"
            | "completed"
            | "cancelled",
        ),
      )
      .paginate(args.paginationOpts);
  },
});

export const createTransportRoute = mutation({
  args: {
    origin: v.string(),
    destination: v.string(),
    departureTime: v.string(),
    arrivalTime: v.optional(v.string()),
    vehicleType: v.union(
      v.literal("taxi"),
      v.literal("bus"),
      v.literal("moto"),
      v.literal("minibus"),
      v.literal("voiture"),
      v.literal("camion"),
    ),
    seats: v.number(),
    pricePerSeat: v.number(),
    currency: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("transportRoutes", {
      ...args,
      driverId: user._id,
      seatsAvailable: args.seats,
      status: "scheduled",
    });
  },
});

export const bookTransportRoute = mutation({
  args: {
    routeId: v.id("transportRoutes"),
    seats: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const route = await ctx.db.get(args.routeId);
    if (!route)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Trajet introuvable",
      });
    if (route.seatsAvailable < args.seats)
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Places insuffisantes",
      });
    const totalAmount = route.pricePerSeat * args.seats;
    const bookingId = await ctx.db.insert("transportBookings", {
      routeId: args.routeId,
      userId: user._id,
      seats: args.seats,
      totalAmount,
      currency: route.currency,
      status: "confirmed",
      bookedAt: new Date().toISOString(),
    });
    await ctx.db.patch(args.routeId, {
      seatsAvailable: route.seatsAvailable - args.seats,
    });
    return bookingId;
  },
});

export const getMyTransportBookings = query({
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
    const bookings = await ctx.db
      .query("transportBookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);
    return Promise.all(
      bookings.map(async (b) => {
        const route = await ctx.db.get(b.routeId);
        return {
          ...b,
          origin: route?.origin,
          destination: route?.destination,
          departureTime: route?.departureTime,
        };
      }),
    );
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// DELIVERIES
// ─────────────────────────────────────────────────────────────────────────────
export const createDelivery = mutation({
  args: {
    description: v.string(),
    pickupAddress: v.string(),
    deliveryAddress: v.string(),
    weightKg: v.optional(v.number()),
    scheduledAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const trackingCode = `DLV-${Date.now().toString(36).toUpperCase()}`;
    return ctx.db.insert("deliveries", {
      ...args,
      senderId: user._id,
      status: "pending",
      trackingCode,
    });
  },
});

export const trackDelivery = query({
  args: { trackingCode: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("deliveries")
      .withIndex("by_trackingCode", (q) =>
        q.eq("trackingCode", args.trackingCode),
      )
      .unique();
  },
});

export const getMyDeliveries = query({
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
    return ctx.db
      .query("deliveries")
      .withIndex("by_sender", (q) => q.eq("senderId", user._id))
      .order("desc")
      .take(20);
  },
});

export const updateDeliveryStatus = mutation({
  args: {
    id: v.id("deliveries"),
    status: v.union(
      v.literal("assigned"),
      v.literal("picked_up"),
      v.literal("in_transit"),
      v.literal("delivered"),
      v.literal("failed"),
    ),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    await ctx.db.patch(args.id, { status: args.status });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// TRAVEL PLANS
// ─────────────────────────────────────────────────────────────────────────────
export const getMyTravelPlans = query({
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
    return ctx.db
      .query("travelPlans")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);
  },
});

export const createTravelPlan = mutation({
  args: {
    title: v.string(),
    destination: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    travelers: v.number(),
    totalBudget: v.optional(v.number()),
    currency: v.optional(v.string()),
    notes: v.optional(v.string()),
    coverImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("travelPlans", {
      ...args,
      userId: user._id,
      status: "draft",
    });
  },
});

export const addTravelEntry = mutation({
  args: {
    planId: v.id("travelPlans"),
    title: v.string(),
    content: v.string(),
    date: v.string(),
    images: v.array(v.string()),
    location: v.optional(v.string()),
    mood: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("travelEntries", { ...args, userId: user._id });
  },
});

export const getTravelEntries = query({
  args: { planId: v.id("travelPlans") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("travelEntries")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .order("desc")
      .collect();
  },
});

export const addTravelExpense = mutation({
  args: {
    planId: v.id("travelPlans"),
    category: v.string(),
    description: v.string(),
    amount: v.number(),
    currency: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("travelExpenses", { ...args, userId: user._id });
  },
});

export const getTravelExpenses = query({
  args: { planId: v.id("travelPlans") },
  handler: async (ctx, args) => {
    const expenses = await ctx.db
      .query("travelExpenses")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const byCategory: Record<string, number> = {};
    for (const e of expenses) {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
    }
    return { expenses, total, byCategory };
  },
});
