// convex/services/invoices.ts
//
// Backend Services V1 — factures.
//
// Cycle :
//   draft → issued → paid
//                  ↘ cancelled
//
// Règles :
//   - une facture par réservation (1:1)
//   - numérotation séquentielle par année via compteur persistant
//   - montant ET devise cohérents avec la réservation (les deux ou aucun)
//   - draft modifiable, issued figée, paid archive
//   - LECTURE : client OU provider OU admin
//   - ÉCRITURE : client OU provider (jamais admin seul)
//   - marquage payé : public vérifie la précondition, mais SEUL
//     markInvoicePaidInternal (internalMutation) écrit l'état "paid"
//     en production via webhook

import { query, mutation, internalMutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

const INVOICE_STATUS = v.union(
  v.literal("draft"),
  v.literal("issued"),
  v.literal("paid"),
  v.literal("cancelled"),
);

type InvoiceStatus = "draft" | "issued" | "paid" | "cancelled";

const MAX_LIMIT = 100;
const MAX_INVOICES_PER_YEAR = 9999;

// ISO 4217 — liste blanche des devises supportées.
// On n'accepte pas n'importe quel code à 3 lettres : il faut qu'il soit
// dans cette liste. Ajouter une devise = une décision explicite.
const SUPPORTED_CURRENCIES = new Set([
  "CDF", // Franc congolais (devise de référence RDC)
  "USD", // Dollar américain
  "EUR", // Euro
  "XAF", // Franc CFA Afrique centrale
  "XOF", // Franc CFA Afrique de l'Ouest
  "GBP", // Livre sterling
  "ZAR", // Rand sud-africain
  "KES", // Shilling kényan
  "NGN", // Naira nigérian
]);

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

function isAdmin(user: Doc<"users">): boolean {
  return user.isAdmin === true || user.roles?.includes("admin") === true;
}

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

function clampLimit(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(Math.floor(value), MAX_LIMIT);
}

function validateAmount(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ConvexError({
      code: "INVALID_AMOUNT",
      message: "Le montant doit être strictement positif.",
    });
  }
  return value;
}

function validateCurrency(raw: string): string {
  const c = raw.trim().toUpperCase();
  if (!SUPPORTED_CURRENCIES.has(c)) {
    throw new ConvexError({
      code: "INVALID_CURRENCY",
      message: `Devise non supportée : "${c}". Devises acceptées : ${[...SUPPORTED_CURRENCIES].join(", ")}.`,
    });
  }
  return c;
}

async function logHistory(
  ctx: MutationCtx,
  providerId: Id<"serviceProviders">,
  event: string,
  actorId: Id<"users"> | null,
  bookingId?: Id<"serviceBookings">,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await ctx.db.insert("serviceHistory", {
    providerId,
    event,
    actorId: actorId ?? undefined,
    bookingId,
    type: event,
    metadata,
    createdAt: Date.now(),
  });
}

// ────────────────────────────────────────────────────────────────
// NUMÉROTATION — compteur persistant
// ────────────────────────────────────────────────────────────────

/**
 * Numérotation atomique par compteur persistant.
 *
 * Sous OCC Convex, `patch` sur un document est atomique : deux appels
 * concurrents se retentent automatiquement et incrémentent proprement.
 *
 * Format : INV-YYYY-NNNN
 */
async function nextInvoiceNumber(ctx: MutationCtx): Promise<string> {
  const year = new Date().getUTCFullYear();

  const existing = await ctx.db
    .query("serviceInvoiceCounters")
    .withIndex("by_year", (q) => q.eq("year", year))
    .unique();

  let nextSeq: number;

  if (existing) {
    nextSeq = existing.seq + 1;
    if (nextSeq > MAX_INVOICES_PER_YEAR) {
      throw new ConvexError({
        code: "INVOICE_NUMBER_OVERFLOW",
        message: `Limite annuelle atteinte (${MAX_INVOICES_PER_YEAR}).`,
      });
    }
    await ctx.db.patch(existing._id, { seq: nextSeq });
  } else {
    nextSeq = 1;
    await ctx.db.insert("serviceInvoiceCounters", { year, seq: 1 });
  }

  return `INV-${year}-${String(nextSeq).padStart(4, "0")}`;
}

