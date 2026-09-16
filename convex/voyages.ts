// convex/voyages.ts

import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

// ============================================================================
// CONFIGURATION
// ============================================================================

const MAX_SEARCH_RESULTS = 100;
const MAX_RECOMMENDED_TRIPS = 20;
const MAX_SIMILAR_TRIPS = 20;
const MAX_BOOKINGS = 20;
const MAX_SAVED_TRIPS = 100;
const MAX_DESTINATIONS = 100;
const MAX_REVIEWS = 100;

const MIN_TRIP_PRICE = 0;
const MAX_TRIP_PRICE = 100_000_000;

const MIN_TRIP_DURATION = 1;
const MAX_TRIP_DURATION = 7 * 24 * 60;

const MIN_TOTAL_SEATS = 1;
const MAX_TOTAL_SEATS = 10_000;

const MAX_BOOKING_SEATS = 100;
const MAX_SEAT_NUMBER_LENGTH = 20;

const MAX_PASSENGER_NAME_LENGTH = 120;
const MAX_PHONE_LENGTH = 40;
const MAX_REVIEW_COMMENT_LENGTH = 2_000;

// ============================================================================
// TYPES
// ============================================================================

type QueryOrMutationCtx = QueryCtx | MutationCtx;

type Trip = Doc<"trips">;

type TripWithImage = Trip & {
  imageUrl?: string;
};

// ============================================================================
// AUTHENTICATION
// ============================================================================

async function getUser(ctx: QueryOrMutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  return ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

async function requireUser(ctx: QueryOrMutationCtx) {
  const user = await getUser(ctx);

  if (!user) {
    throw new ConvexError({
      message: "Non authentifié",
      code: "UNAUTHENTICATED",
    });
  }

  return user;
}

// ============================================================================
// VALIDATION
// ============================================================================

function assertNonEmpty(value: string, field: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new ConvexError({
      message: `${field} est obligatoire`,
      code: "BAD_REQUEST",
    });
  }

  return normalized;
}

function assertPositiveInteger(
  value: number,
  field: string,
  maximum?: number,
): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new ConvexError({
      message: `${field} doit être un entier positif`,
      code: "BAD_REQUEST",
    });
  }

  if (maximum !== undefined && value > maximum) {
    throw new ConvexError({
      message: `${field} dépasse la limite autorisée`,
      code: "BAD_REQUEST",
    });
  }
}

function assertValidRating(rating: number): void {
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new ConvexError({
      message: "La note doit être comprise entre 1 et 5",
      code: "BAD_REQUEST",
    });
  }
}

function assertTripCapacity(totalSeats: number, availableSeats: number): void {
  if (
    !Number.isInteger(totalSeats) ||
    totalSeats < MIN_TOTAL_SEATS ||
    totalSeats > MAX_TOTAL_SEATS
  ) {
    throw new ConvexError({
      message: "Nombre total de places invalide",
      code: "BAD_REQUEST",
    });
  }

  if (
    !Number.isInteger(availableSeats) ||
    availableSeats < 0 ||
    availableSeats > totalSeats
  ) {
    throw new ConvexError({
      message: "Nombre de places disponibles invalide",
      code: "BAD_REQUEST",
    });
  }
}

function assertTripPricing(price: number): void {
  if (
    !Number.isFinite(price) ||
    price < MIN_TRIP_PRICE ||
    price > MAX_TRIP_PRICE
  ) {
    throw new ConvexError({
      message: "Prix du trajet invalide",
      code: "BAD_REQUEST",
    });
  }
}

function assertTripDuration(durationMinutes: number): void {
  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes < MIN_TRIP_DURATION ||
    durationMinutes > MAX_TRIP_DURATION
  ) {
    throw new ConvexError({
      message: "Durée du trajet invalide",
      code: "BAD_REQUEST",
    });
  }
}

function assertPassengerName(name: string): string {
  const normalized = name.trim();

  if (!normalized) {
    throw new ConvexError({
      message: "Le nom du passager est obligatoire",
      code: "BAD_REQUEST",
    });
  }

  if (normalized.length > MAX_PASSENGER_NAME_LENGTH) {
    throw new ConvexError({
      message: "Le nom du passager est trop long",
      code: "BAD_REQUEST",
    });
  }

  return normalized;
}

