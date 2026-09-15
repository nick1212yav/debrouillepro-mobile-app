// convex/hebergement.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

const calculateNights = (checkIn: string, checkOut: string): number => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. ACCOMMODATIONS – CRUD
// ─────────────────────────────────────────────────────────────────────────────

export const listAccommodations = query({
  args: {
    type: v.optional(v.string()),
    city: v.optional(v.string()),
    maxPrice: v.optional(v.number()),
    minRating: v.optional(v.number()),
    available: v.optional(v.boolean()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let accommodations = await ctx.db.query("accommodations").collect();

    if (args.type && args.type !== "Tout") {
      accommodations = accommodations.filter((a) => a.type === args.type);
    }
    if (args.city) {
      accommodations = accommodations.filter(
        (a) => a.city.toLowerCase() === args.city!.toLowerCase(),
      );
    }
    if (args.maxPrice) {
      accommodations = accommodations.filter((a) => a.price <= args.maxPrice!);
    }
    if (args.minRating) {
      accommodations = accommodations.filter(
        (a) => (a.rating ?? 0) >= args.minRating!,
      );
    }
    if (args.available !== undefined) {
      accommodations = accommodations.filter(
        (a) => a.available === args.available,
      );
    }
    if (args.search) {
      const s = args.search.toLowerCase();
      accommodations = accommodations.filter(
        (a) =>
          a.title.toLowerCase().includes(s) ||
          a.description.toLowerCase().includes(s) ||
          a.city.toLowerCase().includes(s),
      );
    }

    accommodations.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

    if (args.limit) accommodations = accommodations.slice(0, args.limit);
    return accommodations;
  },
});

export const getAccommodation = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    let resolvedId: Id<"accommodations"> | null = null;

    const directId = ctx.db.normalizeId("accommodations", args.id);
    if (directId) {
      resolvedId = directId;
    } else {
      const pubId = ctx.db.normalizeId("publications", args.id);
      if (pubId) {
        const publication = await ctx.db.get(pubId);
        if (publication && publication.meta) {
          try {
            const meta = JSON.parse(publication.meta);
            const accId = meta.accommodationId || meta.id || publication.meta;
            const testId = ctx.db.normalizeId("accommodations", accId);
            if (testId) resolvedId = testId;
          } catch {
            const testId = ctx.db.normalizeId(
              "accommodations",
              publication.meta,
            );
            if (testId) resolvedId = testId;
          }
        }
      }
    }

    if (!resolvedId) return null;
    return ctx.db.get(resolvedId);
  },
});

export const createAccommodation = mutation({
  args: {
    type: v.union(
      v.literal("appartement"),
      v.literal("villa"),
      v.literal("hotel"),
      v.literal("auberge"),
      v.literal("chambre_hote"),
      v.literal("camping"),
    ),
    title: v.string(),
    description: v.string(),
    price: v.number(),
    currency: v.string(),
    maxGuests: v.number(),
    city: v.string(),
    country: v.optional(v.string()), // Accepté pour compatibilité front-end
    district: v.optional(v.string()), // Accepté pour compatibilité front-end
    address: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    images: v.optional(v.array(v.string())),
    amenities: v.optional(v.array(v.string())),
    available: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const now = Date.now();

    // 1. Enregistrement dans la table métier "accommodations"
    const accommodationId = await ctx.db.insert("accommodations", {
      type: args.type,
      title: args.title,
      description: args.description,
      price: args.price,
      currency: args.currency,
      maxGuests: args.maxGuests,
      city: args.city,
      address: args.address,
      latitude: args.latitude,
      longitude: args.longitude,
      images: args.images || [],
      amenities: args.amenities || [],
      available: args.available !== undefined ? args.available : true,
      rating: 5.0,
      reviewCount: 0,
      createdAt: now,
      hostId: user._id,
      status: "active",
    });

    // 2. Création de la publication associée dans le fil d'actualités ("publications") [1]
    await ctx.db.insert("publications", {
      type: "hebergement",
      title: args.title,
      description: args.description,
      authorId: user._id,
      tags: args.amenities || [],
      images: args.images || [],
      meta: JSON.stringify({
        accommodationId,
        type: args.type,
        title: args.title,
        description: args.description,
        price: args.price,
        currency: args.currency,
        maxGuests: args.maxGuests,
        city: args.city,
        address: args.address,
        available: true,
        rating: 5.0,
        reviewCount: 0,
      }),
      likeCount: 0,
      commentCount: 0,
      viewCount: 0,
      status: "active",
    });

    return accommodationId;
  },
});

