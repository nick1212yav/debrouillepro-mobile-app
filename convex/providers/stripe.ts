// convex/providers/stripe.ts
//
// Stripe Provider — implémentation du contrat PaymentProvider.
//
// ─────────────────────────────────────────────────────────────────────────────
// RÈGLES ABSOLUES
//
//   1. Aucun succès sans providerTransactionId réel.
//   2. Aucune simulation.
//   3. Signature webhook vérifiée en temps constant.
//   4. Tolérance timestamp ±300 s (anti-replay bidirectionnel).
//   5. payloadHash = SHA-256(rawBody) — distinct du HMAC Stripe.
//   6. Metadata IDs = candidats (validation DB côté mutation).
//   7. Sans STRIPE_SECRET_KEY ou STRIPE_WEBHOOK_SECRET → PROVIDER_NOT_CONFIGURED.
//   8. Aucune écriture ledger depuis cet adapter.
// ─────────────────────────────────────────────────────────────────────────────

import {
  PaymentProviderError,
  type NormalizedProviderEvent,
  type PaymentProvider,
  type PaymentProviderCapabilities,
  type PaymentProviderConfiguration,
  type PaymentProviderRequest,
  type PaymentProviderResponse,
  type PaymentStatusRequest,
  type ProviderWebhookInput,
  type VerifiedWebhookResult,
} from "./payment_provider";

// ============================================================================
// ENVIRONMENT
// ============================================================================

type StripeEnvironment = "sandbox" | "production" | "unknown";

interface StripeServerConfiguration {
  secretKey?: string;
  webhookSecret?: string;
  environment: StripeEnvironment;
}

// ============================================================================
// ZERO-DECIMAL CURRENCIES
// https://docs.stripe.com/currencies#zero-decimal
// ============================================================================

const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

function toStripeAmount(amount: number, currency: string): number {
  const normalized = currency.trim().toUpperCase();

  if (ZERO_DECIMAL_CURRENCIES.has(normalized)) {
    return Math.round(amount);
  }

  return Math.round(amount * 100);
}

// ============================================================================
// CRYPTO HELPERS
// ============================================================================

/**
 * Comparaison à temps constant pour éviter les timing attacks.
 * Les longueurs différentes sont rejetées immédiatement.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;

  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * HMAC SHA-256 → hexadécimal.
 * Utilisé UNIQUEMENT pour vérifier la signature Stripe.
 */
async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );

  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * SHA-256 du payload → hexadécimal.
 * Utilisé UNIQUEMENT pour le hash d'audit (payloadHash).
 *
 * IMPORTANT : ne pas confondre avec le HMAC Stripe.
 *   - HMAC  → authentifie l'origine du message.
 *   - SHA-256 → empreinte d'intégrité réutilisable en audit.
 */
async function sha256Hex(input: string): Promise<string> {
  const buffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );

  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ============================================================================
// STRIPE STATUS MAPPING
// ============================================================================

function mapStripeIntentStatus(stripeStatus: string): {
  state:
    | "pending"
    | "processing"
    | "succeeded"
    | "failed"
    | "cancelled"
    | "unknown";
  requiresCustomerAction?: boolean;
  nextActionType?: "stripe_3ds" | "stripe_confirm" | "none";
} {
  switch (stripeStatus) {
    case "succeeded":
      return { state: "succeeded" };

    case "processing":
      return { state: "processing" };

    case "requires_payment_method":
      return { state: "pending", requiresCustomerAction: true };

    case "requires_confirmation":
      return {
        state: "pending",
        requiresCustomerAction: true,
        nextActionType: "stripe_confirm",
      };

    case "requires_action":
      return {
        state: "pending",
        requiresCustomerAction: true,
        nextActionType: "stripe_3ds",
      };

    case "requires_capture":
      return { state: "processing" };

    case "canceled":
      return { state: "cancelled" };

    default:
      return { state: "unknown" };
  }
}

// ============================================================================
// STRIPE PROVIDER
// ============================================================================

const TIMESTAMP_TOLERANCE_SECONDS = 300;

export class StripeProvider implements PaymentProvider {
  readonly name = "stripe" as const;