function normalizeOptionalPhone(phone: string | undefined): string | undefined {
  if (phone === undefined) {
    return undefined;
  }

  const normalized = phone.trim();

  if (!normalized) {
    return undefined;
  }

  if (normalized.length > MAX_PHONE_LENGTH) {
    throw new ConvexError({
      message: "Numéro de téléphone trop long",
      code: "BAD_REQUEST",
    });
  }

  return normalized;
}

// ============================================================================
// SIÈGES
// ============================================================================

function normalizeSeatNumber(value: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new ConvexError({
      message: "Un numéro de siège est invalide",
      code: "BAD_REQUEST",
    });
  }

  if (normalized.length > MAX_SEAT_NUMBER_LENGTH) {
    throw new ConvexError({
      message: "Numéro de siège trop long",
      code: "BAD_REQUEST",
    });
  }

  return normalized;
}

function normalizeSeatNumbers(
  seatNumbers: string[],
  expectedCount: number,
): string[] {
  if (seatNumbers.length !== expectedCount) {
    throw new ConvexError({
      message:
        "Le nombre de sièges sélectionnés doit correspondre au nombre de places",
      code: "BAD_REQUEST",
    });
  }

  const normalized = seatNumbers.map(normalizeSeatNumber);

  const uniqueSeats = new Set(normalized);

  if (uniqueSeats.size !== normalized.length) {
    throw new ConvexError({
      message: "Un même siège ne peut pas être réservé deux fois",
      code: "BAD_REQUEST",
    });
  }

  return normalized;
}

// ============================================================================
// IMAGES
// ============================================================================

async function resolveImageUrl(
  ctx: QueryCtx,
  storageId: string | undefined | null,
): Promise<string | undefined> {
  if (!storageId) {
    return undefined;
  }

  if (
    storageId.startsWith("http://") ||
    storageId.startsWith("https://") ||
    storageId.startsWith("data:")
  ) {
    return storageId;
  }

  if (storageId.startsWith("blob:")) {
    return undefined;
  }

  try {
    const url = await ctx.storage.getUrl(storageId as Id<"_storage">);

    return url ?? undefined;
  } catch {
    return undefined;
  }
}

async function resolveTripImage(
  ctx: QueryCtx,
  trip: Trip,
): Promise<TripWithImage> {
  return {
    ...trip,
    imageUrl: await resolveImageUrl(ctx, trip.imageUrl),
  };
}

async function resolveTripsImages(
  ctx: QueryCtx,
  trips: Trip[],
): Promise<TripWithImage[]> {
  return Promise.all(trips.map((trip) => resolveTripImage(ctx, trip)));
}

// ============================================================================
// 1. TRAJETS — RECHERCHE
// ============================================================================

export const searchTrips = query({
  args: {
    from: v.string(),
    to: v.string(),
    departureDate: v.optional(v.string()),
    type: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const from = assertNonEmpty(args.from, "Ville de départ");

    const to = assertNonEmpty(args.to, "Destination");

    if (from.toLowerCase() === to.toLowerCase()) {
      return [];
    }

    let trips: Trip[];

    if (args.departureDate) {
      const departureDate = assertNonEmpty(
        args.departureDate,
        "Date de départ",
      );

      trips = await ctx.db
        .query("trips")
        .withIndex("by_route_and_date", (q) =>
          q.eq("from", from).eq("to", to).eq("departureDate", departureDate),
        )
        .take(MAX_SEARCH_RESULTS);
    } else {
      trips = await ctx.db
        .query("trips")
        .withIndex("by_route", (q) => q.eq("from", from).eq("to", to))
        .take(MAX_SEARCH_RESULTS);
    }

    if (args.type && args.type !== "Tout") {
      trips = trips.filter((trip) => trip.type === args.type);
    }

    return resolveTripsImages(ctx, trips);
  },
});

// ============================================================================
// 2. TRAJET — DÉTAIL
// ============================================================================

export const getTrip = query({
  args: {
    id: v.id("trips"),
  },

  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.id);

    if (!trip) {
      return null;
    }

    return resolveTripImage(ctx, trip);
  },
});

// ============================================================================
// 3. SIÈGES — DISPONIBILITÉ
// ============================================================================

export const getTripSeats = query({
  args: {
    tripId: v.id("trips"),
  },

  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);

    if (!trip) {
      return [];
    }

    return ctx.db
      .query("tripSeats")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .take(MAX_TOTAL_SEATS);
  },
});

