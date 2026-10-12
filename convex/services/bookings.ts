// convex/services/bookings.ts
//
// Backend Services V1 — cycle de vie des réservations.
//
// Ne remplace PAS api.serviceProviders.book.

import { query, mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

// Enum strict — utilisé partout au lieu de `as never`
const BOOKING_STATUS = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("in_progress"),
  v.literal("done"),
  v.literal("cancelled"),
  v.literal("disputed"),
);

type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "done"
  | "cancelled"
  | "disputed";

// ────────────────────────────────────────────────────────────────
// AUTH
// ────────────────────────────────────────────────────────────────

async function getUser(ctx: Ctx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

async function requireUser(ctx: Ctx): Promise<Doc<"users">> {
  const user = await getUser(ctx);
  if (!user) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Connexion requise",
    });
  }
  return user;
}

async function requireProvider(
  ctx: Ctx,
  providerId: Id<"serviceProviders">,
): Promise<Doc<"serviceProviders">> {
  const provider = await ctx.db.get(providerId);
  if (!provider) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Prestataire introuvable",
    });
  }
  return provider;
}

// ────────────────────────────────────────────────────────────────
// HISTORY
// ────────────────────────────────────────────────────────────────

async function logHistory(
  ctx: MutationCtx,
  providerId: Id<"serviceProviders">,
  event: string,
  actorId: Id<"users">,
  bookingId: Id<"serviceBookings">,
): Promise<void> {
  await ctx.db.insert("serviceHistory", {
    providerId,
    event,
    actorId,
    bookingId,
    type: event,
    createdAt: Date.now(),
  });
}

// ────────────────────────────────────────────────────────────────
// VALIDATION
// ────────────────────────────────────────────────────────────────

const MAX_LIMIT = 100;

function clampLimit(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(Math.floor(value), MAX_LIMIT);
}

// ────────────────────────────────────────────────────────────────
// CALCUL SERVEUR DU MONTANT — aucune confiance client
// ────────────────────────────────────────────────────────────────

type ComputedAmount = {
  totalAmount: number | undefined;
  currency: string | undefined;
};

async function computeServerAmount(
  ctx: Ctx,
  provider: Doc<"serviceProviders">,
  quoteId: Id<"serviceQuotes"> | undefined,
): Promise<ComputedAmount> {
  // Priorité 1 : devis accepté lié
  if (quoteId) {
    const quote = await ctx.db.get(quoteId);
    if (quote && quote.amount !== undefined && quote.currency !== undefined) {
      return { totalAmount: quote.amount, currency: quote.currency };
    }
  }

  // Priorité 2 : tarification fixe du provider
  if (
    provider.pricingModel === "fixed" &&
    provider.basePrice !== undefined &&
    provider.priceCurrency !== undefined
  ) {
    return {
      totalAmount: provider.basePrice,
      currency: provider.priceCurrency,
    };
  }

  // Sinon : montant non déterminable à la création
  return { totalAmount: undefined, currency: undefined };
}

// ────────────────────────────────────────────────────────────────
// CRÉATION
// ────────────────────────────────────────────────────────────────

