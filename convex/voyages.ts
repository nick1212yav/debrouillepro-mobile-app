// convex/voyages.ts
import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const user = await getUser(ctx);
  if (!user)
    throw new ConvexError({
      message: "Non authentifié",
      code: "UNAUTHENTICATED",
    });
  return user;
}

function occupancyRate(trip: any): number {
  if (!trip.totalSeats || trip.totalSeats === 0) return 0;
  return Math.round(
    ((trip.totalSeats - trip.availableSeats) / trip.totalSeats) * 100,
  );
}

/**
 * Résout une URL d'image à partir d'un ID de stockage Convex.
 * Si l'ID est déjà une URL HTTP/HTTPS ou data:, elle est retournée telle quelle.
 * Sinon, on appelle ctx.storage.getUrl pour obtenir l'URL publique.
 */
async function resolveImageUrl(
  ctx: QueryCtx,
  storageId: string | undefined | null,
): Promise<string | undefined> {
  if (!storageId) return undefined;
  if (
    storageId.startsWith("http://") ||
    storageId.startsWith("https://") ||
    storageId.startsWith("data:")
  ) {
    return storageId;
  }
  if (storageId.startsWith("blob:")) return undefined;
  try {
    const url = await ctx.storage.getUrl(storageId as Id<"_storage">);
    return url || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Applique la résolution d'image à un tableau de voyages.
 */
async function resolveTripsImages(ctx: QueryCtx, trips: any[]): Promise<any[]> {
  return await Promise.all(
    trips.map(async (trip) => ({
      ...trip,
      imageUrl: await resolveImageUrl(ctx, trip.imageUrl),
    })),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. TRAJETS / TRIPS – CRUD & RECHERCHE
// ─────────────────────────────────────────────────────────────────────────────

export const searchTrips = query({
  args: {
    from: v.string(),
    to: v.string(),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let trips = await ctx.db
      .query("trips")
      .withIndex("by_route", (q) => q.eq("from", args.from).eq("to", args.to))
      .collect();

    if (args.type && args.type !== "Tout") {
      trips = trips.filter((t) => t.type === args.type);
    }

    // ✅ Résoudre les images
    return await resolveTripsImages(ctx, trips);
  },
});

export const getTrip = query({
  args: { id: v.id("trips") },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.id);
    if (!trip) return null;
    // ✅ Résoudre l'image
    return {
      ...trip,
      imageUrl: await resolveImageUrl(ctx, trip.imageUrl),
    };
  },
});

export const getRecommendedTrips = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 6;
    const trips = await ctx.db.query("trips").collect();
    const sorted = trips.sort((a, b) => b.rating - a.rating).slice(0, limit);
    // ✅ Résoudre les images
    return await resolveTripsImages(ctx, sorted);
  },
});

export const getSimilarTrips = query({
  args: { tripId: v.id("trips"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) return [];
    const limit = args.limit ?? 4;
    let trips = await ctx.db
      .query("trips")
      .withIndex("by_route", (q) => q.eq("from", trip.from).eq("to", trip.to))
      .collect();
    trips = trips.filter((t) => t._id !== trip._id).slice(0, limit);
    // ✅ Résoudre les images
    return await resolveTripsImages(ctx, trips);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. RÉSERVATIONS / BOOKINGS
// ─────────────────────────────────────────────────────────────────────────────

export const bookTrip = mutation({
  args: {
    tripId: v.id("trips"),
    seats: v.number(),
    seatNumbers: v.array(v.string()),
    passengerName: v.string(),
    passengerPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const trip = await ctx.db.get(args.tripId);
    if (!trip)
      throw new ConvexError({
        message: "Trajet non trouvé",
        code: "NOT_FOUND",
      });
    if (trip.availableSeats < args.seats)
      throw new ConvexError({
        message: "Pas assez de places disponibles",
        code: "BAD_REQUEST",
      });

    await ctx.db.patch(args.tripId, {
      availableSeats: trip.availableSeats - args.seats,
    });

    const bookingId = await ctx.db.insert("tripBookings", {
      tripId: args.tripId,
      userId: user._id,
      seats: args.seats,
      totalPrice: trip.price * args.seats,
      status: "confirmed",
      seatNumbers: args.seatNumbers,
      passengerName: args.passengerName,
      passengerPhone: args.passengerPhone,
      bookedAt: new Date().toISOString(),
    });

    return bookingId;
  },
});

export const getMyBookings = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return [];
    const bookings = await ctx.db
      .query("tripBookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);

    return Promise.all(
      bookings.map(async (b) => {
        const trip = await ctx.db.get(b.tripId);
        // ✅ Résoudre l'image du voyage associé
        return {
          ...b,
          trip: trip
            ? {
                ...trip,
                imageUrl: await resolveImageUrl(ctx, trip.imageUrl),
              }
            : null,
        };
      }),
    );
  },
});

export const cancelBooking = mutation({
  args: { bookingId: v.id("tripBookings") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const booking = await ctx.db.get(args.bookingId);
    if (!booking)
      throw new ConvexError({
        message: "Réservation introuvable",
        code: "NOT_FOUND",
      });
    if (booking.userId !== user._id)
      throw new ConvexError({
        message: "Non autorisé",
        code: "FORBIDDEN",
      });

    const trip = await ctx.db.get(booking.tripId);
    if (trip) {
      await ctx.db.patch(trip._id, {
        availableSeats: trip.availableSeats + booking.seats,
      });
    }

    await ctx.db.patch(args.bookingId, {
      status: "cancelled",
    });

    return true;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. FAVORIS DE TRAJETS (useVoyageFavorites)
// ─────────────────────────────────────────────────────────────────────────────

export const toggleSaveTrip = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("tripSaves")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("tripId"), args.tripId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    } else {
      await ctx.db.insert("tripSaves", {
        userId: user._id,
        tripId: args.tripId,
        savedAt: new Date().toISOString(),
      });
      return true;
    }
  },
});