// ────────────────────────────────────────────────────────────────
// CHARGEMENT — lecture vs écriture
// ────────────────────────────────────────────────────────────────

type InvoiceParty = {
  isClient: boolean;
  isProvider: boolean;
  isAdmin: boolean;
};

async function getInvoiceParty(
  ctx: Ctx,
  invoice: Doc<"serviceInvoices">,
  user: Doc<"users">,
): Promise<InvoiceParty> {
  const isClient = invoice.userId === user._id;
  let isProvider = false;
  if (!isClient) {
    const provider = await ctx.db.get(invoice.providerId);
    if (provider && provider.userId === user._id) isProvider = true;
  }
  return { isClient, isProvider, isAdmin: isAdmin(user) };
}

async function loadReadableInvoice(
  ctx: Ctx,
  invoiceId: Id<"serviceInvoices">,
  user: Doc<"users">,
): Promise<Doc<"serviceInvoices">> {
  const invoice = await ctx.db.get(invoiceId);
  if (!invoice) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Facture introuvable",
    });
  }

  const {
    isClient,
    isProvider,
    isAdmin: admin,
  } = await getInvoiceParty(ctx, invoice, user);

  if (!isClient && !isProvider && !admin) {
    throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé." });
  }

  return invoice;
}

async function loadWritableInvoice(
  ctx: Ctx,
  invoiceId: Id<"serviceInvoices">,
  user: Doc<"users">,
): Promise<Doc<"serviceInvoices">> {
  const invoice = await ctx.db.get(invoiceId);
  if (!invoice) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Facture introuvable",
    });
  }

  const { isClient, isProvider } = await getInvoiceParty(ctx, invoice, user);

  if (!isClient && !isProvider) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Seules les parties de la facture peuvent la modifier.",
    });
  }

  return invoice;
}

// ────────────────────────────────────────────────────────────────
// CRÉATION
// ────────────────────────────────────────────────────────────────

export const createInvoice = mutation({
  args: {
    bookingId: v.id("serviceBookings"),
    amount: v.number(),
    currency: v.string(),
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

    const provider = await ctx.db.get(booking.providerId);
    if (!provider) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Prestataire introuvable",
      });
    }

    const isClient = booking.userId === user._id;
    const isProvider = provider.userId === user._id;
    if (!isClient && !isProvider) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message:
          "Seules les parties de la réservation peuvent créer la facture.",
      });
    }

    const existing = await ctx.db
      .query("serviceInvoices")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .first();

    if (existing) {
      throw new ConvexError({
        code: "INVOICE_EXISTS",
        message: "Une facture existe déjà pour cette réservation.",
      });
    }

    const amount = validateAmount(args.amount);
    const currency = validateCurrency(args.currency);

    // Si la réservation a montant ET devise → correspondance EXACTE obligatoire.
    // Si elle n'a ni l'un ni l'autre → pas de contrainte.
    // Si elle n'a qu'un seul des deux → refuse (données booking incohérentes).
    const bookingHasAmount = booking.totalAmount !== undefined;
    const bookingHasCurrency = booking.currency !== undefined;

    if (bookingHasAmount !== bookingHasCurrency) {
      throw new ConvexError({
        code: "BOOKING_AMOUNT_INCOMPLETE",
        message:
          "La réservation ne définit pas à la fois un montant et une devise. Facture refusée pour éviter une incohérence.",
      });
    }

    if (bookingHasAmount && bookingHasCurrency) {
      if (booking.currency !== currency) {
        throw new ConvexError({
          code: "CURRENCY_MISMATCH",
          message: `La devise (${currency}) ne correspond pas à celle de la réservation (${booking.currency}).`,
        });
      }
      if (booking.totalAmount !== amount) {
        throw new ConvexError({
          code: "AMOUNT_MISMATCH",
          message: `Le montant (${amount}) ne correspond pas à celui de la réservation (${booking.totalAmount}).`,
        });
      }
    }

    const number = await nextInvoiceNumber(ctx);
    const now = Date.now();

    const invoiceId = await ctx.db.insert("serviceInvoices", {
      bookingId: args.bookingId,
      providerId: booking.providerId,
      userId: booking.userId,
      number,
      amount,
      currency,
      status: "draft",
      createdAt: now,
      // issuedAt reste indéfini jusqu'à issueInvoice
    });

    await logHistory(
      ctx,
      booking.providerId,
      "invoice.created",
      user._id,
      args.bookingId,
      { number, amount, currency },
    );

    return { invoiceId, number, status: "draft" as const };
  },
});