export const updateAccommodation = mutation({
  args: {
    id: v.id("accommodations"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    available: v.optional(v.boolean()),
    images: v.optional(v.array(v.string())),
    amenities: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const { id, ...updates } = args;
    const acc = await ctx.db.get(id);
    if (!acc) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Hébergement introuvable",
      });
    }
    if (acc.hostId !== user._id && !user.roles?.includes("admin")) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    }
    await ctx.db.patch(id, updates);
  },
});

export const deleteAccommodation = mutation({
  args: { id: v.id("accommodations") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const acc = await ctx.db.get(args.id);
    if (!acc) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Hébergement introuvable",
      });
    }
    if (acc.hostId !== user._id && !user.roles?.includes("admin")) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    }
    await ctx.db.delete(args.id);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. BOOKINGS (Réservations)
// ─────────────────────────────────────────────────────────────────────────────

export const listBookings = query({
  args: {
    accommodationId: v.optional(v.id("accommodations")),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    let bookings = await ctx.db.query("accommodationBookings").collect();

    if (args.accommodationId) {
      bookings = bookings.filter(
        (b) => b.accommodationId === args.accommodationId,
      );
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

export const getBooking = query({
  args: { id: v.id("accommodationBookings") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const booking = await ctx.db.get(args.id);
    if (!booking) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Réservation introuvable",
      });
    }
    if (booking.userId !== user._id && !user.roles?.includes("admin")) {
      const acc = await ctx.db.get(booking.accommodationId);
      if (acc?.hostId !== user._id) {
        throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
      }
    }
    return booking;
  },
});

export const createBooking = mutation({
  args: {
    accommodationId: v.id("accommodations"),
    checkIn: v.string(),
    checkOut: v.string(),
    guests: v.union(
      v.number(),
      v.object({
        adults: v.number(),
        children: v.optional(v.number()),
      }),
    ),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const acc = await ctx.db.get(args.accommodationId);
    if (!acc) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Hébergement introuvable",
      });
    }
    if (!acc.available) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Ce logement n'est actuellement pas disponible",
      });
    }

    const bookings = await ctx.db.query("accommodationBookings").collect();
    const overlapping = bookings.filter(
      (b) =>
        b.accommodationId === args.accommodationId &&
        b.status !== "cancelled" &&
        ((b.checkIn <= args.checkOut && b.checkOut >= args.checkIn) ||
          (b.checkIn >= args.checkIn && b.checkIn <= args.checkOut)),
    );
    if (overlapping.length > 0) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Ce logement n'est pas disponible pour ces dates",
      });
    }

    const guestsCount =
      typeof args.guests === "number"
        ? args.guests
        : args.guests.adults + (args.guests.children || 0);

    const nights = calculateNights(args.checkIn, args.checkOut);
    const subtotal = acc.price * nights;
    const cleaningFee = 15000;
    const deposit = 50000;
    const serviceFee = Math.round(subtotal * 0.05);
    const total = subtotal + cleaningFee + serviceFee + deposit;

    const bookingId = await ctx.db.insert("accommodationBookings", {
      userId: user._id,
      accommodationId: args.accommodationId,
      checkIn: args.checkIn,
      checkOut: args.checkOut,
      guests: guestsCount,
      totalAmount: total,
      currency: acc.currency || "FCFA",
      status: "pending",
      message: args.message,
    });

    return { bookingId, total };
  },
});

export const cancelBooking = mutation({
  args: { id: v.id("accommodationBookings") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const booking = await ctx.db.get(args.id);
    if (!booking) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Réservation introuvable",
      });
    }
    if (booking.userId !== user._id && !user.roles?.includes("admin")) {
      const acc = await ctx.db.get(booking.accommodationId);
      if (acc?.hostId !== user._id) {
        throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
      }
    }
    if (booking.status === "completed" || booking.status === "cancelled") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message:
          "Impossible d'annuler une réservation déjà terminée ou annulée",
      });
    }
    await ctx.db.patch(args.id, { status: "cancelled" });
    return { success: true };
  },
});

export const confirmBooking = mutation({
  args: { id: v.id("accommodationBookings") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const booking = await ctx.db.get(args.id);
    if (!booking) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Réservation introuvable",
      });
    }
    const acc = await ctx.db.get(booking.accommodationId);
    if (acc?.hostId !== user._id && !user.roles?.includes("admin")) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    }
    if (booking.status !== "pending") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Réservation déjà traitée",
      });
    }
    await ctx.db.patch(args.id, { status: "confirmed" });
    return { success: true };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. REVIEWS
// ─────────────────────────────────────────────────────────────────────────────

export const listReviews = query({
  args: { accommodationId: v.id("accommodations") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db.query("accommodationReviews").collect();
    return reviews.filter((r) => r.accommodationId === args.accommodationId);
  },
});

