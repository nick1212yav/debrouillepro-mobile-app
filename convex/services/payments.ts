// convex/services/payments.ts
//
// Backend Services V1 — pont vers Payment Core.
//
// NE duplique PAS le Payment Core :
//   - création   → ctx.runMutation(api.payments.createPaymentIntent)
//   - confirmation → internal.services.invoices.markInvoicePaidInternal
//
// Règles :
//   - seul le CLIENT de la facture peut initier un paiement
//   - la facture doit être en statut "issued"
//   - idempotence par tentative : `invoice-<id>-attempt-<n>`
//   - aucun `as any`
//
// NOTE TYPAGE : les handlers qui utilisent `api.*` ou `internal.*` sont
// annotés explicitement pour casser la circularité d'inférence entre ce
// fichier et `_generated/api.d.ts`.
//
// DETTE DOCUMENTÉE : `cancelInvoicePayment` patche directement
// `paymentIntents.status` faute d'un endpoint de cancel exposé par le
// Payment Core. À remplacer par une délégation quand le Payment Core
// exposera `cancelPaymentIntent`.

import { query, mutation, internalMutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { api, internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

const PAYMENT_PROVIDER = v.union(
  v.literal("orange_money"),
  v.literal("mpesa"),
  v.literal("airtel_money"),
  v.literal("mtn_momo"),
  v.literal("stripe"),
);

const TERMINAL_INTENT_STATUSES = new Set<string>([
  "succeeded",
  "failed",
  "cancelled",
  "expired",
]);

const MAX_LIMIT = 100;

// ────────────────────────────────────────────────────────────────
// TYPES DE RETOUR — annotation explicite pour couper la circularité
// ────────────────────────────────────────────────────────────────

type InitiatePaymentResult = {
  paymentIntentId: Id<"paymentIntents">;
  status: string;
  reused: boolean;
  attempt: number | null;
};

type CreateIntentCoreResult = {
  paymentIntentId: Id<"paymentIntents">;
  status: string;
  reused?: boolean;
};

type MarkPaidResult = {
  success: true;
  alreadyPaid?: boolean;
  status: "paid";
};

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

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

function clampLimit(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(Math.floor(value), MAX_LIMIT);
}

async function loadAccessibleInvoice(
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

  const isClient = invoice.userId === user._id;
  let isProvider = false;
  if (!isClient) {
    const provider = await ctx.db.get(invoice.providerId);
    if (provider && provider.userId === user._id) isProvider = true;
  }
  const isAdmin = user.isAdmin === true || user.roles?.includes("admin");

  if (!isClient && !isProvider && !isAdmin) {
    throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé." });
  }

  return invoice;
}

async function findLatestIntentForInvoice(
  ctx: Ctx,
  invoiceId: Id<"serviceInvoices">,
): Promise<Doc<"paymentIntents"> | null> {
  return ctx.db
    .query("paymentIntents")
    .withIndex("by_reference", (q) => q.eq("referenceId", invoiceId))
    .order("desc")
    .first();
}

async function countAttemptsForInvoice(
  ctx: Ctx,
  invoiceId: Id<"serviceInvoices">,
): Promise<number> {
  const intents = await ctx.db
    .query("paymentIntents")
    .withIndex("by_reference", (q) => q.eq("referenceId", invoiceId))
    .collect();
  return intents.length;
}

function isConvexIdFormat(value: string): boolean {
  if (value.length === 0) return false;
  if (value.startsWith("http://") || value.startsWith("https://")) return false;
  return /^[a-z0-9]{20,40}$/.test(value);
}

// ────────────────────────────────────────────────────────────────
// INITIATION — client uniquement
// ────────────────────────────────────────────────────────────────

export const initiateInvoicePayment = mutation({
  args: {
    invoiceId: v.id("serviceInvoices"),
    provider: PAYMENT_PROVIDER,
    customerReference: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<InitiatePaymentResult> => {
    const user = await requireUser(ctx);

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Facture introuvable",
      });
    }

    if (invoice.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Seul le client de la facture peut initier son paiement.",
      });
    }

    if (invoice.status !== "issued") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Initiation impossible depuis le statut "${invoice.status}". La facture doit être émise.`,
      });
    }

    // Intent non-terminal existant → réutilisé
    const existing = await findLatestIntentForInvoice(ctx, args.invoiceId);
    if (existing && !TERMINAL_INTENT_STATUSES.has(existing.status)) {
      return {
        paymentIntentId: existing._id,
        status: existing.status,
        reused: true,
        attempt: null,
      };
    }

    // Nouvelle tentative : idempotencyKey unique par tentative
    const previousAttempts = await countAttemptsForInvoice(ctx, args.invoiceId);
    const attemptNumber = previousAttempts + 1;
    const idempotencyKey = `invoice-${args.invoiceId}-attempt-${attemptNumber}`;

    // Délégation au Payment Core — annotation explicite du retour
    const result: CreateIntentCoreResult = await ctx.runMutation(
      api.payments.createPaymentIntent,
      {
        type: "merchant_payment",
        amount: invoice.amount,
        currency: invoice.currency,
        provider: args.provider,
        idempotencyKey,
        referenceId: args.invoiceId,
        customerReference: args.customerReference,
      },
    );

    await ctx.db.insert("serviceHistory", {
      providerId: invoice.providerId,
      event: "invoice.payment_initiated",
      actorId: user._id,
      bookingId: invoice.bookingId,
      type: "invoice.payment_initiated",
      metadata: {
        invoiceNumber: invoice.number,
        paymentIntentId: result.paymentIntentId,
        provider: args.provider,
        amount: invoice.amount,
        currency: invoice.currency,
        attempt: attemptNumber,
      },
      createdAt: Date.now(),
    });

    return {
      paymentIntentId: result.paymentIntentId,
      status: result.status,
      reused: false,
      attempt: attemptNumber,
    };
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE — état du paiement
// ────────────────────────────────────────────────────────────────

export const getInvoicePayment = query({
  args: { invoiceId: v.id("serviceInvoices") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const invoice = await loadAccessibleInvoice(ctx, args.invoiceId, user);

    const intent = await findLatestIntentForInvoice(ctx, args.invoiceId);
    if (!intent) {
      return {
        invoiceId: invoice._id,
        invoiceNumber: invoice.number,
        invoiceStatus: invoice.status,
        intent: null,
      };
    }

    return {
      invoiceId: invoice._id,
      invoiceNumber: invoice.number,
      invoiceStatus: invoice.status,
      intent: {
        _id: intent._id,
        status: intent.status,
        amount: intent.amount,
        currency: intent.currency,
        provider: intent.provider,
        createdAt: intent.createdAt,
        updatedAt: intent.updatedAt,
        succeededAt: intent.succeededAt,
        failedAt: intent.failedAt,
        expiresAt: intent.expiresAt,
        failureCode: intent.failureCode,
        failureMessage: intent.failureMessage,
        nextAction: intent.nextAction,
      },
    };
  },
});

// ────────────────────────────────────────────────────────────────
// ANNULATION — dette documentée
// ────────────────────────────────────────────────────────────────

export const cancelInvoicePayment = mutation({
  args: {
    invoiceId: v.id("serviceInvoices"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Facture introuvable",
      });
    }

    if (invoice.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Seul le client peut annuler son propre paiement.",
      });
    }

    const intent = await findLatestIntentForInvoice(ctx, args.invoiceId);
    if (!intent) {
      throw new ConvexError({
        code: "NO_INTENT",
        message: "Aucun paiement à annuler pour cette facture.",
      });
    }

    if (intent.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Ce payment intent ne vous appartient pas.",
      });
    }

    if (intent.status === "succeeded") {
      throw new ConvexError({
        code: "IMMUTABLE",
        message: "Un paiement confirmé ne peut pas être annulé.",
      });
    }

    if (intent.status === "cancelled") {
      return { success: true, alreadyCancelled: true, status: "cancelled" };
    }

    if (intent.status === "failed" || intent.status === "expired") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Annulation impossible depuis le statut "${intent.status}".`,
      });
    }

    const now = Date.now();
    await ctx.db.patch(intent._id, {
      status: "cancelled",
      failureCode: "USER_CANCELLED",
      failureMessage: args.reason?.trim() || "Annulé par l'utilisateur",
      updatedAt: now,
    });

    await ctx.db.insert("serviceHistory", {
      providerId: invoice.providerId,
      event: "invoice.payment_cancelled",
      actorId: user._id,
      bookingId: invoice.bookingId,
      type: "invoice.payment_cancelled",
      metadata: {
        invoiceNumber: invoice.number,
        paymentIntentId: intent._id,
        reason: args.reason,
        note: "Direct patch — Payment Core cancel delegation pending",
      },
      createdAt: now,
    });

    return {
      success: true,
      alreadyCancelled: false,
      status: "cancelled" as const,
    };
  },
});