// ────────────────────────────────────────────────────────────────
// TRANSITIONS PUBLIQUES
// ────────────────────────────────────────────────────────────────

export const issueInvoice = mutation({
  args: { invoiceId: v.id("serviceInvoices") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const invoice = await loadWritableInvoice(ctx, args.invoiceId, user);

    if (invoice.status !== "draft") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Émission impossible depuis le statut "${invoice.status}".`,
      });
    }

    await ctx.db.patch(args.invoiceId, {
      status: "issued",
      issuedAt: Date.now(),
    });

    await logHistory(
      ctx,
      invoice.providerId,
      "invoice.issued",
      user._id,
      invoice.bookingId,
      { number: invoice.number },
    );

    return { success: true, status: "issued" as const };
  },
});

export const cancelInvoice = mutation({
  args: {
    invoiceId: v.id("serviceInvoices"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const invoice = await loadWritableInvoice(ctx, args.invoiceId, user);

    if (invoice.status === "paid") {
      throw new ConvexError({
        code: "IMMUTABLE",
        message: "Une facture payée ne peut pas être annulée.",
      });
    }
    if (invoice.status === "cancelled") {
      return { success: true, alreadyCancelled: true };
    }

    const reason = args.reason?.trim();
    if (reason !== undefined && reason.length > 500) {
      throw new ConvexError({
        code: "INVALID_REASON",
        message: "Motif trop long (max 500 caractères).",
      });
    }

    await ctx.db.patch(args.invoiceId, { status: "cancelled" });

    await logHistory(
      ctx,
      invoice.providerId,
      "invoice.cancelled",
      user._id,
      invoice.bookingId,
      reason ? { number: invoice.number, reason } : { number: invoice.number },
    );

    return { success: true, status: "cancelled" as const };
  },
});

// ────────────────────────────────────────────────────────────────
// MARQUAGE PAYÉ — version publique (dev / test manuel uniquement)
// ────────────────────────────────────────────────────────────────
//
// ATTENTION : cette mutation permet à un client/prestataire de marquer
// une facture payée s'il fournit un paymentIntentId dont le status est
// déjà "succeeded" et dont la référence concorde. En production, le
// marquage doit se faire via `markInvoicePaidInternal` appelée par un
// webhook Payment Core vérifié. Cette version publique reste utile en
// dev/test et pour les providers qui confirment en direct.

export const markInvoicePaid = mutation({
  args: {
    invoiceId: v.id("serviceInvoices"),
    paymentIntentId: v.id("paymentIntents"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const invoice = await loadWritableInvoice(ctx, args.invoiceId, user);

    return applyPayment(ctx, invoice, args.paymentIntentId, user._id);
  },
});

// ────────────────────────────────────────────────────────────────
// MARQUAGE PAYÉ — version internal (production)
// ────────────────────────────────────────────────────────────────

export const markInvoicePaidInternal = internalMutation({
  args: {
    invoiceId: v.id("serviceInvoices"),
    paymentIntentId: v.id("paymentIntents"),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Facture introuvable",
      });
    }

    return applyPayment(ctx, invoice, args.paymentIntentId, null);
  },
});

// ────────────────────────────────────────────────────────────────
// LOGIQUE COMMUNE — application d'un paiement vérifié
// ────────────────────────────────────────────────────────────────

async function applyPayment(
  ctx: MutationCtx,
  invoice: Doc<"serviceInvoices">,
  paymentIntentId: Id<"paymentIntents">,
  actorId: Id<"users"> | null,
): Promise<{ success: true; alreadyPaid?: boolean; status: "paid" }> {
  if (invoice.status === "paid") {
    return { success: true, alreadyPaid: true, status: "paid" };
  }
  if (invoice.status !== "issued") {
    throw new ConvexError({
      code: "INVALID_STATE",
      message: `Paiement impossible depuis le statut "${invoice.status}".`,
    });
  }

  const intent = await ctx.db.get(paymentIntentId);
  if (!intent) {
    throw new ConvexError({
      code: "INTENT_NOT_FOUND",
      message: "PaymentIntent introuvable.",
    });
  }

  // Le payment intent doit référencer cette facture
  if (intent.referenceId !== invoice._id) {
    throw new ConvexError({
      code: "INTENT_MISMATCH",
      message: "Le payment intent ne correspond pas à cette facture.",
    });
  }

  if (intent.status !== "succeeded") {
    throw new ConvexError({
      code: "INTENT_NOT_SUCCEEDED",
      message: `Le paiement n'est pas confirmé (statut : ${intent.status}).`,
    });
  }

  if (
    intent.amount !== invoice.amount ||
    intent.currency !== invoice.currency
  ) {
    throw new ConvexError({
      code: "INTENT_AMOUNT_MISMATCH",
      message:
        "Le montant ou la devise du payment intent ne correspond pas à la facture.",
    });
  }

  const now = Date.now();
  await ctx.db.patch(invoice._id, { status: "paid", paidAt: now });

  await logHistory(
    ctx,
    invoice.providerId,
    "invoice.paid",
    actorId,
    invoice.bookingId,
    { number: invoice.number, intentId: paymentIntentId },
  );

  return { success: true, status: "paid" };
}