// ============================================================================
// 4. TRAJETS RECOMMANDÉS
// ============================================================================

export const getRecommendedTrips = query({
  args: {
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const requestedLimit = args.limit ?? 6;

    const limit = Math.min(
      Math.max(Math.floor(requestedLimit), 1),
      MAX_RECOMMENDED_TRIPS,
    );

    const trips = await ctx.db.query("trips").take(MAX_SEARCH_RESULTS);

    const sorted = [...trips]
      .sort((a, b) => {
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }

        if (b.reviewCount !== a.reviewCount) {
          return b.reviewCount - a.reviewCount;
        }

        return a.price - b.price;
      })
      .slice(0, limit);

    return resolveTripsImages(ctx, sorted);
  },
});

// ============================================================================
// 5. TRAJETS SIMILAIRES
// ============================================================================

export const getSimilarTrips = query({
  args: {
    tripId: v.id("trips"),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);

    if (!trip) {
      return [];
    }

    const requestedLimit = args.limit ?? 4;

    const limit = Math.min(
      Math.max(Math.floor(requestedLimit), 1),
      MAX_SIMILAR_TRIPS,
    );

    const trips = await ctx.db
      .query("trips")
      .withIndex("by_route", (q) => q.eq("from", trip.from).eq("to", trip.to))
      .take(MAX_SIMILAR_TRIPS + 1);

    const similar = trips
      .filter((candidate) => candidate._id !== trip._id)
      .sort((a, b) => {
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }

        return a.price - b.price;
      })
      .slice(0, limit);

    return resolveTripsImages(ctx, similar);
  },
});

// ============================================================================
// 6. RÉSERVATION
// ============================================================================

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

    assertPositiveInteger(args.seats, "Nombre de places", MAX_BOOKING_SEATS);

    const passengerName = assertPassengerName(args.passengerName);

    const passengerPhone = normalizeOptionalPhone(args.passengerPhone);

    const normalizedSeatNumbers = normalizeSeatNumbers(
      args.seatNumbers,
      args.seats,
    );

    const trip = await ctx.db.get(args.tripId);

    if (!trip) {
      throw new ConvexError({
        message: "Trajet non trouvé",
        code: "NOT_FOUND",
      });
    }

    assertTripCapacity(trip.totalSeats, trip.availableSeats);

    assertTripPricing(trip.price);

    if (trip.availableSeats < args.seats) {
      throw new ConvexError({
        message: "Pas assez de places disponibles",
        code: "BAD_REQUEST",
      });
    }

    // ------------------------------------------------------------------------
    // SOURCE DE VÉRITÉ : tripSeats
    // ------------------------------------------------------------------------

    const selectedSeats = [];

    for (const seatNumber of normalizedSeatNumbers) {
      const seat = await ctx.db
        .query("tripSeats")
        .withIndex("by_trip_and_seat", (q) =>
          q.eq("tripId", args.tripId).eq("seatNumber", seatNumber),
        )
        .unique();

      if (!seat) {
        throw new ConvexError({
          message: `Le siège ${seatNumber} n'existe pas pour ce trajet`,
          code: "BAD_REQUEST",
        });
      }

      if (seat.status !== "available") {
        throw new ConvexError({
          message: `Le siège ${seatNumber} n'est plus disponible`,
          code: "SEAT_UNAVAILABLE",
        });
      }

      selectedSeats.push(seat);
    }

    if (selectedSeats.length !== args.seats) {
      throw new ConvexError({
        message: "Les sièges sélectionnés sont invalides",
        code: "BAD_REQUEST",
      });
    }

    // ------------------------------------------------------------------------
    // RÉSERVATION
    //
    // Les documents tripSeats ont été lus avant leur modification.
    // Convex garantit l'isolation transactionnelle de la mutation :
    // une modification concurrente d'un siège lu provoque la réexécution
    // transactionnelle au lieu d'autoriser deux confirmations concurrentes.
    // ------------------------------------------------------------------------

    const bookingId = await ctx.db.insert("tripBookings", {
      tripId: args.tripId,
      userId: user._id,
      seats: args.seats,
      totalPrice: trip.price * args.seats,
      status: "confirmed",
      seatNumbers: normalizedSeatNumbers,
      passengerName,
      passengerPhone,
      bookedAt: new Date().toISOString(),
    });

    const now = Date.now();

    for (const seat of selectedSeats) {
      await ctx.db.patch(seat._id, {
        status: "booked",
        bookingId,
        userId: user._id,
        heldUntil: undefined,
        updatedAt: now,
      });
    }

    const remainingSeats = trip.availableSeats - args.seats;

    if (remainingSeats < 0) {
      throw new ConvexError({
        message: "État de capacité invalide",
        code: "INVALID_STATE",
      });
    }

    await ctx.db.patch(args.tripId, {
      availableSeats: remainingSeats,
    });

    return bookingId;
  },
});