export const getSavedTripIds = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return [];
    const saves = await ctx.db
      .query("tripSaves")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return saves.map((s) => s.tripId);
  },
});

export const getMySavedTrips = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return [];
    const saves = await ctx.db
      .query("tripSaves")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const trips = await Promise.all(
      saves.map(async (s) => {
        const trip = await ctx.db.get(s.tripId);
        return trip
          ? {
              ...trip,
              imageUrl: await resolveImageUrl(ctx, trip.imageUrl),
            }
          : null;
      }),
    );
    return trips.filter((t) => t !== null);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. DESTINATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const listDestinations = query({
  args: { continent: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.continent && args.continent !== "Tout") {
      return ctx.db
        .query("destinations")
        .withIndex("by_continent", (q) => q.eq("continent", args.continent!))
        .collect();
    }
    return ctx.db.query("destinations").collect();
  },
});

export const getDestination = query({
  args: { id: v.id("destinations") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const toggleSaveDestination = mutation({
  args: { destinationId: v.id("destinations") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("destinationSaves")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("destinationId"), args.destinationId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }
    await ctx.db.insert("destinationSaves", {
      userId: user._id,
      destinationId: args.destinationId,
    });
    return true;
  },
});

export const getMySavedDestinations = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return [];
    const saves = await ctx.db
      .query("destinationSaves")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return Promise.all(saves.map(async (s) => ctx.db.get(s.destinationId)));
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. AVIS VOYAGEURS (Reviews)
// ─────────────────────────────────────────────────────────────────────────────

export const getTripReviews = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tripReviews")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .order("desc")
      .collect();
  },
});

export const addTripReview = mutation({
  args: {
    tripId: v.id("trips"),
    rating: v.number(),
    comment: v.string(),
    bookingId: v.id("tripBookings"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const booking = await ctx.db.get(args.bookingId);
    if (!booking || booking.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Réservation invalide ou non autorisée",
      });
    }
    if (booking.tripId !== args.tripId) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "La réservation ne correspond pas à ce voyage",
      });
    }

    const existing = await ctx.db
      .query("tripReviews")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .filter((q) => q.eq(q.field("reviewerId"), user._id))
      .first();

    if (existing) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Vous avez déjà évalué ce voyage",
      });
    }

    await ctx.db.insert("tripReviews", {
      tripId: args.tripId,
      reviewerId: user._id,
      authorName: user.name || "Voyageur",
      rating: args.rating,
      comment: args.comment,
      bookingId: args.bookingId,
      createdAt: new Date().toISOString(),
    });

    const allReviews = await ctx.db
      .query("tripReviews")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    const avg =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await ctx.db.patch(args.tripId, {
      rating: Number(avg.toFixed(1)),
      reviewCount: allReviews.length,
    });

    return true;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. CRÉER UN TRAJET (formulaire)
// ─────────────────────────────────────────────────────────────────────────────