export const book = mutation({
  args: {
    providerId: v.id("serviceProviders"),
    message: v.string(),
    scheduledAt: v.optional(v.string()),
    quoteId: v.optional(v.id("serviceQuotes")),
    serviceAddress: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    // totalAmount et currency NE SONT PLUS acceptés du client
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const provider = await requireProvider(ctx, args.providerId);

    if (provider.status !== "active") {
      throw new ConvexError({
        code: "PROVIDER_NOT_ACTIVE",
        message: "Ce prestataire n'accepte pas de réservations actuellement.",
      });
    }

    if (provider.userId === user._id) {
      throw new ConvexError({
        code: "SELF_BOOKING",
        message: "Vous ne pouvez pas réserver votre propre prestation.",
      });
    }

    const message = args.message.trim();
    if (message.length < 3) {
      throw new ConvexError({
        code: "INVALID_MESSAGE",
        message: "Le message de réservation est trop court.",
      });
    }
    if (message.length > 2000) {
      throw new ConvexError({
        code: "INVALID_MESSAGE",
        message:
          "Le message de réservation est trop long (2000 caractères max).",
      });
    }

    // Vérifie la cohérence du devis lié
    if (args.quoteId) {
      const quote = await ctx.db.get(args.quoteId);
      if (!quote) {
        throw new ConvexError({
          code: "QUOTE_NOT_FOUND",
          message: "Devis introuvable",
        });
      }
      if (quote.providerId !== args.providerId) {
        throw new ConvexError({
          code: "QUOTE_MISMATCH",
          message: "Le devis ne correspond pas au prestataire.",
        });
      }
      if (quote.clientId !== user._id) {
        throw new ConvexError({
          code: "QUOTE_FORBIDDEN",
          message: "Ce devis ne vous appartient pas.",
        });
      }
      if (quote.status !== "accepted") {
        throw new ConvexError({
          code: "QUOTE_NOT_ACCEPTED",
          message: "Le devis doit être accepté avant de créer une réservation.",
        });
      }
    }

    // Montant calculé côté serveur — pas de confiance client
    const { totalAmount, currency } = await computeServerAmount(
      ctx,
      provider,
      args.quoteId,
    );

    const now = Date.now();

    const bookingId = await ctx.db.insert("serviceBookings", {
      providerId: args.providerId,
      userId: user._id,
      message,
      status: "pending",
      scheduledAt: args.scheduledAt,
      quoteId: args.quoteId,
      serviceAddress: args.serviceAddress,
      attachments: args.attachments,
      notes: args.notes,
      totalAmount,
      currency,
      createdAt: now,
    });

    await logHistory(
      ctx,
      args.providerId,
      "booking.created",
      user._id,
      bookingId,
    );

    return { bookingId, status: "pending" as const, totalAmount, currency };
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE
// ────────────────────────────────────────────────────────────────

export const getMyBookings = query({
  args: {
    status: v.optional(BOOKING_STATUS),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) return [];
    const limit = clampLimit(args.limit, 50);

    let results;
    if (args.status) {
      results = await ctx.db
        .query("serviceBookings")
        .withIndex("by_user_and_status", (q) =>
          q.eq("userId", user._id).eq("status", args.status as BookingStatus),
        )
        .order("desc")
        .take(limit);
    } else {
      results = await ctx.db
        .query("serviceBookings")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .take(limit);
    }

    return Promise.all(
      results.map(async (b) => {
        const provider = await ctx.db.get(b.providerId);
        return { ...b, provider };
      }),
    );
  },
});

export const listProviderBookings = query({
  args: {
    providerId: v.id("serviceProviders"),
    status: v.optional(BOOKING_STATUS),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const provider = await requireProvider(ctx, args.providerId);

    if (provider.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'êtes pas le propriétaire de ce profil.",
      });
    }

    const limit = clampLimit(args.limit, 50);

    let results;
    if (args.status) {
      results = await ctx.db
        .query("serviceBookings")
        .withIndex("by_provider_and_status", (q) =>
          q
            .eq("providerId", args.providerId)
            .eq("status", args.status as BookingStatus),
        )
        .order("desc")
        .take(limit);
    } else {
      results = await ctx.db
        .query("serviceBookings")
        .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
        .order("desc")
        .take(limit);
    }

    return Promise.all(
      results.map(async (b) => {
        const client = await ctx.db.get(b.userId);
        return { ...b, client };
      }),
    );
  },
});

export const getBookingById = query({
  args: { bookingId: v.id("serviceBookings") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return null;

    const provider = await ctx.db.get(booking.providerId);
    if (!provider) return null;

    const isClient = booking.userId === user._id;
    const isProvider = provider.userId === user._id;

    if (!isClient && !isProvider) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'avez pas accès à cette réservation.",
      });
    }

    return { ...booking, provider };
  },
});

// ────────────────────────────────────────────────────────────────
// MISE À JOUR (client)
// ────────────────────────────────────────────────────────────────

export const updateBooking = mutation({
  args: {
    bookingId: v.id("serviceBookings"),
    message: v.optional(v.string()),
    scheduledAt: v.optional(v.string()),
    serviceAddress: v.optional(v.string()),
    notes: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Réservation introuvable",
      });
    }
    if (booking.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Seul le client peut modifier sa réservation.",
      });
    }
    if (booking.status !== "pending") {
      throw new ConvexError({
        code: "IMMUTABLE",
        message:
          "Une réservation confirmée ne peut plus être modifiée par le client.",
      });
    }

    const patch: Partial<Doc<"serviceBookings">> = {};
    if (args.message !== undefined) {
      const m = args.message.trim();
      if (m.length < 3 || m.length > 2000) {
        throw new ConvexError({
          code: "INVALID_MESSAGE",
          message: "Message invalide (3 à 2000 caractères).",
        });
      }
      patch.message = m;
    }
    if (args.scheduledAt !== undefined) patch.scheduledAt = args.scheduledAt;
    if (args.serviceAddress !== undefined)
      patch.serviceAddress = args.serviceAddress;
    if (args.notes !== undefined) patch.notes = args.notes;
    if (args.attachments !== undefined) patch.attachments = args.attachments;

    await ctx.db.patch(args.bookingId, patch);
    await logHistory(
      ctx,
      booking.providerId,
      "booking.updated",
      user._id,
      args.bookingId,
    );

    return { success: true };
  },
});

// ────────────────────────────────────────────────────────────────
// TRANSITIONS DE STATUT
// ────────────────────────────────────────────────────────────────

