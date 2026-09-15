import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
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

// ─── Reputation Events ────────────────────────────────────────────────────────

export const getMyReputationEvents = query({
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
      .query("reputationEvents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
  },
});

export const addReputationEvent = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("publication_liked"),
      v.literal("comment_liked"),
      v.literal("followed"),
      v.literal("review_received"),
      v.literal("sale_completed"),
      v.literal("badge_earned"),
      v.literal("verified"),
    ),
    points: v.number(),
    sourceId: v.optional(v.string()),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("reputationEvents", args);
    // Update denormalized score on user
    const user = await ctx.db.get(args.userId);
    if (user) {
      const newScore = (user.reputationScore ?? 0) + args.points;
      await ctx.db.patch(args.userId, { reputationScore: newScore });
      // Upsert level record
      const level = await ctx.db
        .query("reputationLevels")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .unique();
      const levelName = computeLevel(newScore);
      if (level) {
        await ctx.db.patch(level._id, {
          totalPoints: newScore,
          level: levelName,
          lastUpdatedAt: new Date().toISOString(),
        });
      } else {
        await ctx.db.insert("reputationLevels", {
          userId: args.userId,
          totalPoints: newScore,
          level: levelName,
          lastUpdatedAt: new Date().toISOString(),
        });
      }
    }
  },
});

function computeLevel(points: number): string {
  if (points < 500) return "Débutant";
  if (points < 1500) return "Actif";
  if (points < 3000) return "Contributeur";
  if (points < 6000) return "Expert";
  if (points < 12000) return "Maître";
  return "Légende";
}

export const getReputationProfile = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let targetId = args.userId;
    if (!targetId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return null;
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();
      if (!user) return null;
      targetId = user._id;
    }
    const [user, events, levelRecord, badges] = await Promise.all([
      ctx.db.get(targetId),
      ctx.db
        .query("reputationEvents")
        .withIndex("by_user", (q) => q.eq("userId", targetId!))
        .order("desc")
        .take(20),
      ctx.db
        .query("reputationLevels")
        .withIndex("by_user", (q) => q.eq("userId", targetId!))
        .unique(),
      ctx.db
        .query("userBadges")
        .withIndex("by_user", (q) => q.eq("userId", targetId!))
        .collect(),
    ]);
    return {
      userId: targetId,
      name: user?.name,
      avatar: user?.avatar,
      reputationScore: user?.reputationScore ?? 0,
      level: levelRecord?.level ?? computeLevel(user?.reputationScore ?? 0),
      badgeCount: badges.length,
      recentEvents: events,
    };
  },
});

export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const top = await ctx.db
      .query("reputationLevels")
      .withIndex("by_totalPoints")
      .order("desc")
      .take(20);
    return Promise.all(
      top.map(async (r) => {
        const user = await ctx.db.get(r.userId);
        const badges = await ctx.db
          .query("userBadges")
          .withIndex("by_user", (q) => q.eq("userId", r.userId))
          .collect();
        return {
          ...r,
          name: user?.name,
          avatar: user?.avatar,
          badgeCount: badges.length,
        };
      }),
    );
  },
});

// ─── Accommodation (hébergement enrichi) ──────────────────────────────────────

export const listAccommodations = query({
  args: {
    city: v.optional(v.string()),
    type: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    if (args.city) {
      return ctx.db
        .query("accommodations")
        .withIndex("by_city", (q) => q.eq("city", args.city!))
        .paginate(args.paginationOpts);
    }
    // Utilisation de la table ordonnée par création avec filtrage manuel sur le statut
    return ctx.db
      .query("accommodations")
      .filter((q) => q.eq(q.field("status"), "active"))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const getAccommodation = query({
  args: { accommodationId: v.id("accommodations") },
  handler: async (ctx, args) => {
    const acc = await ctx.db.get(args.accommodationId);
    if (!acc) return null;
    const host = await ctx.db.get(acc.hostId);
    const reviews = await ctx.db
      .query("accommodationReviews")
      .withIndex("by_accommodation", (q) =>
        q.eq("accommodationId", args.accommodationId),
      )
      .take(10);
    return { ...acc, hostName: host?.name, hostAvatar: host?.avatar, reviews };
  },
});

export const createAccommodation = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("hotel"),
      v.literal("villa"),
      v.literal("auberge"),
      v.literal("appartement"),
      v.literal("chambre_hote"),
      v.literal("camping"),
    ),
    pricePerNight: v.number(),
    currency: v.string(),
    images: v.array(v.string()),
    city: v.string(),
    address: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    amenities: v.array(v.string()),
    maxGuests: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const { pricePerNight, ...rest } = args;
    return ctx.db.insert("accommodations", {
      hostId: user._id,
      rating: undefined,
      reviewCount: 0,
      status: "active",
      price: pricePerNight, // Mappage vers le champ price de la table
      createdAt: Date.now(), // Attribut obligatoire requis par le schéma
      available: true, // Attribut obligatoire requis par le schéma
      ...rest,
    });
  },
});

export const bookAccommodation = mutation({
  args: {
    accommodationId: v.id("accommodations"),
    checkIn: v.string(),
    checkOut: v.string(),
    guests: v.number(),
    totalAmount: v.number(),
    currency: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("accommodationBookings", {
      userId: user._id,
      status: "pending",
      ...args,
    });
  },
});

export const getMyBookings = query({
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
      .query("accommodationBookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);
    return Promise.all(
      bookings.map(async (b) => {
        const acc = await ctx.db.get(b.accommodationId);
        return {
          ...b,
          accommodationTitle: acc?.title,
          accommodationCity: acc?.city,
          accommodationImages: acc?.images,
        };
      }),
    );
  },
});

export const addAccommodationReview = mutation({
  args: {
    accommodationId: v.id("accommodations"),
    bookingId: v.id("accommodationBookings"),
    rating: v.number(),
    comment: v.optional(v.string()),
    categories: v.optional(
      v.object({
        proprete: v.number(),
        emplacement: v.number(),
        rapport_qualite_prix: v.number(),
        communication: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    // Verify the booking belongs to user
    const booking = await ctx.db.get(args.bookingId);
    if (!booking || booking.userId !== user._id)
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Réservation introuvable",
      });
    const reviewId = await ctx.db.insert("accommodationReviews", {
      reviewerId: user._id,
      ...args,
    });
    // Update average rating on accommodation
    const reviews = await ctx.db
      .query("accommodationReviews")
      .withIndex("by_accommodation", (q) =>
        q.eq("accommodationId", args.accommodationId),
      )
      .collect();
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await ctx.db.patch(args.accommodationId, {
      rating: Math.round(avg * 10) / 10,
      reviewCount: reviews.length,
    });
    return reviewId;
  },
});

// ─── SOS Emergency Contacts ────────────────────────────────────────────────────

export const getMyEmergencyContacts = query({
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
      .query("emergencyContacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const upsertEmergencyContact = mutation({
  args: {
    contactId: v.optional(v.id("emergencyContacts")),
    name: v.string(),
    phone: v.string(),
    relation: v.string(),
    isPrimary: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const { contactId, ...data } = args;
    if (contactId) {
      const c = await ctx.db.get(contactId);
      if (!c || c.userId !== user._id)
        throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
      await ctx.db.patch(contactId, data);
      return contactId;
    }
    return ctx.db.insert("emergencyContacts", { userId: user._id, ...data });
  },
});

export const deleteEmergencyContact = mutation({
  args: { contactId: v.id("emergencyContacts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const c = await ctx.db.get(args.contactId);
    if (!c || c.userId !== user._id)
      throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
    await ctx.db.delete(args.contactId);
  },
});