  readonly capabilities: PaymentProviderCapabilities = {
    supportsInbound: true,
    supportsOutbound: false,
    supportsWebhooks: true,
    supportsStatusQuery: true,
    supportsIdempotency: true,
  };

  private readonly configuration: StripeServerConfiguration;

  constructor(params?: {
    secretKey?: string;
    webhookSecret?: string;
    environment?: StripeEnvironment;
  }) {
    this.configuration = {
      secretKey: params?.secretKey ?? process.env.STRIPE_SECRET_KEY,
      webhookSecret: params?.webhookSecret ?? process.env.STRIPE_WEBHOOK_SECRET,
      environment: "unknown",
    };

    this.configuration.environment = this.resolveEnvironment();
  }

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  private resolveEnvironment(): StripeEnvironment {
    const key = this.configuration.secretKey?.trim();

    if (!key) {
      return "unknown";
    }

    if (key.startsWith("sk_test_")) {
      return "sandbox";
    }

    if (key.startsWith("sk_live_")) {
      return "production";
    }

    return "unknown";
  }

  private hasCompleteServerConfiguration(): boolean {
    const key = this.configuration.secretKey?.trim();
    const webhook = this.configuration.webhookSecret?.trim();

    return Boolean(key && key.startsWith("sk_") && webhook);
  }

  async getConfiguration(): Promise<PaymentProviderConfiguration> {
    const configured = this.hasCompleteServerConfiguration();

    return {
      provider: this.name,
      configured,
      environment: this.configuration.environment,
      capabilities: configured ? this.capabilities : null,
    };
  }

  private assertConfigured(): void {
    if (!this.hasCompleteServerConfiguration()) {
      throw new PaymentProviderError({
        code: "PROVIDER_NOT_CONFIGURED",
        provider: this.name,
        message:
          "Stripe est reconnu comme rail de paiement, mais STRIPE_SECRET_KEY ou STRIPE_WEBHOOK_SECRET est absent côté serveur. Aucun appel réseau n'est effectué.",
        retryable: false,
      });
    }
  }

  // ==========================================================================
  // HTTP HELPER
  // ==========================================================================

  private async stripeFetch(
    path: string,
    init: {
      method: "GET" | "POST";
      idempotencyKey?: string;
      body?: URLSearchParams;
    },
  ): Promise<unknown> {
    const secretKey = this.configuration.secretKey;

    if (!secretKey) {
      throw new PaymentProviderError({
        code: "PROVIDER_NOT_CONFIGURED",
        provider: this.name,
        message: "Stripe secret key manquante.",
        retryable: false,
      });
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${secretKey}`,
    };

    if (init.idempotencyKey) {
      headers["Idempotency-Key"] = init.idempotencyKey;
    }

    let body: string | undefined;

    if (init.body) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      body = init.body.toString();
    }

    const response = await fetch(`https://api.stripe.com/v1${path}`, {
      method: init.method,
      headers,
      body,
    });

    const payload = (await response.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    if (!response.ok) {
      const err = payload?.error as Record<string, unknown> | undefined;

      throw new PaymentProviderError({
        code:
          response.status === 401
            ? "PROVIDER_AUTHENTICATION_FAILED"
            : response.status === 429
              ? "PROVIDER_RATE_LIMITED"
              : response.status >= 500
                ? "PROVIDER_UNAVAILABLE"
                : "PROVIDER_BAD_REQUEST",
        provider: this.name,
        message:
          typeof err?.message === "string"
            ? err.message
            : `Stripe HTTP ${response.status}.`,
        retryable: response.status >= 500 || response.status === 429,
      });
    }

    return payload;
  }

  // ==========================================================================
  // CREATE PAYMENT
  // ==========================================================================

