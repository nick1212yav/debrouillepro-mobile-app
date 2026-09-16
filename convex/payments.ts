// ============================================================================
// DÉBROUILLEPAY — PAYMENT CORE
// ============================================================================
//
// Architecture:
//
//   Client
//      │
//      ▼
//   createPaymentIntent()
//      │
//      ▼
//   paymentIntents
//      │
//      ▼
//   startPayment() [ACTION]
//      │
//      ▼
//   PaymentProvider
//      │
//      ▼
//   paymentAttempts
//      ├───────────────► Provider status
//      │
//      └───────────────► Verified webhook
//                              │
//                              ▼
//                 processVerifiedProviderEvent()
//                              │
//                              ▼
//                    finalizeProviderSuccess()
//                              │
//                              ▼
//                    walletTransactions
//
// ============================================================================
//
// RÈGLES ABSOLUES
// ============================================================================
//
// 1. Le client peut créer une INTENTION.
// 2. Le client peut demander le démarrage d'une intention.
// 3. Le client NE PEUT PAS confirmer un paiement.
// 4. Le client NE PEUT PAS créer un walletTransactions.completed.
// 5. Le client NE PEUT PAS modifier le solde.
// 6. Un provider doit fournir une référence externe réelle.
// 7. Un webhook doit être vérifié avant traitement.
// 8. Un événement provider est idempotent.
// 9. Une transaction externe ne peut créditer le ledger qu'une seule fois.
// 10. Une erreur réseau ne devient jamais automatiquement un "failed".
// 11. Aucun faux providerTransactionId.
// 12. Aucun faux succeeded.
// 13. Aucun faux solde.
// 14. Aucun montant provenant d'un callback ne remplace le montant de
//     l'intention sans validation stricte.
// 15. Les secrets provider restent côté serveur.
//
// ============================================================================

import { v, ConvexError } from "convex/values";

import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type ActionCtx,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";

import type { Doc, Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";

import {
  validateProviderResponse,
  type PaymentOperation,
  type PaymentProviderName,
} from "./providers/payment_provider";

import { OrangeMoneyProvider } from "./providers/orange_money";
import { MpesaProvider } from "./providers/mpesa";
import { AirtelMoneyProvider } from "./providers/airtel_money";
import { MtnMomoProvider } from "./providers/mtn_momo";

// ============================================================================
// CONSTANTES
// ============================================================================

const MAX_PAYMENT_INTENTS = 50;
const MAX_PAYMENT_ATTEMPTS = 20;

const MIN_IDEMPOTENCY_KEY_LENGTH = 16;
const MAX_IDEMPOTENCY_KEY_LENGTH = 200;

const MAX_REFERENCE_LENGTH = 200;

// ============================================================================
// TYPES
// ============================================================================

type Provider = "orange_money" | "mpesa" | "airtel_money" | "mtn_momo";

type PaymentType =
  | "wallet_topup"
  | "wallet_withdrawal"
  | "merchant_payment"
  | "peer_transfer"
  | "refund";

type PaymentDirection = "inbound" | "outbound";

type PaymentEventType =
  | "payment_pending"
  | "payment_processing"
  | "payment_succeeded"
  | "payment_failed"
  | "payment_cancelled"
  | "payment_reversed"
  | "unknown";

/**
 * Résultat explicitement typé de la préparation d'une tentative.
 *
 * L'annotation est volontaire :
 * elle empêche TypeScript de tenter d'inférer récursivement le type
 * de startPayment -> internal.payments -> startPayment.
 */
type PreparePaymentAttemptResult = {
  reused: boolean;
  paymentAttemptId: Id<"paymentAttempts">;
  attemptStatus: string;
  intentStatus: string;
  providerTransactionId?: string;
};

/**
 * Résultat explicite de la finalisation comptable.
 */
type FinalizeProviderSuccessResult = {
  ledgerTransactionId: Id<"walletTransactions">;
  alreadyFinalized: boolean;
};

/**
 * Contrat de sortie de l'action startPayment.
 *
 * Le type explicite casse volontairement la chaîne d'inférence circulaire
 * entre l'action et les références générées `api` / `internal`.
 */
type StartPaymentResult = {
  paymentIntentId: Id<"paymentIntents">;
  paymentAttemptId?: Id<"paymentAttempts">;
  status: string;
  attemptStatus?: string;
  providerTransactionId?: string;
  reused?: boolean;
  requiresCustomerAction?: boolean;
  nextAction?: unknown;
  ledgerTransactionId?: Id<"walletTransactions">;
};

// ============================================================================
// PROVIDER FACTORY
// ============================================================================

function createProvider(
  provider: Provider,
): OrangeMoneyProvider | MpesaProvider | AirtelMoneyProvider | MtnMomoProvider {
  switch (provider) {
    case "orange_money":
      return new OrangeMoneyProvider();

    case "mpesa":
      return new MpesaProvider();

    case "airtel_money":
      return new AirtelMoneyProvider();

    case "mtn_momo":
      return new MtnMomoProvider();
  }
}

// ============================================================================
// AUTHENTIFICATION
// ============================================================================

/**
 * Helper d'authentification partagé par les queries et mutations.
 *
 * IMPORTANT :
 * `QueryCtx | MutationCtx` est intentionnel.
 *
 * Le helper ne dépend d'aucune opération exclusive aux mutations.
 * Il peut donc être utilisé correctement depuis :
 *
 *   - query()
 *   - mutation()
 *
 * sans forcer un QueryCtx à être casté en MutationCtx.
 */
async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Non authentifié.",
    });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Utilisateur introuvable.",
    });
  }

  return user;
}

// ============================================================================
// VALIDATION
// ============================================================================

function assertPositiveAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ConvexError({
      code: "INVALID_AMOUNT",
      message: "Le montant doit être strictement supérieur à zéro.",
    });
  }
}

function assertSafeAmount(amount: number): void {
  assertPositiveAmount(amount);

  if (!Number.isSafeInteger(Math.round(amount * 100))) {
    throw new ConvexError({
      code: "INVALID_AMOUNT_PRECISION",
      message: "Le montant possède une précision monétaire non supportée.",
    });
  }
}

function normalizeCurrency(currency: string): string {
  const normalized = currency.trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new ConvexError({
      code: "INVALID_CURRENCY",
      message: "La devise doit être un code ISO 4217 à trois lettres.",
    });
  }

  return normalized;
}

function normalizeIdempotencyKey(key: string): string {
  const normalized = key.trim();

  if (
    normalized.length < MIN_IDEMPOTENCY_KEY_LENGTH ||
    normalized.length > MAX_IDEMPOTENCY_KEY_LENGTH
  ) {
    throw new ConvexError({
      code: "INVALID_IDEMPOTENCY_KEY",
      message:
        `La clé d'idempotence doit contenir entre ` +
        `${MIN_IDEMPOTENCY_KEY_LENGTH} et ` +
        `${MAX_IDEMPOTENCY_KEY_LENGTH} caractères.`,
    });
  }

  return normalized;
}