// ============================================================================
// 7. MES RÉSERVATIONS
// ============================================================================

export const getMyBookings = query({
  args: {},

  handler: async (ctx) => {
    const user = await getUser(ctx);

    if (!user) {
      return [];
    }

    const bookings = await ctx.db
      .query("tripBookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(MAX_BOOKINGS);

    return Promise.all(
      bookings.map(async (booking) => {
        const trip = await ctx.db.get(booking.tripId);

        return {
          ...booking,
          trip: trip ? await resolveTripImage(ctx, trip) : null,
        };
      }),
    );
  },
});

// ============================================================================
// 8. RÉSERVATION — DÉTAIL
// ============================================================================

export const getMyBooking = query({
  args: {
    bookingId: v.id("tripBookings"),
  },

  handler: async (ctx, args) => {
    const user = await getUser(ctx);

    if (!user) {
      return null;
    }

    const booking = await ctx.db.get(args.bookingId);

    if (!booking || booking.userId !== user._id) {
      return null;
    }

    const trip = await ctx.db.get(booking.tripId);

    const seats = await ctx.db
      .query("tripSeats")
      .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
      .take(MAX_BOOKING_SEATS);

    return {
      ...booking,
      trip: trip ? await resolveTripImage(ctx, trip) : null,
      seats,
    };
  },
});

// ============================================================================
// 9. ANNULER UNE RÉSERVATION
// ============================================================================

export const cancelBooking = mutation({
  args: {
    bookingId: v.id("tripBookings"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const booking = await ctx.db.get(args.bookingId);

    if (!booking) {
      throw new ConvexError({
        message: "Réservation introuvable",
        code: "NOT_FOUND",
      });
    }

    if (booking.userId !== user._id) {
      throw new ConvexError({
        message: "Non autorisé",
        code: "FORBIDDEN",
      });
    }

    if (booking.status === "cancelled") {
      throw new ConvexError({
        message: "Cette réservation est déjà annulée",
        code: "INVALID_STATE",
      });
    }

    const trip = await ctx.db.get(booking.tripId);

    if (!trip) {
      throw new ConvexError({
        message: "Trajet associé introuvable",
        code: "NOT_FOUND",
      });
    }

    assertTripCapacity(trip.totalSeats, trip.availableSeats);

    const bookedSeats = await ctx.db
      .query("tripSeats")
      .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
      .take(MAX_BOOKING_SEATS);

    if (bookedSeats.length !== booking.seats) {
      throw new ConvexError({
        message: "État des sièges de la réservation incohérent",
        code: "INVALID_STATE",
      });
    }

    const now = Date.now();

    for (const seat of bookedSeats) {
      if (seat.status !== "booked" || seat.bookingId !== booking._id) {
        throw new ConvexError({
          message: "État d'un siège incompatible avec l'annulation",
          code: "INVALID_STATE",
        });
      }

      await ctx.db.patch(seat._id, {
        status: "available",
        bookingId: undefined,
        userId: undefined,
        heldUntil: undefined,
        updatedAt: now,
      });
    }

    const restoredSeats = trip.availableSeats + booking.seats;

    if (restoredSeats > trip.totalSeats) {
      throw new ConvexError({
        message: "État de capacité du trajet invalide",
        code: "INVALID_STATE",
      });
    }

    await ctx.db.patch(trip._id, {
      availableSeats: restoredSeats,
    });

    await ctx.db.patch(args.bookingId, {
      status: "cancelled",
    });

    return true;
  },
});

// ============================================================================
// 10. FAVORIS — TRAJETS
// ============================================================================

export const toggleSaveTrip = mutation({
  args: {
    tripId: v.id("trips"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const trip = await ctx.db.get(args.tripId);

    if (!trip) {
      throw new ConvexError({
        message: "Trajet introuvable",
        code: "NOT_FOUND",
      });
    }

    const existing = await ctx.db
      .query("tripSaves")
      .withIndex("by_user_and_trip", (q) =>
        q.eq("userId", user._id).eq("tripId", args.tripId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }

    await ctx.db.insert("tripSaves", {
      userId: user._id,
      tripId: args.tripId,
      savedAt: new Date().toISOString(),
    });

    return true;
  },
});

export const getSavedTripIds = query({
  args: {},

  handler: async (ctx) => {
    const user = await getUser(ctx);

    if (!user) {
      return [];
    }

    const saves = await ctx.db
      .query("tripSaves")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(MAX_SAVED_TRIPS);

    return saves.map((save) => save.tripId);
  },
});

export const getMySavedTrips = query({
  args: {},

  handler: async (ctx) => {
    const user = await getUser(ctx);

    if (!user) {
      return [];
    }

    const saves = await ctx.db
      .query("tripSaves")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(MAX_SAVED_TRIPS);

    const trips = await Promise.all(
      saves.map(async (save) => {
        const trip = await ctx.db.get(save.tripId);

        if (!trip) {
          return null;
        }

        return resolveTripImage(ctx, trip);
      }),
    );

    return trips.filter((trip): trip is TripWithImage => trip !== null);
  },
});

// ============================================================================
// 11. DESTINATIONS
// ============================================================================

export const listDestinations = query({
  args: {
    continent: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    if (args.continent && args.continent !== "Tout") {
      return ctx.db
        .query("destinations")
        .withIndex("by_continent", (q) => q.eq("continent", args.continent!))
        .take(MAX_DESTINATIONS);
    }

    return ctx.db.query("destinations").take(MAX_DESTINATIONS);
  },
});

export const getDestination = query({
  args: {
    id: v.id("destinations"),
  },

  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

// ============================================================================
// 12. FAVORIS — DESTINATIONS
// ============================================================================

export const toggleSaveDestination = mutation({
  args: {
    destinationId: v.id("destinations"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const destination = await ctx.db.get(args.destinationId);

    if (!destination) {
      throw new ConvexError({
        message: "Destination introuvable",
        code: "NOT_FOUND",
      });
    }

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

    if (!user) {
      return [];
    }

    const saves = await ctx.db
      .query("destinationSaves")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(MAX_SAVED_TRIPS);

    const destinations = await Promise.all(
      saves.map((save) => ctx.db.get(save.destinationId)),
    );

    return destinations.filter(
      (destination): destination is Doc<"destinations"> => destination !== null,
    );
  },
});

// ============================================================================
// 13. AVIS VOYAGEURS
// ============================================================================

export const getTripReviews = query({
  args: {
    tripId: v.id("trips"),
  },

  handler: async (ctx, args) => {
    return ctx.db
      .query("tripReviews")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .order("desc")
      .take(MAX_REVIEWS);
  },
});

// ============================================================================
// 14. AJOUTER UN AVIS
// ============================================================================

export const addTripReview = mutation({
  args: {
    tripId: v.id("trips"),
    rating: v.number(),
    comment: v.string(),
    bookingId: v.id("tripBookings"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    assertValidRating(args.rating);

    const comment = args.comment.trim();

    if (!comment) {
      throw new ConvexError({
        message: "Le commentaire est obligatoire",
        code: "BAD_REQUEST",
      });
    }

    if (comment.length > MAX_REVIEW_COMMENT_LENGTH) {
      throw new ConvexError({
        message: "Le commentaire est trop long",
        code: "BAD_REQUEST",
      });
    }

    const trip = await ctx.db.get(args.tripId);

    if (!trip) {
      throw new ConvexError({
        message: "Voyage introuvable",
        code: "NOT_FOUND",
      });
    }

    const booking = await ctx.db.get(args.bookingId);

    if (!booking || booking.userId !== user._id) {
      throw new ConvexError({
        message: "Réservation invalide ou non autorisée",
        code: "FORBIDDEN",
      });
    }

    if (booking.tripId !== args.tripId) {
      throw new ConvexError({
        message: "La réservation ne correspond pas à ce voyage",
        code: "BAD_REQUEST",
      });
    }

    if (booking.status !== "confirmed") {
      throw new ConvexError({
        message:
          "Une réservation annulée ne peut pas être utilisée pour cet avis",
        code: "INVALID_STATE",
      });
    }

    const existingForBooking = await ctx.db
      .query("tripReviews")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .unique();

    if (existingForBooking) {
      throw new ConvexError({
        message: "Cette réservation a déjà été évaluée",
        code: "INVALID_STATE",
      });
    }

    const existingForUser = await ctx.db
      .query("tripReviews")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .filter((q) => q.eq(q.field("reviewerId"), user._id))
      .first();

    if (existingForUser) {
      throw new ConvexError({
        message: "Vous avez déjà évalué ce voyage",
        code: "INVALID_STATE",
      });
    }

    await ctx.db.insert("tripReviews", {
      tripId: args.tripId,
      reviewerId: user._id,
      authorName: user.name || "Voyageur",
      rating: args.rating,
      comment,
      bookingId: args.bookingId,
      createdAt: new Date().toISOString(),
    });

    const allReviews = await ctx.db
      .query("tripReviews")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .take(MAX_REVIEWS);

    const totalRating = allReviews.reduce(
      (sum, review) => sum + review.rating,
      0,
    );

    const reviewCount = allReviews.length;

    const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;

    await ctx.db.patch(args.tripId, {
      rating: Number(averageRating.toFixed(1)),
      reviewCount,
    });

    return true;
  },
});

// ============================================================================
// 15. CRÉER UN TRAJET
// ============================================================================

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
    // ------------------------------------------------------------------------
    // AUTHENTIFICATION
    // ------------------------------------------------------------------------

    const user = await requireUser(ctx);

    // ------------------------------------------------------------------------
    // VALIDATION
    // ------------------------------------------------------------------------

    const operator = assertNonEmpty(args.operator, "Opérateur");
    const from = assertNonEmpty(args.from, "Ville de départ");
    const to = assertNonEmpty(args.to, "Destination");
    const departure = assertNonEmpty(args.departure, "Heure de départ");
    const arrival = assertNonEmpty(args.arrival, "Heure d'arrivée");
    const currency = assertNonEmpty(args.currency, "Devise");
    const departureDate = assertNonEmpty(args.departureDate, "Date de départ");

    if (from.toLowerCase() === to.toLowerCase()) {
      throw new ConvexError({
        message:
          "La ville de départ et la destination doivent être différentes",
        code: "BAD_REQUEST",
      });
    }

    assertTripDuration(args.durationMinutes);
    assertTripPricing(args.price);
    assertTripCapacity(args.totalSeats, args.availableSeats);

    // ------------------------------------------------------------------------
    // INTÉGRITÉ DES SIÈGES
    //
    // Un trajet nouvellement créé doit avoir une représentation complète
    // de ses sièges dans tripSeats.
    //
    // Nous refusons volontairement de fabriquer des sièges "blocked" pour
    // représenter une capacité déjà consommée : nous ne connaissons pas
    // quels sièges seraient réellement occupés.
    // ------------------------------------------------------------------------

    if (args.availableSeats !== args.totalSeats) {
      throw new ConvexError({
        message:
          "À la création, availableSeats doit être égal à totalSeats. " +
          "Les sièges déjà occupés doivent être gérés par un flux de " +
          "réconciliation dédié.",
        code: "BAD_REQUEST",
      });
    }

    // ------------------------------------------------------------------------
    // CRÉATION DU TRAJET
    // ------------------------------------------------------------------------

    const tripId = await ctx.db.insert("trips", {
      operator,
      type: args.type,
      from,
      to,
      departure,
      arrival,
      departureDate,
      durationMinutes: args.durationMinutes,
      price: args.price,
      currency,
      availableSeats: args.totalSeats,
      totalSeats: args.totalSeats,
      amenities: args.amenities,
      rating: 0,
      reviewCount: 0,
      imageUrl: args.imageUrl,
      color: args.color,
    });

    // ------------------------------------------------------------------------
    // INITIALISATION DES SIÈGES
    //
    // Chaque siège possède son propre document.
    // Les numéros sont déterministes et uniques pour ce trajet.
    // ------------------------------------------------------------------------

    const now = Date.now();

    for (let index = 1; index <= args.totalSeats; index += 1) {
      await ctx.db.insert("tripSeats", {
        tripId,
        seatNumber: String(index),
        status: "available",
        updatedAt: now,
      });
    }

    // ------------------------------------------------------------------------
    // RETOUR
    // ------------------------------------------------------------------------

    return {
      tripId,
      createdBy: user._id,
      totalSeats: args.totalSeats,
      availableSeats: args.totalSeats,
    };
  },
});