export const addReview = mutation({
  args: {
    accommodationId: v.id("accommodations"),
    rating: v.number(),
    comment: v.optional(v.string()),
    bookingId: v.id("accommodationBookings"),
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
    const acc = await ctx.db.get(args.accommodationId);
    if (!acc) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Hébergement introuvable",
      });
    }

    const existing = await ctx.db
      .query("accommodationReviews")
      .filter((q) =>
        q.and(
          q.eq(q.field("accommodationId"), args.accommodationId),
          q.eq(q.field("reviewerId"), user._id),
        ),
      )
      .first();
    if (existing) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Vous avez déjà posté un avis pour ce logement",
      });
    }

    const reviewId = await ctx.db.insert("accommodationReviews", {
      accommodationId: args.accommodationId,
      reviewerId: user._id,
      rating: args.rating,
      comment: args.comment,
      bookingId: args.bookingId,
      categories: args.categories,
    });

    const allReviews = await ctx.db.query("accommodationReviews").collect();
    const accReviews = allReviews.filter(
      (r) => r.accommodationId === args.accommodationId,
    );
    const avg =
      accReviews.reduce((sum, r) => sum + r.rating, 0) / accReviews.length;
    await ctx.db.patch(args.accommodationId, {
      rating: Number(avg.toFixed(1)),
      reviewCount: accReviews.length,
    });

    return reviewId;
  },
});

export const deleteReview = mutation({
  args: { id: v.id("accommodationReviews") },
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
    const acc = await ctx.db.get(review.accommodationId);
    if (acc) {
      const allReviews = await ctx.db.query("accommodationReviews").collect();
      const accReviews = allReviews.filter(
        (r) => r.accommodationId === review.accommodationId,
      );
      if (accReviews.length > 0) {
        const avg =
          accReviews.reduce((sum, r) => sum + r.rating, 0) / accReviews.length;
        await ctx.db.patch(review.accommodationId, {
          rating: Number(avg.toFixed(1)),
          reviewCount: accReviews.length,
        });
      } else {
        await ctx.db.patch(review.accommodationId, {
          rating: 0,
          reviewCount: 0,
        });
      }
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. FAVORITES
// ─────────────────────────────────────────────────────────────────────────────

export const listFavorites = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const favorites = await ctx.db
      .query("accommodationFavorites")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return favorites.map((f) => f.accommodationId);
  },
});

export const toggleFavorite = mutation({
  args: { accommodationId: v.id("accommodations") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("accommodationFavorites")
      .withIndex("by_user_and_accommodation", (q) =>
        q.eq("userId", user._id).eq("accommodationId", args.accommodationId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { favorited: false };
    } else {
      await ctx.db.insert("accommodationFavorites", {
        userId: user._id,
        accommodationId: args.accommodationId,
        createdAt: Date.now(),
      });
      return { favorited: true };
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. AVAILABILITY
// ─────────────────────────────────────────────────────────────────────────────

export const checkAvailability = query({
  args: {
    accommodationId: v.id("accommodations"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const acc = await ctx.db.get(args.accommodationId);
    if (!acc) return { available: false };

    const bookings = await ctx.db.query("accommodationBookings").collect();
    const overlapping = bookings.filter(
      (b) =>
        b.accommodationId === args.accommodationId &&
        b.status !== "cancelled" &&
        ((b.checkIn <= args.endDate && b.checkOut >= args.startDate) ||
          (b.checkIn >= args.startDate && b.checkIn <= args.endDate)),
    );

    return {
      available: overlapping.length === 0 && acc.available,
      overlappingCount: overlapping.length,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. STATISTIQUES (pour dashboard)
// ─────────────────────────────────────────────────────────────────────────────

export const getAccommodationStats = query({
  args: { accommodationId: v.id("accommodations") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const acc = await ctx.db.get(args.accommodationId);
    if (!acc) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Hébergement introuvable",
      });
    }
    if (acc.hostId !== user._id && !user.roles?.includes("admin")) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    }

    const bookings = await ctx.db.query("accommodationBookings").collect();
    const accBookings = bookings.filter(
      (b) => b.accommodationId === args.accommodationId,
    );

    const totalBookings = accBookings.length;
    const confirmed = accBookings.filter(
      (b) => b.status === "confirmed" || b.status === "completed",
    );
    const revenue = confirmed.reduce((sum, b) => sum + b.totalAmount, 0);
    const nightsBooked = confirmed.reduce(
      (sum, b) => sum + calculateNights(b.checkIn, b.checkOut),
      0,
    );

    return {
      totalBookings,
      confirmedBookings: confirmed.length,
      revenue,
      nightsBooked,
      averageRating: acc.rating ?? 0,
      reviewCount: acc.reviewCount,
    };
  },
});