function normalizeOptionalString(
  value: string | undefined,
  field: string,
  maxLength: number,
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalized = value.trim();

  if (!normalized) {
    return undefined;
  }

  if (normalized.length > maxLength) {
    throw new ConvexError({
      code: "INVALID_INPUT",
      message: `${field} dépasse la longueur maximale autorisée.`,
    });
  }

  return normalized;
}

// ============================================================================
// PAYMENT DIRECTION
// ============================================================================

function getDirection(type: PaymentType): PaymentDirection {
  switch (type) {
    case "wallet_topup":
    case "refund":
      return "inbound";

    case "wallet_withdrawal":
    case "merchant_payment":
    case "peer_transfer":
      return "outbound";
  }
}

// ============================================================================
// LEDGER TYPE
// ============================================================================
//
// Le schema walletTransactions utilise:
//
//   deposit
//   withdrawal
//   transfer
//   payment
//   refund
//   reward
//
// Le Payment Core utilise uniquement ces valeurs réelles.
//
// ============================================================================

function getLedgerType(
  type: PaymentType,
): "deposit" | "withdrawal" | "transfer" | "payment" | "refund" {
  switch (type) {
    case "wallet_topup":
      return "deposit";

    case "wallet_withdrawal":
      return "withdrawal";

    case "merchant_payment":
      return "payment";

    case "peer_transfer":
      return "transfer";

    case "refund":
      return "refund";
  }
}

// ============================================================================
// LEDGER DESCRIPTION
// ============================================================================

function getLedgerDescription(type: PaymentType): string {
  switch (type) {
    case "wallet_topup":
      return "Crédit DébrouillePay";

    case "wallet_withdrawal":
      return "Retrait DébrouillePay";

    case "merchant_payment":
      return "Paiement marchand DébrouillePay";

    case "peer_transfer":
      return "Transfert DébrouillePay";

    case "refund":
      return "Remboursement DébrouillePay";
  }
}

// ============================================================================
// PROVIDER CAPABILITY
// ============================================================================

function assertProviderCapability(
  provider: Provider,
  direction: PaymentDirection,
  supportsInbound: boolean,
  supportsOutbound: boolean,
): void {
  if (direction === "inbound" && !supportsInbound) {
    throw new ConvexError({
      code: "PROVIDER_OPERATION_UNSUPPORTED",
      message: `Le provider ${provider} ne supporte pas les encaissements.`,
    });
  }

  if (direction === "outbound" && !supportsOutbound) {
    throw new ConvexError({
      code: "PROVIDER_OPERATION_UNSUPPORTED",
      message: `Le provider ${provider} ne supporte pas les décaissements.`,
    });
  }
}

// ============================================================================
// CREATE PAYMENT INTENT
// ============================================================================
//
// Cette mutation:
//
//   authentifie l'utilisateur
//   valide le montant
//   valide la devise
//   valide la clé d'idempotence
//   protège contre le conflit d'idempotence
//   crée uniquement une intention
//
// Elle ne:
//
//   contacte aucun provider
//   crédite le wallet
//   débite le wallet
//   crée de transaction completed
//
// ============================================================================

export const createPaymentIntent = mutation({
  args: {
    type: v.union(
      v.literal("wallet_topup"),
      v.literal("wallet_withdrawal"),
      v.literal("merchant_payment"),
      v.literal("peer_transfer"),
      v.literal("refund"),
    ),

    amount: v.number(),

    currency: v.string(),

    provider: v.union(
      v.literal("orange_money"),
      v.literal("mpesa"),
      v.literal("airtel_money"),
      v.literal("mtn_momo"),
    ),

    idempotencyKey: v.string(),

    customerReference: v.optional(v.string()),

    referenceId: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    assertSafeAmount(args.amount);

    const currency = normalizeCurrency(args.currency);

    const idempotencyKey = normalizeIdempotencyKey(args.idempotencyKey);

    const customerReference = normalizeOptionalString(
      args.customerReference,
      "customerReference",
      MAX_REFERENCE_LENGTH,
    );

    const referenceId = normalizeOptionalString(
      args.referenceId,
      "referenceId",
      MAX_REFERENCE_LENGTH,
    );

    // ----------------------------------------------------------------------
    // IDEMPOTENCE
    // ----------------------------------------------------------------------

    const existing = await ctx.db
      .query("paymentIntents")
      .withIndex("by_idempotency", (q) =>
        q.eq("idempotencyKey", idempotencyKey),
      )
      .first();

    if (existing) {
      if (existing.userId !== user._id) {
        throw new ConvexError({
          code: "IDEMPOTENCY_KEY_CONFLICT",
          message: "Cette clé d'idempotence est déjà utilisée.",
        });
      }

      if (
        existing.amount !== args.amount ||
        existing.currency !== currency ||
        existing.provider !== args.provider ||
        existing.type !== args.type
      ) {
        throw new ConvexError({
          code: "IDEMPOTENCY_PAYLOAD_MISMATCH",
          message:
            "La clé d'idempotence existe déjà avec des paramètres différents.",
        });
      }

      return {
        paymentIntentId: existing._id,
        status: existing.status,
        reused: true,
      };
    }

    // ----------------------------------------------------------------------
    // CRÉATION
    // ----------------------------------------------------------------------

    const now = Date.now();

    const paymentIntentId = await ctx.db.insert("paymentIntents", {
      userId: user._id,

      type: args.type,

      direction: getDirection(args.type),

      amount: args.amount,

      currency,

      provider: args.provider,

      customerReference,

      referenceId,

      idempotencyKey,

      status: "created",

      createdAt: now,

      updatedAt: now,
    });

    return {
      paymentIntentId,

      status: "created",

      reused: false,
    };
  },
});

// ============================================================================
// START PAYMENT
// ============================================================================
//
// ACTION:
//
//   peut appeler le provider externe.
//
// IMPORTANT:
//
//   l'action ne touche jamais directement walletTransactions.
//
// ============================================================================

