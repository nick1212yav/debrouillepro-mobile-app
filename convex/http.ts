// ============================================================================
// DÉBROUILLEPAY — SECURE PROVIDER WEBHOOK GATEWAY
// Fichier : convex/http.ts
//
// Contrat webhook harmonisé avec:
//   convex/providers/payment_provider.ts
//
// Le gateway HTTP ne déclare jamais un paiement réussi.
// Seul un événement retourné comme VERIFIED par l'adapter provider
// peut être transmis au Payment Core.
// ============================================================================

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

import type { Id } from "./_generated/dataModel.d.ts";

import { OrangeMoneyProvider } from "./providers/orange_money";
import { MpesaProvider } from "./providers/mpesa";
import { AirtelMoneyProvider } from "./providers/airtel_money";
import { MtnMomoProvider } from "./providers/mtn_momo";

import type {
  ProviderWebhookInput,
  VerifiedWebhookResult,
  NormalizedProviderEvent,
  ProviderTransactionState,
} from "./providers/payment_provider";

// ============================================================================
// TYPES
// ============================================================================

type PaymentProvider = "orange_money" | "mpesa" | "airtel_money" | "mtn_momo";

type PaymentEventType =
  | "payment_pending"
  | "payment_processing"
  | "payment_succeeded"
  | "payment_failed"
  | "payment_cancelled"
  | "payment_reversed"
  | "unknown";

/**
 * Contrat canonique utilisé par http.ts après vérification de l'adapter.
 *
 * IMPORTANT:
 *
 * VerifiedWebhookResult est le contrat adapter.
 * VerifiedWebhookEvent est le contrat interne sécurisé du gateway.
 *
 * Les identifiants internes sont convertis vers les types Id<> uniquement
 * après extraction du résultat vérifié.
 */
type VerifiedWebhookEvent = {
  providerEventId: string;

  providerTransactionId?: string;

  paymentIntentId?: Id<"paymentIntents">;

  paymentAttemptId?: Id<"paymentAttempts">;

  eventType: PaymentEventType;

  signature?: string;

  payloadHash?: string;

  rawPayload: string;

  processingError?: string;
};

/**
 * Contrat minimal attendu d'un adapter.
 *
 * Les adapters retournent leur contrat natif:
 *
 *   verifyWebhook() -> VerifiedWebhookResult
 *
 * Le gateway ne force donc jamais un adapter à retourner
 * artificiellement un VerifiedWebhookEvent.
 */
type WebhookVerifier = {
  verifyWebhook(args: ProviderWebhookInput): Promise<VerifiedWebhookResult>;
};

// ============================================================================
// CONSTANTES
// ============================================================================

const MAX_WEBHOOK_BODY_BYTES = 1_048_576;

// ============================================================================
// RESPONSE
// ============================================================================

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

// ============================================================================
// HTTP ERROR
// ============================================================================

class WebhookHttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "WebhookHttpError";
    this.status = status;
    this.code = code;
  }
}

// ============================================================================
// METHOD GUARD
// ============================================================================

function methodNotAllowed(): Response {
  return jsonResponse(
    {
      ok: false,
      error: "METHOD_NOT_ALLOWED",
    },
    405,
  );
}

// ============================================================================
// RAW BODY
// ============================================================================

async function readRawBody(request: Request): Promise<string> {
  const contentLength = request.headers.get("content-length");

  if (contentLength) {
    const declaredLength = Number(contentLength);

    if (
      Number.isFinite(declaredLength) &&
      declaredLength > MAX_WEBHOOK_BODY_BYTES
    ) {
      throw new WebhookHttpError(
        413,
        "WEBHOOK_BODY_TOO_LARGE",
        "Payload webhook trop volumineux.",
      );
    }
  }

  const body = await request.text();

  const byteLength = new TextEncoder().encode(body).byteLength;

  if (byteLength > MAX_WEBHOOK_BODY_BYTES) {
    throw new WebhookHttpError(
      413,
      "WEBHOOK_BODY_TOO_LARGE",
      "Payload webhook trop volumineux.",
    );
  }

  if (!body.trim()) {
    throw new WebhookHttpError(
      400,
      "EMPTY_WEBHOOK_BODY",
      "Le webhook ne contient aucun payload.",
    );
  }

  return body;
}

// ============================================================================
// HEADERS
// ============================================================================

function snapshotHeaders(request: Request): Record<string, string | undefined> {
  const headers: Record<string, string | undefined> = {};

  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  return headers;
}

// ============================================================================
// PROVIDER FACTORY
// ============================================================================