// ────────────────────────────────────────────────────────────────
// CONFIRMATION — appelée par webhook Payment Core
// ────────────────────────────────────────────────────────────────

export const confirmInvoicePaymentInternal = internalMutation({
  args: {
    invoiceId: v.id("serviceInvoices"),
    paymentIntentId: v.id("paymentIntents"),
  },
  handler: async (ctx, args): Promise<MarkPaidResult> => {
    const result: MarkPaidResult = await ctx.runMutation(
      internal.services.invoices.markInvoicePaidInternal,
      {
        invoiceId: args.invoiceId,
        paymentIntentId: args.paymentIntentId,
      },
    );

    return result;
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE — mes paiements de factures
// ────────────────────────────────────────────────────────────────

type InvoicePaymentSummary = {
  intentId: Id<"paymentIntents">;
  status: string;
  amount: number;
  currency: string;
  provider: string;
  createdAt: number;
  invoice: {
    _id: Id<"serviceInvoices">;
    number: string;
    status: string;
  } | null;
};

export const listMyInvoicePayments = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<InvoicePaymentSummary[]> => {
    const user = await getUser(ctx);
    if (!user) return [];
    const limit = clampLimit(args.limit, 50);

    const intents = await ctx.db
      .query("paymentIntents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit * 3);

    const merchantIntents = intents
      .filter(
        (i) =>
          i.type === "merchant_payment" &&
          typeof i.referenceId === "string" &&
          isConvexIdFormat(i.referenceId),
      )
      .slice(0, limit);

    const summaries = await Promise.all(
      merchantIntents.map(
        async (intent): Promise<InvoicePaymentSummary | null> => {
          const refId = intent.referenceId;
          if (typeof refId !== "string") return null;

          const invoice = await ctx.db.get(refId as Id<"serviceInvoices">);

          return {
            intentId: intent._id,
            status: intent.status,
            amount: intent.amount,
            currency: intent.currency,
            provider: intent.provider,
            createdAt: intent.createdAt,
            invoice: invoice
              ? {
                  _id: invoice._id,
                  number: invoice.number,
                  status: invoice.status,
                }
              : null,
          };
        },
      ),
    );

    return summaries.filter((s): s is InvoicePaymentSummary => s !== null);
  },
});