export const startPayment = action({
  args: {
    paymentIntentId: v.id("paymentIntents"),
  },

  handler: async (
    ctx: ActionCtx,
    args: {
      paymentIntentId: Id<"paymentIntents">;
    },
  ): Promise<StartPaymentResult> => {
    // ----------------------------------------------------------------------
    // RÉCUPÉRATION DE L'INTENT
    // ----------------------------------------------------------------------

    const intent: Doc<"paymentIntents"> | null = await ctx.runQuery(
      api.payments.getPaymentIntent,
      {
        paymentIntentId: args.paymentIntentId,
      },
    );

    if (!intent) {
      throw new ConvexError({
        code: "PAYMENT_INTENT_NOT_FOUND",
        message: "Payment Intent introuvable.",
      });
    }

    // ----------------------------------------------------------------------
    // TERMINAUX
    // ----------------------------------------------------------------------

    if (intent.status === "succeeded") {
      return {
        paymentIntentId: intent._id,
        status: "succeeded",
        reused: true,
      };
    }

    if (intent.status === "cancelled" || intent.status === "expired") {
      throw new ConvexError({
        code: "PAYMENT_NOT_STARTABLE",
        message: "Ce paiement ne peut plus être démarré.",
      });
    }

    // ----------------------------------------------------------------------
    // PROVIDER
    // ----------------------------------------------------------------------

    const provider = createProvider(intent.provider);

    const configuration = await provider.getConfiguration();

    if (!configuration.configured) {
      throw new ConvexError({
        code: "PROVIDER_NOT_CONFIGURED",
        message:
          `Le provider ${intent.provider} n'est pas configuré ` +
          `côté serveur. Aucun mouvement financier n'a été effectué.`,
        paymentIntentId: intent._id,
      });
    }

    const capabilities = configuration.capabilities;

    if (!capabilities) {
      throw new ConvexError({
        code: "PROVIDER_CAPABILITIES_UNAVAILABLE",
        message: "Les capacités du provider ne sont pas disponibles.",
      });
    }

    assertProviderCapability(
      intent.provider,
      intent.direction,
      capabilities.supportsInbound,
      capabilities.supportsOutbound,
    );

    // ----------------------------------------------------------------------
    // CRÉATION ATOMIQUE DE LA TENTATIVE
    // ----------------------------------------------------------------------

    const prepared: PreparePaymentAttemptResult = await ctx.runMutation(
      internal.payments.preparePaymentAttempt,
      {
        paymentIntentId: intent._id,
      },
    );

    if (prepared.reused) {
      return {
        paymentIntentId: intent._id,
        paymentAttemptId: prepared.paymentAttemptId,
        status: prepared.intentStatus,
        attemptStatus: prepared.attemptStatus,
        providerTransactionId: prepared.providerTransactionId,
        reused: true,
      };
    }

    // ----------------------------------------------------------------------
    // APPEL RÉEL DU PROVIDER
    // ----------------------------------------------------------------------

    try {
      const response = await provider.createPayment({
        paymentIntentId: intent._id,

        paymentAttemptId: prepared.paymentAttemptId,

        operation: intent.type as PaymentOperation,

        direction: intent.direction,

        amount: intent.amount,

        currency: intent.currency,

        customerReference: intent.customerReference,

        referenceId: intent.referenceId,

        idempotencyKey: intent.idempotencyKey,

        description: "DébrouillePay",
      });

      const validated = validateProviderResponse(
        intent.provider as PaymentProviderName,
        response,
      );

      // --------------------------------------------------------------------
      // PROCESSING / PENDING
      // --------------------------------------------------------------------

      if (validated.state === "processing" || validated.state === "pending") {
        if (!validated.providerTransactionId) {
          await ctx.runMutation(internal.payments.markAttemptFailed, {
            paymentAttemptId: prepared.paymentAttemptId,

            errorCode: "PROVIDER_INVALID_RESPONSE",

            errorMessage:
              "Le provider a accepté la demande sans fournir de référence externe.",
          });

          throw new ConvexError({
            code: "PROVIDER_INVALID_RESPONSE",
            message: "Le provider n'a pas fourni de référence de transaction.",
          });
        }

        await ctx.runMutation(internal.payments.markAttemptSubmitted, {
          paymentAttemptId: prepared.paymentAttemptId,

          providerTransactionId: validated.providerTransactionId,

          providerReference: validated.providerReference,
        });

        return {
          paymentIntentId: intent._id,

          paymentAttemptId: prepared.paymentAttemptId,

          status: validated.state,

          providerTransactionId: validated.providerTransactionId,

          requiresCustomerAction: validated.requiresCustomerAction ?? false,

          nextAction: validated.nextAction,
        };
      }

      // --------------------------------------------------------------------
      // FAILED
      // --------------------------------------------------------------------

      if (validated.state === "failed") {
        await ctx.runMutation(internal.payments.markAttemptFailed, {
          paymentAttemptId: prepared.paymentAttemptId,

          errorCode: validated.errorCode ?? "PROVIDER_TRANSACTION_FAILED",

          errorMessage: validated.errorMessage,
        });

        return {
          paymentIntentId: intent._id,

          paymentAttemptId: prepared.paymentAttemptId,

          status: "failed",
        };
      }

      // --------------------------------------------------------------------
      // CANCELLED
      // --------------------------------------------------------------------

      if (validated.state === "cancelled") {
        await ctx.runMutation(internal.payments.markAttemptCancelled, {
          paymentAttemptId: prepared.paymentAttemptId,

          errorCode: validated.errorCode ?? "PROVIDER_CANCELLED",

          errorMessage: validated.errorMessage,
        });

        return {
          paymentIntentId: intent._id,

          paymentAttemptId: prepared.paymentAttemptId,

          status: "cancelled",
        };
      }

      // --------------------------------------------------------------------
      // REVERSED
      // --------------------------------------------------------------------

      if (validated.state === "reversed") {
        await ctx.runMutation(internal.payments.markAttemptReversed, {
          paymentAttemptId: prepared.paymentAttemptId,

          errorCode: validated.errorCode ?? "PROVIDER_REVERSED",

          errorMessage: validated.errorMessage,
        });

        return {
          paymentIntentId: intent._id,

          paymentAttemptId: prepared.paymentAttemptId,

          status: "reversed",
        };
      }

      // --------------------------------------------------------------------
      // SYNCHRONOUS SUCCESS
      // --------------------------------------------------------------------

      if (validated.state === "succeeded") {
        if (!validated.providerTransactionId) {
          await ctx.runMutation(internal.payments.markAttemptFailed, {
            paymentAttemptId: prepared.paymentAttemptId,

            errorCode: "PROVIDER_INVALID_RESPONSE",

            errorMessage: "Succès provider sans référence externe.",
          });

          throw new ConvexError({
            code: "PROVIDER_INVALID_RESPONSE",

            message:
              "Le provider a déclaré un succès sans identifiant de transaction externe.",
          });
        }

        await ctx.runMutation(internal.payments.markAttemptSubmitted, {
          paymentAttemptId: prepared.paymentAttemptId,

          providerTransactionId: validated.providerTransactionId,

          providerReference: validated.providerReference,
        });

        const finalized: FinalizeProviderSuccessResult = await ctx.runMutation(
          internal.payments.finalizeProviderSuccess,
          {
            paymentAttemptId: prepared.paymentAttemptId,

            providerTransactionId: validated.providerTransactionId,
          },
        );

        return {
          paymentIntentId: intent._id,

          paymentAttemptId: prepared.paymentAttemptId,

          status: "succeeded",

          providerTransactionId: validated.providerTransactionId,

          ledgerTransactionId: finalized.ledgerTransactionId,
        };
      }

      // --------------------------------------------------------------------
      // UNKNOWN
      // --------------------------------------------------------------------

      await ctx.runMutation(internal.payments.markAttemptFailed, {
        paymentAttemptId: prepared.paymentAttemptId,

        errorCode: "PROVIDER_INVALID_RESPONSE",

        errorMessage: "Le provider a retourné un état inconnu.",
      });

      throw new ConvexError({
        code: "PROVIDER_INVALID_RESPONSE",

        message: "Le provider a retourné un état non exploitable.",
      });
    } catch (error) {
      // --------------------------------------------------------------------
      // IMPORTANT
      // --------------------------------------------------------------------
      //
      // Une erreur réseau peut survenir APRÈS que le provider ait reçu
      // la demande.
      //
      // Nous ne transformons donc jamais automatiquement une erreur
      // réseau en "failed".
      //
      // Le Payment Core doit réconcilier le statut externe avant une
      // nouvelle soumission.
      //
      // ----------------------------------------------------------------------

      if (error instanceof ConvexError) {
        throw error;
      }

      throw new ConvexError({
        code: "PROVIDER_UNKNOWN_ERROR",

        message:
          "La communication avec le provider a échoué. " +
          "Le statut externe doit être vérifié avant toute nouvelle soumission.",
      });
    }
  },
});