export const createTrip = mutation({
  args: {
    operator: v.string(),
    type: v.union(v.literal("Bus"), v.literal("Minibus"), v.literal("Avion")),
    from: v.string(),
    to: v.string(),
    departure: v.string(),
    arrival: v.string(),
    durationMinutes: v.number(),
    price: v.number(),
    currency: v.string(),
    availableSeats: v.number(),
    totalSeats: v.number(),
    amenities: v.array(v.string()),
    imageUrl: v.optional(v.string()),
    color: v.optional(v.string()),
    departureDate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) {
      throw new ConvexError({
        message: "Vous devez être connecté pour créer un voyage",
        code: "UNAUTHENTICATED",
      });
    }
    if (args.availableSeats > args.totalSeats) {
      throw new ConvexError({
        message: "Les places disponibles ne peuvent pas dépasser le total",
        code: "BAD_REQUEST",
      });
    }

    const tripId = await ctx.db.insert("trips", {
      operator: args.operator,
      type: args.type,
      from: args.from,
      to: args.to,
      departure: args.departure,
      arrival: args.arrival,
      durationMinutes: args.durationMinutes,
      price: args.price,
      currency: args.currency,
      availableSeats: args.availableSeats,
      totalSeats: args.totalSeats,
      amenities: args.amenities,
      imageUrl: args.imageUrl,
      color: args.color || "#6366F1",
      departureDate: args.departureDate,
      rating: 0,
      reviewCount: 0,
    });

    return tripId;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. DÉMO / SEED
// ─────────────────────────────────────────────────────────────────────────────

export const seedTrips = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("trips").take(1);
    if (existing.length > 0) return;

    const today = new Date().toISOString().split("T")[0];

    const sampleTrips = [
      {
        operator: "Trans-Sahel Express",
        type: "Bus" as const,
        from: "Dakar",
        to: "Abidjan",
        departure: "06:30",
        arrival: "22:00",
        durationMinutes: 930,
        price: 18500,
        currency: "FCFA",
        availableSeats: 12,
        totalSeats: 45,
        amenities: ["wifi", "ac", "usb", "snack"],
        rating: 4.6,
        reviewCount: 312,
        imageUrl:
          "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=400&q=80",
        color: "#f97316",
        departureDate: today,
      },
      {
        operator: "Air Ivoire",
        type: "Avion" as const,
        from: "Abidjan",
        to: "Kinshasa",
        departure: "09:15",
        arrival: "12:45",
        durationMinutes: 210,
        price: 185000,
        currency: "FCFA",
        availableSeats: 4,
        totalSeats: 150,
        amenities: ["repas", "wifi", "bagage"],
        rating: 4.5,
        reviewCount: 891,
        imageUrl:
          "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=400&q=80",
        color: "#3b82f6",
        departureDate: today,
      },
      {
        operator: "Confort Express",
        type: "Minibus" as const,
        from: "Abidjan",
        to: "Bouaké",
        departure: "07:00",
        arrival: "10:30",
        durationMinutes: 210,
        price: 5000,
        currency: "FCFA",
        availableSeats: 8,
        totalSeats: 18,
        amenities: ["ac", "usb"],
        rating: 4.3,
        reviewCount: 156,
        imageUrl:
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
        color: "#10b981",
        departureDate: today,
      },
    ];

    for (const trip of sampleTrips) {
      await ctx.db.insert("trips", trip);
    }

    const destExisting = await ctx.db.query("destinations").take(1);
    if (destExisting.length > 0) return;

    const destinations = [
      {
        name: "Paris",
        country: "France",
        continent: "Europe",
        imageUrl:
          "https://images.unsplash.com/photo-1509299349698-dd22323b5963?w=800&q=80",
        budget: "Premium",
        rating: 4.8,
        reviewCount: 12400,
        description: "La Ville Lumière et sa gastronomie légendaire.",
        highlights: ["Tour Eiffel", "Louvre", "Montmartre"],
        trending: true,
        color: "#6366F1",
        currency: "EUR €",
        language: "Français",
        flightHours: 6,
      },
      {
        name: "Bali",
        country: "Indonésie",
        continent: "Asie",
        imageUrl:
          "https://images.unsplash.com/photo-1559305289-4c31700ba9cb?w=800&q=80",
        budget: "Moyen",
        rating: 4.7,
        reviewCount: 9800,
        description: "Île des dieux avec ses rizières et temples.",
        highlights: ["Ubud", "Tanah Lot", "Seminyak"],
        trending: true,
        color: "#10B981",
        currency: "IDR Rp",
        language: "Balinais",
        flightHours: 16,
      },
      {
        name: "Accra",
        country: "Ghana",
        continent: "Afrique",
        imageUrl:
          "https://images.unsplash.com/photo-1609198092458-38a293c7ac4b?w=800&q=80",
        budget: "Économique",
        rating: 4.4,
        reviewCount: 2100,
        description: "Capitale vibrante de l'Afrique de l'Ouest.",
        highlights: ["Labadi Beach", "Kwame Nkrumah", "Makola Market"],
        trending: false,
        color: "#F59E0B",
        currency: "GHS",
        language: "Anglais",
        flightHours: 1,
      },
    ];

    for (const dest of destinations) {
      await ctx.db.insert("destinations", dest);
    }
  },
});