  async createPayment(
    request: PaymentProviderRequest,
  ): Promise<PaymentProviderResponse> {
    this.assertConfigured();

    const stripeAmount = toStripeAmount(request.amount, request.currency);

    if (stripeAmount <= 0) {
      throw new PaymentProviderError({
        code: "PROVIDER_BAD_REQUEST",
        provider: this.name,
        message: "Montant Stripe invalide après conversion.",
        retryable: false,
      });
    }

    const body = new URLSearchParams();

    body.append("amount", String(stripeAmount));
    body.append("currency", request.currency.trim().toLowerCase());
    body.append("capture_method", "automatic");
    body.append("metadata[paymentIntentId]", request.paymentIntentId);
    body.append("metadata[paymentAttemptId]", request.paymentAttemptId);

    if (request.referenceId) {
      body.append("metadata[referenceId]", request.referenceId);
    }

    body.append("metadata[operation]", request.operation);

    if (request.description) {
      body.append("description", request.description);
    }

    const payload = (await this.stripeFetch("/payment_intents", {
      method: "POST",
      idempotencyKey: request.idempotencyKey,
      body,
    })) as Record<string, unknown>;

    return this.normalizePaymentIntentResponse(payload);
  }

  // ==========================================================================
  // GET PAYMENT STATUS
  // ==========================================================================

  async getPaymentStatus(
    request: PaymentStatusRequest,
  ): Promise<PaymentProviderResponse> {
    this.assertConfigured();

    const payload = (await this.stripeFetch(
      `/payment_intents/${encodeURIComponent(request.providerTransactionId)}`,
      { method: "GET" },
    )) as Record<string, unknown>;

    return this.normalizePaymentIntentResponse(payload);
  }

  private normalizePaymentIntentResponse(
    payload: Record<string, unknown>,
  ): PaymentProviderResponse {
    const id = typeof payload.id === "string" ? payload.id : undefined;
    const status = typeof payload.status === "string" ? payload.status : "";

    const mapped = mapStripeIntentStatus(status);

    const rawResponse = JSON.stringify(payload);

    const clientSecret =
      typeof payload.client_secret === "string"
        ? payload.client_secret
        : undefined;

    return {
      state: mapped.state,
      providerTransactionId: id,
      errorCode:
        mapped.state === "failed" ? "PROVIDER_TRANSACTION_FAILED" : undefined,
      requiresCustomerAction: mapped.requiresCustomerAction,
      nextAction: mapped.nextActionType
        ? { type: mapped.nextActionType, clientSecret }
        : undefined,
      rawResponse,
    };
  }

  // ==========================================================================
  // VERIFY WEBHOOK
  // ==========================================================================