// ============================================================================
// GET PAYMENT INTENT
// ============================================================================

export const getPaymentIntent = query({
  args: {
    paymentIntentId: v.id("paymentIntents"),
  },

  handler: async (
    ctx: QueryCtx,
    args: {
      paymentIntentId: Id<"paymentIntents">;
    },
  ): Promise<Doc<"paymentIntents"> | null> => {
    const user = await requireUser(ctx);

    const intent = await ctx.db.get(args.paymentIntentId);

    if (!intent) {
      return null;
    }

    if (intent.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Accès refusé.",
      });
    }

    return intent;
  },
});

// ============================================================================
// GET MY PAYMENT INTENTS
// ============================================================================

export const getMyPaymentIntents = query({
  args: {
    limit: v.optional(v.number()),
  },

  handler: async (
    ctx: QueryCtx,
    args: {
      limit?: number;
    },
  ): Promise<Doc<"paymentIntents">[]> => {
    const user = await requireUser(ctx);

    const requested = args.limit ?? 20;

    const limit = Math.min(
      Math.max(Math.floor(requested), 1),
      MAX_PAYMENT_INTENTS,
    );

    return await ctx.db
      .query("paymentIntents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);
  },
});

// ============================================================================
// GET PAYMENT ATTEMPTS
// ============================================================================

export const getPaymentAttempts = query({
  args: {
    paymentIntentId: v.id("paymentIntents"),
  },

  handler: async (
    ctx: QueryCtx,
    args: {
      paymentIntentId: Id<"paymentIntents">;
    },
  ): Promise<Doc<"paymentAttempts">[]> => {
    const user = await requireUser(ctx);

    const intent = await ctx.db.get(args.paymentIntentId);

    if (!intent) {
      throw new ConvexError({
        code: "PAYMENT_INTENT_NOT_FOUND",
        message: "Payment Intent introuvable.",
      });
    }

    if (intent.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Accès refusé.",
      });
    }

    return await ctx.db
      .query("paymentAttempts")
      .withIndex("by_intent", (q) => q.eq("paymentIntentId", intent._id))
      .order("desc")
      .take(MAX_PAYMENT_ATTEMPTS);
  },
});

// ============================================================================
// INTERNAL — ATTEMPTS VIEW
// ============================================================================

export const getPaymentAttemptsInternalView = internalQuery({
  args: {
    paymentIntentId: v.id("paymentIntents"),
  },

  handler: async (ctx, args) => {
    return await ctx.db
      .query("paymentAttempts")
      .withIndex("by_intent", (q) =>
        q.eq("paymentIntentId", args.paymentIntentId),
      )
      .order("desc")
      .take(MAX_PAYMENT_ATTEMPTS);
  },
});

// ============================================================================
// INTERNAL — PREPARE PAYMENT ATTEMPT
// ============================================================================
//
// Cette mutation est atomique.
//
// Elle évite qu'un double clic / double invocation de startPayment()
// crée deux tentatives actives pour la même intention.
//
// ============================================================================

export const preparePaymentAttempt = internalMutation({
  args: {
    paymentIntentId: v.id("paymentIntents"),
  },

  handler: async (ctx, args): Promise<PreparePaymentAttemptResult> => {
    const intent = await ctx.db.get(args.paymentIntentId);

    if (!intent) {
      throw new ConvexError({
        code: "PAYMENT_INTENT_NOT_FOUND",
        message: "Payment Intent introuvable.",
      });
    }

    if (intent.status === "succeeded") {
      throw new ConvexError({
        code: "PAYMENT_ALREADY_SUCCEEDED",
        message: "Ce paiement est déjà réussi.",
      });
    }

    if (intent.status === "cancelled" || intent.status === "expired") {
      throw new ConvexError({
        code: "PAYMENT_NOT_STARTABLE",
        message: "Ce Payment Intent ne peut plus être démarré.",
      });
    }

    // --------------------------------------------------------------------
    // RECHERCHER UNE TENTATIVE ACTIVE
    // --------------------------------------------------------------------

    const attempts = await ctx.db
      .query("paymentAttempts")
      .withIndex("by_intent", (q) => q.eq("paymentIntentId", intent._id))
      .order("desc")
      .take(MAX_PAYMENT_ATTEMPTS);

    const activeAttempt = attempts.find(
      (attempt) =>
        attempt.status === "created" ||
        attempt.status === "submitted" ||
        attempt.status === "processing",
    );

    if (activeAttempt) {
      return {
        reused: true,

        paymentAttemptId: activeAttempt._id,

        attemptStatus: activeAttempt.status,

        intentStatus: intent.status,

        providerTransactionId: activeAttempt.providerTransactionId,
      };
    }

    const attemptNumber =
      attempts.reduce(
        (maximum, attempt) => Math.max(maximum, attempt.attemptNumber),
        0,
      ) + 1;

    const now = Date.now();

    const paymentAttemptId = await ctx.db.insert("paymentAttempts", {
      paymentIntentId: intent._id,

      userId: intent.userId,

      provider: intent.provider,

      attemptNumber,

      status: "created",

      createdAt: now,

      updatedAt: now,
    });

    return {
      reused: false,

      paymentAttemptId,

      attemptStatus: "created",

      intentStatus: intent.status,

      providerTransactionId: undefined,
    };
  },
});