export const confirmBooking = mutation({
  args: { bookingId: v.id("serviceBookings") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const booking = await ctx.db.get(args.bookingId);
    if (!booking)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Réservation introuvable",
      });

    const provider = await requireProvider(ctx, booking.providerId);
    if (provider.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Seul le prestataire peut confirmer.",
      });
    }
    if (booking.status !== "pending") {
      throw new ConvexError({
        code: "INVALID_TRANSITION",
        message: `Impossible de confirmer une réservation en statut "${booking.status}".`,
      });
    }

    const now = Date.now();
    await ctx.db.patch(args.bookingId, {
      status: "confirmed",
      confirmedAt: now,
    });
    await logHistory(
      ctx,
      booking.providerId,
      "booking.confirmed",
      user._id,
      args.bookingId,
    );

    return { success: true, status: "confirmed" as const };
  },
});

export const startBooking = mutation({
  args: { bookingId: v.id("serviceBookings") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const booking = await ctx.db.get(args.bookingId);
    if (!booking)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Réservation introuvable",
      });

    const provider = await requireProvider(ctx, booking.providerId);
    if (provider.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Seul le prestataire peut démarrer.",
      });
    }
    if (booking.status !== "confirmed") {
      throw new ConvexError({
        code: "INVALID_TRANSITION",
        message: `Impossible de démarrer une réservation en statut "${booking.status}".`,
      });
    }

    const now = Date.now();
    await ctx.db.patch(args.bookingId, {
      status: "in_progress",
      startedAt: now,
    });
    await logHistory(
      ctx,
      booking.providerId,
      "booking.started",
      user._id,
      args.bookingId,
    );

    return { success: true, status: "in_progress" as const };
  },
});

// Seul le CLIENT peut clôturer — politique décidée
export const completeBooking = mutation({
  args: { bookingId: v.id("serviceBookings") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const booking = await ctx.db.get(args.bookingId);
    if (!booking)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Réservation introuvable",
      });

    if (booking.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message:
          "Seul le client peut confirmer que la prestation est terminée.",
      });
    }
    if (booking.status !== "in_progress") {
      throw new ConvexError({
        code: "INVALID_TRANSITION",
        message: `Impossible de clôturer une réservation en statut "${booking.status}".`,
      });
    }

    const now = Date.now();
    await ctx.db.patch(args.bookingId, { status: "done", completedAt: now });
    await logHistory(
      ctx,
      booking.providerId,
      "booking.completed",
      user._id,
      args.bookingId,
    );

    return { success: true, status: "done" as const };
  },
});

// ────────────────────────────────────────────────────────────────
// ANNULATION (client OU provider)
// ────────────────────────────────────────────────────────────────

export const cancelBooking = mutation({
  args: {
    bookingId: v.id("serviceBookings"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const booking = await ctx.db.get(args.bookingId);
    if (!booking)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Réservation introuvable",
      });

    const provider = await requireProvider(ctx, booking.providerId);
    const isProvider = provider.userId === user._id;
    const isClient = booking.userId === user._id;

    if (!isProvider && !isClient) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé." });
    }

    if (booking.status !== "pending" && booking.status !== "confirmed") {
      throw new ConvexError({
        code: "INVALID_TRANSITION",
        message: `Annulation impossible depuis le statut "${booking.status}".`,
      });
    }

    const now = Date.now();
    await ctx.db.patch(args.bookingId, {
      status: "cancelled",
      cancelledAt: now,
      cancelledBy: user._id,
      cancellationReason: args.reason,
    });
    await logHistory(
      ctx,
      booking.providerId,
      "booking.cancelled",
      user._id,
      args.bookingId,
    );

    return { success: true, status: "cancelled" as const };
  },
});

// ────────────────────────────────────────────────────────────────
// LITIGE — la vraie raison est conservée dans `description`
// ────────────────────────────────────────────────────────────────

export const disputeBooking = mutation({
  args: {
    bookingId: v.id("serviceBookings"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const booking = await ctx.db.get(args.bookingId);
    if (!booking)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Réservation introuvable",
      });

    if (booking.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Seul le client peut ouvrir un litige.",
      });
    }

    if (booking.status !== "in_progress" && booking.status !== "done") {
      throw new ConvexError({
        code: "INVALID_TRANSITION",
        message:
          "Un litige ne peut être ouvert qu'après le début de la prestation.",
      });
    }

    const reason = args.reason.trim();
    if (reason.length < 10) {
      throw new ConvexError({
        code: "INVALID_REASON",
        message: "Le motif du litige doit contenir au moins 10 caractères.",
      });
    }

    const now = Date.now();
    await ctx.db.patch(args.bookingId, { status: "disputed" });

    const disputeId = await ctx.db.insert("serviceDisputes", {
      bookingId: args.bookingId,
      openedBy: user._id,
      againstProviderId: booking.providerId,
      reason: "other",
      description: reason, // la vraie raison est ici
      status: "open",
      createdAt: now,
    });

    await logHistory(
      ctx,
      booking.providerId,
      "booking.disputed",
      user._id,
      args.bookingId,
    );

    return { disputeId, status: "open" as const };
  },
});
