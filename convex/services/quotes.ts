// convex/services/quotes.ts
//
// Backend Services V1 — devis.
//
// Cycle : pending → accepted → converted (en booking)
//       pending → rejected
//       pending → expired

import { query, mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

const QUOTE_STATUS = v.union(
  v.literal("pending"),
  v.literal("accepted"),
  v.literal("rejected"),
  v.literal("expired"),
  v.literal("converted"),
);

type QuoteStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "expired"
  | "converted";

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
// HELPERS
// ────────────────────────────────────────────────────────────────

const MAX_LIMIT = 100;

function clampLimit(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(Math.floor(value), MAX_LIMIT);
}

const ISO_4217 = /^[A-Z]{3}$/;

async function logHistory(
  ctx: MutationCtx,
  providerId: Id<"serviceProviders">,
  event: string,
  actorId: Id<"users">,
): Promise<void> {
  await ctx.db.insert("serviceHistory", {
    providerId,
    event,
    actorId,
    type: event,
    createdAt: Date.now(),
  });
}

// ────────────────────────────────────────────────────────────────
// DEMANDE DE DEVIS (client)
// ────────────────────────────────────────────────────────────────

export const requestQuote = mutation({
  args: {
    providerId: v.id("serviceProviders"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const provider = await requireProvider(ctx, args.providerId);

    if (provider.status !== "active") {
      throw new ConvexError({
        code: "PROVIDER_NOT_ACTIVE",
        message: "Ce prestataire n'accepte pas de demandes actuellement.",
      });
    }

    if (provider.userId === user._id) {
      throw new ConvexError({
        code: "SELF_QUOTE",
        message: "Vous ne pouvez pas demander un devis à vous-même.",
      });
    }

    const message = args.message.trim();
    if (message.length < 10) {
      throw new ConvexError({
        code: "INVALID_MESSAGE",
        message: "Décrivez votre besoin (10 caractères minimum).",
      });
    }
    if (message.length > 3000) {
      throw new ConvexError({
        code: "INVALID_MESSAGE",
        message: "Message trop long (3000 caractères max).",
      });
    }

    const now = Date.now();
    const quoteId = await ctx.db.insert("serviceQuotes", {
      providerId: args.providerId,
      clientId: user._id,
      message,
      status: "pending",
      createdAt: now,
    });

    await logHistory(ctx, args.providerId, "quote.requested", user._id);

    return { quoteId, status: "pending" as const };
  },
});

// ────────────────────────────────────────────────────────────────
// RÉPONSE DU PRESTATAIRE — montant + lignes
// ────────────────────────────────────────────────────────────────

export const respondToQuote = mutation({
  args: {
    quoteId: v.id("serviceQuotes"),
    amount: v.number(),
    currency: v.string(),
    validUntil: v.optional(v.number()),
    providerNote: v.optional(v.string()),
    lineItems: v.optional(
      v.array(
        v.object({
          label: v.string(),
          qty: v.number(),
          unitPrice: v.number(),
          total: v.number(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const quote = await ctx.db.get(args.quoteId);
    if (!quote)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Devis introuvable",
      });

    const provider = await requireProvider(ctx, quote.providerId);
    if (provider.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Seul le prestataire peut répondre à ce devis.",
      });
    }

    if (quote.status !== "pending") {
      throw new ConvexError({
        code: "INVALID_TRANSITION",
        message: `Impossible de répondre à un devis en statut "${quote.status}".`,
      });
    }

    if (!Number.isFinite(args.amount) || args.amount <= 0) {
      throw new ConvexError({
        code: "INVALID_AMOUNT",
        message: "Le montant doit être strictement positif.",
      });
    }

    const currency = args.currency.trim().toUpperCase();
    if (!ISO_4217.test(currency)) {
      throw new ConvexError({
        code: "INVALID_CURRENCY",
        message: "Devise ISO 4217 requise (3 lettres majuscules).",
      });
    }

    if (args.lineItems) {
      for (const item of args.lineItems) {
        if (!item.label.trim()) {
          throw new ConvexError({
            code: "INVALID_LINE_ITEM",
            message: "Chaque ligne doit avoir un libellé.",
          });
        }
        if (item.qty <= 0 || item.unitPrice < 0) {
          throw new ConvexError({
            code: "INVALID_LINE_ITEM",
            message: "Quantité et prix unitaire invalides.",
          });
        }
      }
    }

    const now = Date.now();
    await ctx.db.patch(args.quoteId, {
      amount: args.amount,
      currency,
      validUntil: args.validUntil,
      providerNote: args.providerNote,
      lineItems: args.lineItems,
      respondedAt: now,
    });

    await logHistory(ctx, quote.providerId, "quote.responded", user._id);

    return { success: true };
  },
});

// ────────────────────────────────────────────────────────────────
// ACCEPTATION (client) — nécessite un montant
// ────────────────────────────────────────────────────────────────

export const acceptQuote = mutation({
  args: { quoteId: v.id("serviceQuotes") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const quote = await ctx.db.get(args.quoteId);
    if (!quote)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Devis introuvable",
      });

    if (quote.clientId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Seul le client peut accepter ce devis.",
      });
    }

    if (quote.status !== "pending") {
      throw new ConvexError({
        code: "INVALID_TRANSITION",
        message: `Acceptation impossible depuis le statut "${quote.status}".`,
      });
    }

    if (quote.amount === undefined || quote.currency === undefined) {
      throw new ConvexError({
        code: "QUOTE_NOT_ANSWERED",
        message: "Le prestataire n'a pas encore répondu avec un montant.",
      });
    }

    if (quote.validUntil !== undefined && quote.validUntil < Date.now()) {
      throw new ConvexError({
        code: "QUOTE_EXPIRED",
        message: "Ce devis a expiré.",
      });
    }

    await ctx.db.patch(args.quoteId, {
      status: "accepted",
      respondedAt: quote.respondedAt ?? Date.now(),
    });

    await logHistory(ctx, quote.providerId, "quote.accepted", user._id);

    return { success: true, status: "accepted" as const };
  },
});