// ============================================================================
// INTERNAL — MARK ATTEMPT SUBMITTED
// ============================================================================

export const markAttemptSubmitted = internalMutation({
  args: {
    paymentAttemptId: v.id("paymentAttempts"),

    providerTransactionId: v.string(),

    providerReference: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const transactionId = args.providerTransactionId.trim();

    if (!transactionId) {
      throw new ConvexError({
        code: "MISSING_PROVIDER_TRANSACTION_ID",
        message: "La référence provider est obligatoire.",
      });
    }

    const attempt = await ctx.db.get(args.paymentAttemptId);

    if (!attempt) {
      throw new ConvexError({
        code: "PAYMENT_ATTEMPT_NOT_FOUND",
        message: "Payment Attempt introuvable.",
      });
    }

    const intent = await ctx.db.get(attempt.paymentIntentId);

    if (!intent) {
      throw new ConvexError({
        code: "PAYMENT_INTENT_NOT_FOUND",
        message: "Payment Intent introuvable.",
      });
    }

    // --------------------------------------------------------------------
    // PROTECTION TERMINALE
    // --------------------------------------------------------------------

    if (attempt.status === "succeeded") {
      return {
        paymentAttemptId: attempt._id,
        status: "succeeded",
      };
    }

    if (attempt.status === "failed" || attempt.status === "cancelled") {
      throw new ConvexError({
        code: "INVALID_ATTEMPT_STATE",
        message: "Cette tentative est déjà terminée.",
      });
    }

    // --------------------------------------------------------------------
    // COHÉRENCE PROVIDER
    // --------------------------------------------------------------------

    if (
      attempt.providerTransactionId &&
      attempt.providerTransactionId !== transactionId
    ) {
      throw new ConvexError({
        code: "PROVIDER_TRANSACTION_MISMATCH",
        message:
          "La référence provider ne correspond pas à celle de la tentative.",
      });
    }

    // --------------------------------------------------------------------
    // PROTECTION CONTRE LA RÉUTILISATION
    // --------------------------------------------------------------------

    const existing = await ctx.db
      .query("paymentAttempts")
      .withIndex("by_provider_transaction", (q) =>
        q.eq("providerTransactionId", transactionId),
      )
      .first();

    if (existing && existing._id !== attempt._id) {
      throw new ConvexError({
        code: "PROVIDER_TRANSACTION_ALREADY_USED",
        message:
          "Cette référence provider est déjà associée à une autre tentative.",
      });
    }

    const now = Date.now();

    await ctx.db.patch(attempt._id, {
      status: "submitted",

      providerTransactionId: transactionId,

      providerReference: args.providerReference,

      submittedAt: attempt.submittedAt ?? now,

      updatedAt: now,
    });

    await ctx.db.patch(intent._id, {
      status: "processing",

      externalReference: transactionId,

      updatedAt: now,
    });

    return {
      paymentAttemptId: attempt._id,
      status: "submitted",
    };
  },
});

// ============================================================================
// INTERNAL — MARK ATTEMPT FAILED
// ============================================================================

export const markAttemptFailed = internalMutation({
  args: {
    paymentAttemptId: v.id("paymentAttempts"),

    errorCode: v.string(),

    errorMessage: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const attempt = await ctx.db.get(args.paymentAttemptId);

    if (!attempt) {
      throw new ConvexError({
        code: "PAYMENT_ATTEMPT_NOT_FOUND",
        message: "Payment Attempt introuvable.",
      });
    }

    if (attempt.status === "succeeded") {
      return {
        paymentAttemptId: attempt._id,
        status: "succeeded",
      };
    }

    const intent = await ctx.db.get(attempt.paymentIntentId);

    if (!intent) {
      throw new ConvexError({
        code: "PAYMENT_INTENT_NOT_FOUND",
        message: "Payment Intent introuvable.",
      });
    }

    const now = Date.now();

    await ctx.db.patch(attempt._id, {
      status: "failed",

      errorCode: args.errorCode,

      errorMessage: args.errorMessage,

      failedAt: now,

      updatedAt: now,
    });

    await ctx.db.patch(intent._id, {
      status: "failed",

      failureCode: args.errorCode,

      failureMessage: args.errorMessage,

      failedAt: now,

      updatedAt: now,
    });

    return {
      paymentAttemptId: attempt._id,
      status: "failed",
    };
  },
});

// ============================================================================
// INTERNAL — MARK ATTEMPT CANCELLED
// ============================================================================

export const markAttemptCancelled = internalMutation({
  args: {
    paymentAttemptId: v.id("paymentAttempts"),

    errorCode: v.string(),

    errorMessage: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const attempt = await ctx.db.get(args.paymentAttemptId);

    if (!attempt) {
      throw new ConvexError({
        code: "PAYMENT_ATTEMPT_NOT_FOUND",
        message: "Payment Attempt introuvable.",
      });
    }

    if (attempt.status === "succeeded") {
      return {
        paymentAttemptId: attempt._id,
        status: "succeeded",
      };
    }

    const intent = await ctx.db.get(attempt.paymentIntentId);

    if (!intent) {
      throw new ConvexError({
        code: "PAYMENT_INTENT_NOT_FOUND",
        message: "Payment Intent introuvable.",
      });
    }

    const now = Date.now();

    await ctx.db.patch(attempt._id, {
      status: "cancelled",

      errorCode: args.errorCode,

      errorMessage: args.errorMessage,

      updatedAt: now,
    });

    await ctx.db.patch(intent._id, {
      status: "cancelled",

      failureCode: args.errorCode,

      failureMessage: args.errorMessage,

      updatedAt: now,
    });

    return {
      paymentAttemptId: attempt._id,
      status: "cancelled",
    };
  },
});

// ============================================================================
// INTERNAL — MARK ATTEMPT REVERSED
// ============================================================================
//
// IMPORTANT:
//
// Une reversal n'est PAS une simple failure.
//
// Si le paiement avait déjà été finalisé dans le ledger, cette fonction ne
// transforme pas arbitrairement l'historique comptable en "failed".
//
// La compensation comptable d'une reversal devra être implémentée via une
// opération ledger dédiée lorsqu'elle sera supportée.
//
// ============================================================================