  async verifyWebhook(
    input: ProviderWebhookInput,
  ): Promise<VerifiedWebhookResult> {
    const webhookSecret = this.configuration.webhookSecret?.trim();

    if (!webhookSecret) {
      return {
        verified: false,
        errorCode: "INVALID_SIGNATURE",
        errorMessage: "STRIPE_WEBHOOK_SECRET non configuré côté serveur.",
      };
    }

    const signatureHeader = input.headers["stripe-signature"];

    if (!signatureHeader) {
      return {
        verified: false,
        errorCode: "INVALID_SIGNATURE",
        errorMessage: "Header Stripe-Signature manquant.",
      };
    }

    // ------------------------------------------------------------------------
    // PARSE HEADER STRIPE-SIGNATURE
    // Format : t=...,v1=...,v1=...,v0=...
    // ------------------------------------------------------------------------

    const signatures: Record<string, string[]> = {};

    for (const entry of signatureHeader.split(",")) {
      const [k, v] = entry.split("=");
      if (!k || !v) continue;

      const key = k.trim();
      const value = v.trim();

      if (!signatures[key]) {
        signatures[key] = [];
      }

      signatures[key].push(value);
    }

    const timestamp = signatures["t"]?.[0];
    const v1Sigs = signatures["v1"] ?? [];

    if (!timestamp || v1Sigs.length === 0) {
      return {
        verified: false,
        errorCode: "INVALID_SIGNATURE",
        errorMessage: "Signature Stripe-Signature incomplète.",
      };
    }

    // ------------------------------------------------------------------------
    // TOLÉRANCE TIMESTAMP — fenêtre ±300 s
    // ------------------------------------------------------------------------

    const tsSeconds = parseInt(timestamp, 10);

    if (!Number.isFinite(tsSeconds)) {
      return {
        verified: false,
        errorCode: "INVALID_SIGNATURE",
        errorMessage: "Timestamp Stripe invalide.",
      };
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const driftSeconds = Math.abs(nowSeconds - tsSeconds);

    if (driftSeconds > TIMESTAMP_TOLERANCE_SECONDS) {
      return {
        verified: false,
        errorCode: "INVALID_SIGNATURE",
        errorMessage: "Timestamp Stripe hors fenêtre de tolérance.",
      };
    }

    // ------------------------------------------------------------------------
    // HMAC CHECK — comparaison temps constant
    // ------------------------------------------------------------------------

    const signedPayload = `${timestamp}.${input.rawBody}`;
    const expectedSig = await hmacSha256Hex(webhookSecret, signedPayload);

    const hasMatch = v1Sigs.some((sig) => timingSafeEqual(sig, expectedSig));

    if (!hasMatch) {
      return {
        verified: false,
        errorCode: "INVALID_SIGNATURE",
        errorMessage: "Signature Stripe invalide.",
      };
    }

    // ------------------------------------------------------------------------
    // PARSE EVENT
    // ------------------------------------------------------------------------

    let event: Record<string, unknown>;

    try {
      event = JSON.parse(input.rawBody) as Record<string, unknown>;
    } catch {
      return {
        verified: false,
        errorCode: "INVALID_PAYLOAD",
        errorMessage: "Payload Stripe non parseable.",
      };
    }

    const providerEventId = typeof event.id === "string" ? event.id : undefined;

    if (!providerEventId) {
      return {
        verified: false,
        errorCode: "MISSING_EVENT_ID",
        errorMessage: "Événement Stripe sans identifiant.",
      };
    }

    const eventType = typeof event.type === "string" ? event.type : "";

    const data = event.data as Record<string, unknown> | undefined;
    const object = data?.object as Record<string, unknown> | undefined;

    const providerTransactionId =
      typeof object?.id === "string" ? object.id : undefined;

    // ------------------------------------------------------------------------
    // EXTRACTION METADATA — CANDIDATS
    // Ces IDs ne sont pas fiables.
    // Ils seront validés côté mutation via ctx.db.normalizeId().
    // ------------------------------------------------------------------------

    const metadata = object?.metadata as Record<string, string> | undefined;

    const candidatePaymentIntentId = metadata?.paymentIntentId;
    const candidatePaymentAttemptId = metadata?.paymentAttemptId;

    const normalizedState = this.normalizeEventType(eventType);

    // ------------------------------------------------------------------------
    // CONTRÔLE DE COHÉRENCE
    // ------------------------------------------------------------------------

    if (normalizedState === "succeeded" && !providerTransactionId) {
      return {
        verified: false,
        errorCode: "MISSING_TRANSACTION_ID",
        errorMessage: "Événement succeeded sans identifiant de transaction.",
      };
    }

    // ------------------------------------------------------------------------
    // HASH D'AUDIT — SHA-256 du raw body (DISTINCT du HMAC)
    // ------------------------------------------------------------------------

    const payloadHash = await sha256Hex(input.rawBody);

    const normalizedEvent: NormalizedProviderEvent = {
      provider: this.name,
      providerEventId,
      providerTransactionId,
      paymentIntentId: candidatePaymentIntentId,
      paymentAttemptId: candidatePaymentAttemptId,
      state: normalizedState,
      signature: signatureHeader,
      payloadHash,
      rawPayload: input.rawBody,
    };

    return {
      verified: true,
      event: normalizedEvent,
    };
  }

  private normalizeEventType(
    stripeEventType: string,
  ): NormalizedProviderEvent["state"] {
    switch (stripeEventType) {
      case "payment_intent.succeeded":
        return "succeeded";

      case "payment_intent.processing":
        return "processing";

      case "payment_intent.payment_failed":
        return "failed";

      case "payment_intent.canceled":
        return "cancelled";

      case "charge.refunded":
        return "reversed";

      case "payment_intent.amount_capturable_updated":
        return "pending";

      default:
        return "unknown";
    }
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createStripeProvider(params?: {
  secretKey?: string;
  webhookSecret?: string;
}): StripeProvider {
  return new StripeProvider(params);
}