export const rejectQuote = mutation({
  args: {
    quoteId: v.id("serviceQuotes"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const quote = await ctx.db.get(args.quoteId);
    if (!quote)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Devis introuvable",
      });

    if (quote.clientId !== user._id) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé." });
    }

    if (quote.status !== "pending") {
      throw new ConvexError({
        code: "INVALID_TRANSITION",
        message: `Rejet impossible depuis le statut "${quote.status}".`,
      });
    }

    await ctx.db.patch(args.quoteId, {
      status: "rejected",
      providerNote: args.reason ?? quote.providerNote,
    });

    await logHistory(ctx, quote.providerId, "quote.rejected", user._id);

    return { success: true, status: "rejected" as const };
  },
});

// ────────────────────────────────────────────────────────────────
// CONVERSION EN RÉSERVATION (client)
// ────────────────────────────────────────────────────────────────

export const convertQuoteToBooking = mutation({
  args: {
    quoteId: v.id("serviceQuotes"),
    scheduledAt: v.optional(v.string()),
    serviceAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const quote = await ctx.db.get(args.quoteId);
    if (!quote)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Devis introuvable",
      });

    if (quote.clientId !== user._id) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé." });
    }

    if (quote.status !== "accepted") {
      throw new ConvexError({
        code: "INVALID_TRANSITION",
        message: "Le devis doit être accepté avant la conversion.",
      });
    }

    if (quote.bookingId !== undefined) {
      throw new ConvexError({
        code: "ALREADY_CONVERTED",
        message: "Ce devis a déjà été converti en réservation.",
      });
    }

    const provider = await requireProvider(ctx, quote.providerId);
    if (provider.status !== "active") {
      throw new ConvexError({
        code: "PROVIDER_NOT_ACTIVE",
        message: "Le prestataire n'est plus actif.",
      });
    }

    const now = Date.now();
    const bookingId = await ctx.db.insert("serviceBookings", {
      providerId: quote.providerId,
      userId: user._id,
      message: quote.message,
      status: "pending",
      scheduledAt: args.scheduledAt,
      quoteId: args.quoteId,
      serviceAddress: args.serviceAddress,
      totalAmount: quote.amount,
      currency: quote.currency,
      createdAt: now,
    });

    await ctx.db.patch(args.quoteId, {
      status: "converted",
      bookingId,
    });

    await logHistory(ctx, quote.providerId, "quote.converted", user._id);

    return { success: true, bookingId, status: "converted" as const };
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE
// ────────────────────────────────────────────────────────────────

export const listMyQuotes = query({
  args: {
    status: v.optional(QUOTE_STATUS),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) return [];
    const limit = clampLimit(args.limit, 50);

    let results;
    if (args.status) {
      results = await ctx.db
        .query("serviceQuotes")
        .withIndex("by_client", (q) => q.eq("clientId", user._id))
        .filter((q) => q.eq(q.field("status"), args.status as QuoteStatus))
        .order("desc")
        .take(limit);
    } else {
      results = await ctx.db
        .query("serviceQuotes")
        .withIndex("by_client", (q) => q.eq("clientId", user._id))
        .order("desc")
        .take(limit);
    }

    return Promise.all(
      results.map(async (q) => {
        const provider = await ctx.db.get(q.providerId);
        return { ...q, provider };
      }),
    );
  },
});

export const listProviderQuotes = query({
  args: {
    providerId: v.id("serviceProviders"),
    status: v.optional(QUOTE_STATUS),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const provider = await requireProvider(ctx, args.providerId);

    if (provider.userId !== user._id) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé." });
    }

    const limit = clampLimit(args.limit, 50);

    let results;
    if (args.status) {
      results = await ctx.db
        .query("serviceQuotes")
        .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
        .filter((q) => q.eq(q.field("status"), args.status as QuoteStatus))
        .order("desc")
        .take(limit);
    } else {
      results = await ctx.db
        .query("serviceQuotes")
        .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
        .order("desc")
        .take(limit);
    }

    return Promise.all(
      results.map(async (q) => {
        const client = await ctx.db.get(q.clientId);
        return { ...q, client };
      }),
    );
  },
});

export const getQuoteById = query({
  args: { quoteId: v.id("serviceQuotes") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const quote = await ctx.db.get(args.quoteId);
    if (!quote) return null;

    const provider = await ctx.db.get(quote.providerId);
    if (!provider) return null;

    const isClient = quote.clientId === user._id;
    const isProvider = provider.userId === user._id;

    if (!isClient && !isProvider) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé." });
    }

    return { ...quote, provider };
  },
});