export const markAttemptReversed = internalMutation({
  args: {
    paymentAttemptId: v.id("paymentAttempts"),

    errorCode: v.string(),

    errorMessage: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const attempt = await ctx.db.get(args.paymentAttemptId);

    if (!attempt) {
      throw new ConvexError({
        code: "PAYMENT_ATTEMPT_NOT_FOUND",
        message: "Payment Attempt introuvable.",
      });
    }

    const intent = await ctx.db.get(attempt.paymentIntentId);

    if (!intent) {
      throw new ConvexError({
        code: "PAYMENT_INTENT_NOT_FOUND",
        message: "Payment Intent introuvable.",
      });
    }

    // --------------------------------------------------------------------
    // UNE TENTATIVE DÉJÀ RÉUSSIE NE DOIT PAS ÊTRE RÉÉCRITE EN FAILED
    // --------------------------------------------------------------------

    if (attempt.status === "succeeded") {
      return {
        paymentAttemptId: attempt._id,

        status: "succeeded",

        reversed: false,

        compensationRequired: true,
      };
    }

    const now = Date.now();

    await ctx.db.patch(attempt._id, {
      status: "failed",

      errorCode: args.errorCode,

      errorMessage:
        args.errorMessage ?? "Transaction reversée par le provider.",

      failedAt: now,

      updatedAt: now,
    });

    await ctx.db.patch(intent._id, {
      status: "failed",

      failureCode: args.errorCode,

      failureMessage:
        args.errorMessage ?? "Transaction reversée par le provider.",

      failedAt: now,

      updatedAt: now,
    });

    return {
      paymentAttemptId: attempt._id,

      status: "failed",

      reversed: true,

      compensationRequired: false,
    };
  },
});

// ============================================================================
// INTERNAL — FINALIZE PROVIDER SUCCESS
// ============================================================================
//
// C'EST LA PORTE DE FINALISATION DU LEDGER.
//
// Elle est internalMutation.
//
// Le client ne peut pas l'appeler.
//
// ============================================================================

export const finalizeProviderSuccess = internalMutation({
  args: {
    paymentAttemptId: v.id("paymentAttempts"),

    providerTransactionId: v.string(),
  },

  handler: async (ctx, args): Promise<FinalizeProviderSuccessResult> => {
    return await finalizeProviderSuccessDirect(
      ctx,
      args.paymentAttemptId,
      args.providerTransactionId,
    );
  },
});

// ============================================================================
// INTERNAL — PROCESS VERIFIED PROVIDER EVENT
// ============================================================================
//
// Cette fonction n'est PAS une webhook endpoint.
//
// Elle ne doit être appelée que par une couche serveur qui a déjà vérifié
// l'authenticité de l'événement.
//
// Le frontend n'a aucun accès à cette fonction.
//
// ============================================================================