function createProvider(provider: PaymentProvider): WebhookVerifier {
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
// STATE → EVENT TYPE
// ============================================================================

/**
 * NormalizedProviderEvent ne possède PAS de propriété eventType.
 *
 * Son contrat canonique expose:
 *
 *   state:
 *     pending
 *     processing
 *     succeeded
 *     failed
 *     cancelled
 *     reversed
 *     unknown
 *
 * Le Payment Core utilise quant à lui des eventType explicites.
 *
 * Cette conversion est donc centralisée ici.
 */
function normalizeEventType(state: ProviderTransactionState): PaymentEventType {
  switch (state) {
    case "pending":
      return "payment_pending";

    case "processing":
      return "payment_processing";

    case "succeeded":
      return "payment_succeeded";

    case "failed":
      return "payment_failed";

    case "cancelled":
      return "payment_cancelled";

    case "reversed":
      return "payment_reversed";

    case "unknown":
      return "unknown";
  }
}

// ============================================================================
// INTERNAL PAYMENT ID CONVERSION
// ============================================================================

/**
 * Les adapters travaillent avec des strings pour rester indépendants
 * du DataModel Convex.
 *
 * Le Payment Core, lui, attend des Id<>.
 *
 * Cette fonction réalise uniquement la conversion de type.
 *
 * IMPORTANT:
 * Aucun identifiant n'est fabriqué.
 * Une valeur absente reste undefined.
 */
function toPaymentIntentId(value?: string): Id<"paymentIntents"> | undefined {
  const normalized = value?.trim();

  if (!normalized) {
    return undefined;
  }

  return normalized as Id<"paymentIntents">;
}

function toPaymentAttemptId(value?: string): Id<"paymentAttempts"> | undefined {
  const normalized = value?.trim();

  if (!normalized) {
    return undefined;
  }

  return normalized as Id<"paymentAttempts">;
}

// ============================================================================
// VERIFIED RESULT → SECURE EVENT
// ============================================================================

function toVerifiedWebhookEvent(
  provider: PaymentProvider,
  result: VerifiedWebhookResult,
  rawBody: string,
): VerifiedWebhookEvent {
  /**
   * Un webhook non vérifié ne doit jamais atteindre payments.ts.
   */
  if (result.verified !== true) {
    throw new WebhookHttpError(401, "WEBHOOK_REJECTED", "Webhook rejeté.");
  }

  const normalizedEvent: NormalizedProviderEvent | undefined = result.event;

  if (!normalizedEvent) {
    throw new WebhookHttpError(
      422,
      "VERIFIED_EVENT_MISSING",
      `Le provider ${provider} a déclaré le webhook vérifié sans événement normalisé.`,
    );
  }

  // --------------------------------------------------------------------------
  // PROVIDER EVENT ID
  // --------------------------------------------------------------------------

  const providerEventId = normalizedEvent.providerEventId.trim();

  if (!providerEventId) {
    throw new WebhookHttpError(
      422,
      "INVALID_PROVIDER_EVENT_ID",
      "L'événement provider vérifié ne possède pas d'identifiant.",
    );
  }

  // --------------------------------------------------------------------------
  // RAW PAYLOAD
  // --------------------------------------------------------------------------

  /**
   * Le body transmis au Payment Core est TOUJOURS celui reçu
   * par le gateway.
   *
   * http.ts ne reconstruit jamais le payload.
   */
  if (!rawBody) {
    throw new WebhookHttpError(
      422,
      "INVALID_RAW_PAYLOAD",
      "Le payload brut est vide.",
    );
  }

  // --------------------------------------------------------------------------
  // PROVIDER DATA
  // --------------------------------------------------------------------------

  const providerTransactionId =
    normalizedEvent.providerTransactionId?.trim() || undefined;

  const paymentIntentId = toPaymentIntentId(normalizedEvent.paymentIntentId);

  const paymentAttemptId = toPaymentAttemptId(normalizedEvent.paymentAttemptId);

  /**
   * NormalizedProviderEvent utilise `state`.
   *
   * Il n'existe volontairement aucun accès à:
   *
   *   normalizedEvent.eventType
   *
   * afin de rester synchronisé avec payment_provider.ts.
   */
  const eventType = normalizeEventType(normalizedEvent.state);

  // --------------------------------------------------------------------------
  // SUCCESS INTEGRITY
  // --------------------------------------------------------------------------

  /**
   * Un succès sans référence provider réelle est rejeté.
   *
   * Aucun identifiant provider n'est fabriqué localement.
   */
  if (eventType === "payment_succeeded" && !providerTransactionId) {
    throw new WebhookHttpError(
      422,
      "SUCCESS_WITHOUT_TRANSACTION_ID",
      "Un événement de succès doit contenir une référence de transaction provider.",
    );
  }

  return {
    providerEventId,

    providerTransactionId,

    paymentIntentId,

    paymentAttemptId,

    eventType,

    signature: normalizedEvent.signature?.trim() || undefined,

    payloadHash: normalizedEvent.payloadHash?.trim() || undefined,

    rawPayload: rawBody,

    processingError: result.errorMessage?.trim() || undefined,
  };
}

// ============================================================================
// WEBHOOK PROCESSOR
// ============================================================================

async function processProviderWebhook(
  ctx: Parameters<Parameters<typeof httpAction>[0]>[0],
  request: Request,
  provider: PaymentProvider,
): Promise<Response> {
  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  try {
    // ------------------------------------------------------------------------
    // 1. BODY BRUT
    // ------------------------------------------------------------------------

    const rawBody = await readRawBody(request);

    // ------------------------------------------------------------------------
    // 2. HEADERS
    // ------------------------------------------------------------------------

    const headers = snapshotHeaders(request);

    // ------------------------------------------------------------------------
    // 3. ADAPTER
    // ------------------------------------------------------------------------

    const adapter = createProvider(provider);

    // ------------------------------------------------------------------------
    // 4. VÉRIFICATION PROVIDER
    // ------------------------------------------------------------------------

    /**
     * Chaque adapter applique ses propres règles:
     *
     *   signature
     *   token
     *   secret
     *   certificat
     *   timestamp
     *   intégrité
     *
     * http.ts ne connaît aucun mécanisme cryptographique spécifique.
     */
    const verifiedResult = await adapter.verifyWebhook({
      rawBody,
      headers,
    });

    // ------------------------------------------------------------------------
    // 5. NORMALISATION SÉCURISÉE
    // ------------------------------------------------------------------------

    const event = toVerifiedWebhookEvent(provider, verifiedResult, rawBody);

    // ------------------------------------------------------------------------
    // 6. PAYMENT CORE
    // ------------------------------------------------------------------------

    /**
     * Aucune écriture wallet ici.
     *
     * payments.processVerifiedProviderEvent()
     * est la seule couche autorisée à traiter l'événement vérifié.
     */
    const result = await ctx.runMutation(
      internal.payments.processVerifiedProviderEvent,
      {
        provider,

        providerEventId: event.providerEventId,

        providerTransactionId: event.providerTransactionId,

        paymentIntentId: event.paymentIntentId,

        paymentAttemptId: event.paymentAttemptId,

        eventType: event.eventType,

        signature: event.signature,

        payloadHash: event.payloadHash,

        rawPayload: event.rawPayload,

        processingError: event.processingError,

        verified: true,
      },
    );

    // ------------------------------------------------------------------------
    // 7. ACK
    // ------------------------------------------------------------------------

    return jsonResponse(
      {
        ok: true,
        provider,
        duplicate: result.duplicate,
        processed: result.processed,
        status: "status" in result ? result.status : undefined,
      },
      200,
    );
  } catch (error) {
    // ------------------------------------------------------------------------
    // ERREUR HTTP CONTRÔLÉE
    // ------------------------------------------------------------------------

    if (error instanceof WebhookHttpError) {
      return jsonResponse(
        {
          ok: false,
          error: error.code,
          message: error.message,
        },
        error.status,
      );
    }

    // ------------------------------------------------------------------------
    // ERREUR ADAPTER / AUTHENTIFICATION
    // ------------------------------------------------------------------------

    /**
     * On ne révèle jamais la raison exacte du rejet au provider.
     */
    return jsonResponse(
      {
        ok: false,
        error: "WEBHOOK_REJECTED",
        message: "Webhook rejeté.",
      },
      401,
    );
  }
}

// ============================================================================
// ORANGE MONEY
// ============================================================================

const orangeMoneyWebhook = httpAction(async (ctx, request) =>
  processProviderWebhook(ctx, request, "orange_money"),
);

// ============================================================================
// M-PESA
// ============================================================================

const mpesaWebhook = httpAction(async (ctx, request) =>
  processProviderWebhook(ctx, request, "mpesa"),
);

// ============================================================================
// AIRTEL MONEY
// ============================================================================

const airtelMoneyWebhook = httpAction(async (ctx, request) =>
  processProviderWebhook(ctx, request, "airtel_money"),
);

// ============================================================================
// MTN MOMO
// ============================================================================

const mtnMomoWebhook = httpAction(async (ctx, request) =>
  processProviderWebhook(ctx, request, "mtn_momo"),
);

// ============================================================================
// ROUTER
// ============================================================================

const http = httpRouter();

http.route({
  path: "/payments/webhooks/orange_money",
  method: "POST",
  handler: orangeMoneyWebhook,
});

http.route({
  path: "/payments/webhooks/mpesa",
  method: "POST",
  handler: mpesaWebhook,
});

http.route({
  path: "/payments/webhooks/airtel_money",
  method: "POST",
  handler: airtelMoneyWebhook,
});

http.route({
  path: "/payments/webhooks/mtn_momo",
  method: "POST",
  handler: mtnMomoWebhook,
});

// ============================================================================
// EXPORT
// ============================================================================

export default http;