// ────────────────────────────────────────────────────────────────
// LECTURE
// ────────────────────────────────────────────────────────────────

export const getInvoiceById = query({
  args: { invoiceId: v.id("serviceInvoices") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const invoice = await loadReadableInvoice(ctx, args.invoiceId, user);

    const provider = await ctx.db.get(invoice.providerId);
    const client = await ctx.db.get(invoice.userId);

    return {
      ...invoice,
      provider: provider
        ? {
            _id: provider._id,
            name: provider.name,
            imageUrl: provider.imageUrl,
          }
        : null,
      client: client
        ? { _id: client._id, name: client.name, avatar: client.avatar }
        : null,
    };
  },
});

export const getInvoiceByBooking = query({
  args: { bookingId: v.id("serviceBookings") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return null;

    const provider = await ctx.db.get(booking.providerId);
    if (!provider) return null;

    const isClient = booking.userId === user._id;
    const isProvider = provider.userId === user._id;
    if (!isClient && !isProvider && !isAdmin(user)) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé." });
    }

    return ctx.db
      .query("serviceInvoices")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .first();
  },
});

export const listMyInvoices = query({
  args: {
    status: v.optional(INVOICE_STATUS),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) return [];
    const limit = clampLimit(args.limit, 50);

    const invoices = await ctx.db
      .query("serviceInvoices")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    const filtered = args.status
      ? invoices.filter((i) => i.status === (args.status as InvoiceStatus))
      : invoices;

    return Promise.all(
      filtered.map(async (i) => {
        const provider = await ctx.db.get(i.providerId);
        return {
          ...i,
          provider: provider
            ? {
                _id: provider._id,
                name: provider.name,
                imageUrl: provider.imageUrl,
              }
            : null,
        };
      }),
    );
  },
});

export const listProviderInvoices = query({
  args: {
    providerId: v.id("serviceProviders"),
    status: v.optional(INVOICE_STATUS),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const provider = await ctx.db.get(args.providerId);
    if (!provider) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Prestataire introuvable",
      });
    }

    const isOwner = provider.userId === user._id;
    if (!isOwner && !isAdmin(user)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'êtes pas autorisé à consulter ces factures.",
      });
    }

    const limit = clampLimit(args.limit, 50);

    // Index by_provider → O(log n), pas de filtre post-query
    const invoices = await ctx.db
      .query("serviceInvoices")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .order("desc")
      .take(limit);

    const filtered = args.status
      ? invoices.filter((i) => i.status === (args.status as InvoiceStatus))
      : invoices;

    return Promise.all(
      filtered.map(async (i) => {
        const client = await ctx.db.get(i.userId);
        return {
          ...i,
          client: client
            ? { _id: client._id, name: client.name, avatar: client.avatar }
            : null,
        };
      }),
    );
  },
});