export const processVerifiedProviderEvent = internalMutation({
  args: {
    provider: v.union(
      v.literal("orange_money"),
      v.literal("mpesa"),
      v.literal("airtel_money"),
      v.literal("mtn_momo"),
    ),

    providerEventId: v.string(),

    providerTransactionId: v.optional(v.string()),

    paymentIntentId: v.optional(v.id("paymentIntents")),

    paymentAttemptId: v.optional(v.id("paymentAttempts")),

    eventType: v.union(
      v.literal("payment_pending"),
      v.literal("payment_processing"),
      v.literal("payment_succeeded"),
      v.literal("payment_failed"),
      v.literal("payment_cancelled"),
      v.literal("payment_reversed"),
      v.literal("unknown"),
    ),

    signature: v.optional(v.string()),

    payloadHash: v.optional(v.string()),

    rawPayload: v.optional(v.string()),

    processingError: v.optional(v.string()),

    verified: v.boolean(),
  },

  handler: async (ctx, args) => {
    const providerEventId = args.providerEventId.trim();

    if (!providerEventId) {
      throw new ConvexError({
        code: "MISSING_PROVIDER_EVENT_ID",
        message: "providerEventId obligatoire.",
      });
    }

    // --------------------------------------------------------------------
    // LA MUTATION NE DOIT PAS ÊTRE UTILISÉE POUR CONTOURNER LA VÉRIFICATION
    // --------------------------------------------------------------------

    if (!args.verified) {
      throw new ConvexError({
        code: "UNVERIFIED_PROVIDER_EVENT",
        message: "Un événement provider non vérifié ne peut pas être traité.",
      });
    }

    // --------------------------------------------------------------------
    // IDEMPOTENCE
    // --------------------------------------------------------------------

    const existingEvent = await ctx.db
      .query("paymentProviderEvents")
      .withIndex("by_provider_event", (q) =>
        q.eq("provider", args.provider).eq("providerEventId", providerEventId),
      )
      .first();

    if (existingEvent) {
      return {
        duplicate: true,

        eventId: existingEvent._id,

        processingStatus: existingEvent.processingStatus,
      };
    }

    // --------------------------------------------------------------------
    // CRÉER EVENT
    // --------------------------------------------------------------------

    const eventId = await ctx.db.insert("paymentProviderEvents", {
      provider: args.provider,

      providerEventId,

      providerTransactionId: args.providerTransactionId,

      paymentIntentId: args.paymentIntentId,

      paymentAttemptId: args.paymentAttemptId,

      eventType: args.eventType,

      processingStatus: "received",

      signature: args.signature,

      payloadHash: args.payloadHash,

      rawPayload: args.rawPayload,

      processingError: args.processingError,

      receivedAt: Date.now(),
    });

    // --------------------------------------------------------------------
    // RÉSOUDRE ATTEMPT
    // --------------------------------------------------------------------

    let attempt = args.paymentAttemptId
      ? await ctx.db.get(args.paymentAttemptId)
      : null;

    if (!attempt && args.providerTransactionId) {
      attempt = await ctx.db
        .query("paymentAttempts")
        .withIndex("by_provider_transaction", (q) =>
          q.eq("providerTransactionId", args.providerTransactionId!),
        )
        .first();
    }

    if (!attempt && args.paymentIntentId) {
      const candidates = await ctx.db
        .query("paymentAttempts")
        .withIndex("by_intent", (q) =>
          q.eq("paymentIntentId", args.paymentIntentId!),
        )
        .order("desc")
        .take(MAX_PAYMENT_ATTEMPTS);

      attempt =
        candidates.find((candidate) => candidate.provider === args.provider) ??
        null;
    }

    if (!attempt) {
      await ctx.db.patch(eventId, {
        processingStatus: "failed",

        processingError: "Payment Attempt introuvable.",
      });

      return {
        duplicate: false,

        processed: false,

        reason: "ATTEMPT_NOT_FOUND",

        eventId,
      };
    }

    // --------------------------------------------------------------------
    // RÉSOUDRE INTENT
    // --------------------------------------------------------------------

    const intent = await ctx.db.get(attempt.paymentIntentId);

    if (!intent) {
      await ctx.db.patch(eventId, {
        processingStatus: "failed",

        processingError: "Payment Intent introuvable.",
      });

      return {
        duplicate: false,

        processed: false,

        reason: "INTENT_NOT_FOUND",

        eventId,
      };
    }

    // --------------------------------------------------------------------
    // PROVIDER MATCH
    // --------------------------------------------------------------------

    if (intent.provider !== args.provider) {
      await ctx.db.patch(eventId, {
        processingStatus: "failed",

        processingError: "Provider mismatch.",
      });

      return {
        duplicate: false,

        processed: false,

        reason: "PROVIDER_MISMATCH",

        eventId,
      };
    }

    // --------------------------------------------------------------------
    // TRANSACTION ID MATCH
    // --------------------------------------------------------------------

    if (
      args.providerTransactionId &&
      attempt.providerTransactionId &&
      args.providerTransactionId !== attempt.providerTransactionId
    ) {
      await ctx.db.patch(eventId, {
        processingStatus: "failed",

        processingError: "Provider transaction mismatch.",
      });

      return {
        duplicate: false,

        processed: false,

        reason: "PROVIDER_TRANSACTION_MISMATCH",

        eventId,
      };
    }

    // --------------------------------------------------------------------
    // PENDING / PROCESSING
    // --------------------------------------------------------------------

    if (
      args.eventType === "payment_pending" ||
      args.eventType === "payment_processing"
    ) {
      const now = Date.now();

      await ctx.db.patch(attempt._id, {
        status: "processing",

        providerTransactionId:
          args.providerTransactionId ?? attempt.providerTransactionId,

        updatedAt: now,
      });

      await ctx.db.patch(intent._id, {
        status: "processing",

        externalReference:
          args.providerTransactionId ?? intent.externalReference,

        updatedAt: now,
      });

      await ctx.db.patch(eventId, {
        processingStatus: "processed",

        processedAt: now,
      });

      return {
        duplicate: false,

        processed: true,

        status: "processing",

        eventId,
      };
    }

    // --------------------------------------------------------------------
    // FAILED
    // --------------------------------------------------------------------

    if (args.eventType === "payment_failed") {
      const now = Date.now();

      if (attempt.status !== "succeeded") {
        await ctx.db.patch(attempt._id, {
          status: "failed",

          errorCode: "PROVIDER_FAILED",

          errorMessage: args.processingError,

          failedAt: now,

          updatedAt: now,
        });

        await ctx.db.patch(intent._id, {
          status: "failed",

          failureCode: "PROVIDER_FAILED",

          failureMessage: args.processingError,

          failedAt: now,

          updatedAt: now,
        });
      }

      await ctx.db.patch(eventId, {
        processingStatus: "processed",

        processedAt: now,
      });

      return {
        duplicate: false,

        processed: true,

        status: "failed",

        eventId,
      };
    }

    // --------------------------------------------------------------------
    // CANCELLED
    // --------------------------------------------------------------------

    if (args.eventType === "payment_cancelled") {
      const now = Date.now();

      if (attempt.status !== "succeeded") {
        await ctx.db.patch(attempt._id, {
          status: "cancelled",

          errorCode: "PROVIDER_CANCELLED",

          errorMessage: args.processingError,

          updatedAt: now,
        });

        await ctx.db.patch(intent._id, {
          status: "cancelled",

          failureCode: "PROVIDER_CANCELLED",

          failureMessage: args.processingError,

          updatedAt: now,
        });
      }

      await ctx.db.patch(eventId, {
        processingStatus: "processed",

        processedAt: now,
      });

      return {
        duplicate: false,

        processed: true,

        status: "cancelled",

        eventId,
      };
    }

    // --------------------------------------------------------------------
    // REVERSED
    // --------------------------------------------------------------------

    if (args.eventType === "payment_reversed") {
      const now = Date.now();

      if (attempt.status === "succeeded") {
        // ---------------------------------------------------------------
        // Le paiement a déjà produit un ledger completed.
        //
        // On ne réécrit PAS la transaction en failed.
        // Une compensation comptable devra être traitée par un flux
        // ledger dédié lorsqu'il sera disponible.
        // ---------------------------------------------------------------

        await ctx.db.patch(eventId, {
          processingStatus: "processed",

          processingError:
            "Reversal reçue après finalisation. Compensation ledger requise.",

          processedAt: now,
        });

        return {
          duplicate: false,

          processed: true,

          status: "reversed",

          compensationRequired: true,

          eventId,
        };
      }

      await ctx.db.patch(attempt._id, {
        status: "failed",

        errorCode: "PROVIDER_REVERSED",

        errorMessage:
          args.processingError ?? "Transaction reversée par le provider.",

        failedAt: now,

        updatedAt: now,
      });

      await ctx.db.patch(intent._id, {
        status: "failed",

        failureCode: "PROVIDER_REVERSED",

        failureMessage:
          args.processingError ?? "Transaction reversée par le provider.",

        failedAt: now,

        updatedAt: now,
      });

      await ctx.db.patch(eventId, {
        processingStatus: "processed",

        processedAt: now,
      });

      return {
        duplicate: false,

        processed: true,

        status: "reversed",

        compensationRequired: false,

        eventId,
      };
    }

    // --------------------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------------------

    if (args.eventType === "payment_succeeded") {
      const transactionId = args.providerTransactionId?.trim();

      if (!transactionId) {
        await ctx.db.patch(eventId, {
          processingStatus: "failed",

          processingError: "providerTransactionId manquant pour un succès.",
        });

        throw new ConvexError({
          code: "MISSING_PROVIDER_TRANSACTION_ID",

          message: "Un paiement réussi doit posséder une référence provider.",
        });
      }

      if (
        attempt.providerTransactionId &&
        attempt.providerTransactionId !== transactionId
      ) {
        await ctx.db.patch(eventId, {
          processingStatus: "failed",

          processingError: "Provider transaction mismatch.",
        });

        throw new ConvexError({
          code: "PROVIDER_TRANSACTION_MISMATCH",

          message: "La transaction provider ne correspond pas à la tentative.",
        });
      }

      const finalized = await finalizeProviderSuccessDirect(
        ctx,
        attempt._id,
        transactionId,
      );

      await ctx.db.patch(eventId, {
        processingStatus: "processed",

        processedAt: Date.now(),
      });

      return {
        duplicate: false,

        processed: true,

        status: "succeeded",

        eventId,

        ledgerTransactionId: finalized.ledgerTransactionId,

        alreadyFinalized: finalized.alreadyFinalized,
      };
    }

    // --------------------------------------------------------------------
    // UNKNOWN
    // --------------------------------------------------------------------

    await ctx.db.patch(eventId, {
      processingStatus: "ignored",

      processedAt: Date.now(),

      processingError:
        args.processingError ?? "Événement provider non reconnu.",
    });

    return {
      duplicate: false,

      processed: false,

      status: "ignored",

      eventId,
    };
  },
});

// ============================================================================
// INTERNAL HELPER — FINALIZE
// ============================================================================
//
// Helper strictement typé.
//
// IMPORTANT:
//
// Ce helper est appelé depuis processVerifiedProviderEvent(), donc il reçoit
// le contexte réel de la mutation Convex en cours.
//
// Il ne doit jamais utiliser `any`.
//
// ============================================================================

async function finalizeProviderSuccessDirect(
  ctx: MutationCtx,
  paymentAttemptId: Id<"paymentAttempts">,
  providerTransactionId: string,
): Promise<FinalizeProviderSuccessResult> {
  const transactionId = providerTransactionId.trim();

  if (!transactionId) {
    throw new ConvexError({
      code: "MISSING_PROVIDER_TRANSACTION_ID",
      message: "Référence provider obligatoire.",
    });
  }

  const attempt = await ctx.db.get(paymentAttemptId);

  if (!attempt) {
    throw new ConvexError({
      code: "PAYMENT_ATTEMPT_NOT_FOUND",
      message: "Payment Attempt introuvable.",
    });
  }

  const intent = await ctx.db.get(attempt.paymentIntentId);

  if (!intent) {
    throw new ConvexError({
      code: "PAYMENT_INTENT_NOT_FOUND",
      message: "Payment Intent introuvable.",
    });
  }

  // --------------------------------------------------------------------------
  // COHÉRENCE PROVIDER
  // --------------------------------------------------------------------------

  if (
    attempt.providerTransactionId &&
    attempt.providerTransactionId !== transactionId
  ) {
    throw new ConvexError({
      code: "PROVIDER_TRANSACTION_MISMATCH",
      message: "La référence provider ne correspond pas à la tentative.",
    });
  }

  // --------------------------------------------------------------------------
  // DOUBLE FINALISATION PAR INTENT
  // --------------------------------------------------------------------------

  const existingByIntent = await ctx.db
    .query("walletTransactions")
    .withIndex("by_payment_intent", (q) => q.eq("paymentIntentId", intent._id))
    .first();

  if (existingByIntent) {
    if (existingByIntent.status !== "completed") {
      throw new ConvexError({
        code: "LEDGER_INVALID_STATE",
        message: "Une transaction ledger existe déjà dans un état inattendu.",
      });
    }

    const now = Date.now();

    await ctx.db.patch(attempt._id, {
      status: "succeeded",

      providerTransactionId: transactionId,

      succeededAt: attempt.succeededAt ?? now,

      updatedAt: now,
    });

    await ctx.db.patch(intent._id, {
      status: "succeeded",

      externalReference: transactionId,

      succeededAt: intent.succeededAt ?? now,

      updatedAt: now,
    });

    return {
      ledgerTransactionId: existingByIntent._id,

      alreadyFinalized: true,
    };
  }

  // --------------------------------------------------------------------------
  // DOUBLE FINALISATION PAR RÉFÉRENCE EXTERNE
  // --------------------------------------------------------------------------

  const existingByExternal = await ctx.db
    .query("walletTransactions")
    .withIndex("by_external_reference", (q) =>
      q.eq("externalReference", transactionId),
    )
    .first();

  if (existingByExternal) {
    if (existingByExternal.userId !== intent.userId) {
      throw new ConvexError({
        code: "LEDGER_REFERENCE_CONFLICT",
        message:
          "La référence provider appartient déjà à un autre utilisateur.",
      });
    }

    const now = Date.now();

    await ctx.db.patch(attempt._id, {
      status: "succeeded",

      providerTransactionId: transactionId,

      succeededAt: attempt.succeededAt ?? now,

      updatedAt: now,
    });

    await ctx.db.patch(intent._id, {
      status: "succeeded",

      externalReference: transactionId,

      succeededAt: intent.succeededAt ?? now,

      updatedAt: now,
    });

    return {
      ledgerTransactionId: existingByExternal._id,

      alreadyFinalized: true,
    };
  }

  // --------------------------------------------------------------------------
  // ÉTAT DE L'ATTEMPT
  // --------------------------------------------------------------------------

  if (attempt.status === "failed" || attempt.status === "cancelled") {
    throw new ConvexError({
      code: "INVALID_ATTEMPT_STATE",
      message:
        "Une tentative terminée ne peut pas être confirmée comme réussie.",
    });
  }

  // --------------------------------------------------------------------------
  // PROTECTION DES PAIEMENTS OUTBOUND
  // --------------------------------------------------------------------------

  if (
    intent.direction === "outbound" &&
    !supportsOutboundOperation(intent.type, intent.provider)
  ) {
    throw new ConvexError({
      code: "OUTBOUND_PROVIDER_NOT_IMPLEMENTED",
      message:
        "Le flux sortant de ce provider n'est pas implémenté par le Payment Core.",
    });
  }

  const now = Date.now();

  // --------------------------------------------------------------------------
  // LEDGER
  // --------------------------------------------------------------------------
  //
  // SEUL ENDROIT où un paiement provider confirmé devient completed.
  //
  // --------------------------------------------------------------------------

  const ledgerTransactionId = await ctx.db.insert("walletTransactions", {
    userId: intent.userId,

    type: getLedgerType(intent.type),

    amount: intent.amount,

    currency: intent.currency,

    description: getLedgerDescription(intent.type),

    status: "completed",

    referenceId: intent.referenceId,

    completedAt: new Date(now).toISOString(),

    provider: intent.provider,

    paymentIntentId: intent._id,

    paymentAttemptId: attempt._id,

    externalReference: transactionId,

    ledgerReference: `ledger:${intent._id}:${attempt._id}`,

    metadata: {
      paymentType: intent.type,

      direction: intent.direction,
    },
  });

  // --------------------------------------------------------------------------
  // ATTEMPT
  // --------------------------------------------------------------------------

  await ctx.db.patch(attempt._id, {
    status: "succeeded",

    providerTransactionId: transactionId,

    succeededAt: now,

    updatedAt: now,
  });

  // --------------------------------------------------------------------------
  // INTENT
  // --------------------------------------------------------------------------

  await ctx.db.patch(intent._id, {
    status: "succeeded",

    externalReference: transactionId,

    succeededAt: now,

    updatedAt: now,
  });

  return {
    ledgerTransactionId,

    alreadyFinalized: false,
  };
}

// ============================================================================
// OUTBOUND CAPABILITY
// ============================================================================
//
// Le Payment Core refuse toute finalisation outbound tant que le flux
// provider correspondant n'est pas explicitement implémenté.
//
// Aucun provider n'est considéré comme supportant un retrait simplement
// parce qu'une méthode frontend existe.
//
// ============================================================================

function supportsOutboundOperation(
  type: PaymentType,
  provider: Provider,
): boolean {
  switch (type) {
    case "wallet_withdrawal":
      return (
        provider === "orange_money" ||
        provider === "mpesa" ||
        provider === "airtel_money" ||
        provider === "mtn_momo"
      );

    case "merchant_payment":
    case "peer_transfer":
      return (
        provider === "orange_money" ||
        provider === "mpesa" ||
        provider === "airtel_money" ||
        provider === "mtn_momo"
      );

    case "wallet_topup":
    case "refund":
      return false;
  }
}
