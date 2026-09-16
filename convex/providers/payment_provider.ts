// ============================================================================
// DÉBROUILLEPAY — PAYMENT PROVIDER CONTRACT
// ============================================================================
//
// Contrat central strict utilisé par tous les providers de paiement.
//
// Providers supportés :
//   - Orange Money RDC
//   - Vodacom M-Pesa RDC
//   - Airtel Money
//   - MTN MoMo
//
// IMPORTANT
// ---------
// Ce fichier ne réalise AUCUN appel réseau.
//
// Il définit uniquement le contrat que les adapters providers doivent respecter.
//
// Architecture:
//
//   convex/payments.ts
//          │
//          ▼
//   PaymentProvider
//          │
//          ├── OrangeMoneyProvider
//          ├── MpesaProvider
//          ├── AirtelMoneyProvider
//          └── MtnMomoProvider
//
// RÈGLES ABSOLUES
// ---------------
// 1. Aucun paiement ne peut devenir "succeeded" par décision du client.
// 2. Aucun adapter ne peut fabriquer un providerTransactionId.
// 3. Aucun adapter ne peut fabriquer un providerReference.
// 4. Aucun adapter ne peut transformer une absence de réponse en succès.
// 5. Aucun secret provider ne doit apparaître dans les types publics.
// 6. Un webhook doit être vérifié avant d'être transmis au Payment Core.
// 7. Un événement provider doit posséder un identifiant unique lorsqu'il est
//    considéré comme traitable.
// 8. Les providers non configurés doivent REFUSER l'opération.
// 9. Ce contrat ne contient aucune simulation.
// 10. Le ledger financier n'est jamais géré dans ce fichier.
//
// ============================================================================

// ============================================================================
// PROVIDERS
// ============================================================================

export const PAYMENT_PROVIDERS = [
  "orange_money",
  "mpesa",
  "airtel_money",
  "mtn_momo",
] as const;

export type PaymentProviderName = (typeof PAYMENT_PROVIDERS)[number];

// ============================================================================
// PAYMENT DIRECTIONS
// ============================================================================

export const PAYMENT_DIRECTIONS = ["inbound", "outbound"] as const;

export type PaymentDirection = (typeof PAYMENT_DIRECTIONS)[number];

// ============================================================================
// PAYMENT OPERATIONS
// ============================================================================

export const PAYMENT_OPERATIONS = [
  "wallet_topup",
  "wallet_withdrawal",
  "merchant_payment",
  "peer_transfer",
  "refund",
] as const;

export type PaymentOperation = (typeof PAYMENT_OPERATIONS)[number];

// ============================================================================
// PAYMENT STATES
// ============================================================================
//
// Etats du Payment Intent / Payment Core.
//
// created
//   Intent créé mais aucune tentative provider exécutée.
//
// requires_action
//   Une action du client est nécessaire.
//
// processing
//   Provider en cours de traitement.
//
// succeeded
//   Paiement confirmé par une source provider fiable.
//
// failed
//   Paiement définitivement échoué.
//
// cancelled
//   Paiement annulé.
//
// expired
//   Intent expiré.
//
// ============================================================================

export const PAYMENT_STATES = [
  "created",
  "requires_action",
  "processing",
  "succeeded",
  "failed",
  "cancelled",
  "expired",
] as const;

export type PaymentState = (typeof PAYMENT_STATES)[number];

// ============================================================================
// PROVIDER TRANSACTION STATES
// ============================================================================
//
// Etats normalisés d'une transaction provider.
//
// Un provider peut avoir ses propres statuts internes.
// L'adapter les traduit vers cette liste.
//
// ============================================================================

export const PROVIDER_TRANSACTION_STATES = [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "cancelled",
  "reversed",
  "unknown",
] as const;

export type ProviderTransactionState =
  (typeof PROVIDER_TRANSACTION_STATES)[number];

// ============================================================================
// PAYMENT REQUEST
// ============================================================================
//
// Requête interne envoyée par le Payment Core à un adapter.
//
// IMPORTANT
// ---------
// Aucun secret provider ne doit se trouver ici.
//
// Les credentials sont exclusivement récupérés côté serveur dans l'adapter.
//
// ============================================================================

export interface PaymentProviderRequest {
  /**
   * Identifiant interne du Payment Intent.
   *
   * Ne doit jamais être exposé comme secret au provider si celui-ci
   * ne le nécessite pas.
   */
  paymentIntentId: string;

  /**
   * Identifiant interne de la tentative.
   */
  paymentAttemptId: string;

  /**
   * Opération métier.
   */
  operation: PaymentOperation;

  /**
   * Direction financière.
   */
  direction: PaymentDirection;

  /**
   * Montant exact demandé.
   *
   * Le Payment Core doit déjà avoir validé que le montant est strictement
   * positif et respecte les règles métier.
   */
  amount: number;

  /**
   * Devise ISO attendue par le Payment Core.
   *
   * Exemples :
   *   CDF
   *   USD
   */
  currency: string;

  /**
   * Référence client / bénéficiaire selon le provider.
   *
   * Exemple :
   *   numéro Mobile Money.
   */
  customerReference?: string;

  /**
   * Référence métier DébrouillePro.
   *
   * Exemples :
   *   orderId
   *   bookingId
   *   serviceId
   */
  referenceId?: string;

  /**
   * Clé d'idempotence interne.
   *
   * Elle doit être stable pour une même tentative logique.
   */
  idempotencyKey: string;

  /**
   * Description optionnelle.
   */
  description?: string;
}

// ============================================================================
// PAYMENT PROVIDER RESPONSE
// ============================================================================
//
// Réponse NORMALISÉE d'un adapter.
//
// Cette structure doit représenter uniquement ce que le provider a réellement
// fourni.
//
// IMPORTANT
// ---------
// Un état "succeeded" est refusé par validateProviderResponse() si aucun
// providerTransactionId réel n'est présent.
//
// ============================================================================

export interface PaymentProviderResponse {
  /**
   * Etat normalisé de la transaction.
   */
  state: ProviderTransactionState;

  /**
   * Identifiant réel attribué par le provider.
   *
   * Obligatoire pour un succès confirmé.
   */
  providerTransactionId?: string;

  /**
   * Référence complémentaire fournie par le provider.
   */
  providerReference?: string;

  /**
   * Message destiné à l'utilisateur.
   *
   * Ne doit jamais contenir de secret.
   */
  customerMessage?: string;

  /**
   * Code d'erreur normalisé.
   */
  errorCode?: PaymentProviderErrorCode;

  /**
   * Message d'erreur non sensible.
   */
  errorMessage?: string;

  /**
   * Le provider exige-t-il une action utilisateur ?
   */
  requiresCustomerAction?: boolean;

  /**
   * Action suivante côté client.
   */
  nextAction?: PaymentNextAction;

  /**
   * Réponse brute minimale utile à l'audit.
   *
   * ATTENTION :
   * aucun token, secret, credential ou donnée sensible ne doit être stocké ici.
   */
  rawResponse?: string;
}

// ============================================================================
// CUSTOMER ACTION
// ============================================================================

export interface PaymentNextAction {
  type: "approve_mobile_money" | "none";

  message?: string;
}

// ============================================================================
// PAYMENT STATUS REQUEST
// ============================================================================
//
// Utilisé lorsqu'une transaction a déjà été soumise au provider.
//
// Exemple:
//
//   createPayment()
//          ↓
//      processing
//          ↓
//   getPaymentStatus()
//          ↓
//      succeeded
//
// ============================================================================

export interface PaymentStatusRequest {
  paymentIntentId: string;

  paymentAttemptId: string;

  providerTransactionId: string;
}

// ============================================================================
// PROVIDER CAPABILITIES
// ============================================================================

export interface PaymentProviderCapabilities {
  /**
   * Le provider accepte-t-il les entrées d'argent ?
   *
   * Exemple :
   *   wallet topup
   *   merchant collection
   */
  supportsInbound: boolean;

  /**
   * Le provider accepte-t-il les sorties d'argent ?
   *
   * Exemple :
   *   wallet withdrawal
   *   disbursement
   */
  supportsOutbound: boolean;

  /**
   * Le provider supporte-t-il les webhooks/callbacks ?
   */
  supportsWebhooks: boolean;

  /**
   * Le provider permet-il une consultation de statut ?
   */
  supportsStatusQuery: boolean;

  /**
   * Le provider supporte-t-il une clé d'idempotence externe ?
   */
  supportsIdempotency: boolean;
}

// ============================================================================
// PROVIDER CONFIGURATION
// ============================================================================
//
// Cette structure peut être retournée au Payment Core.
//
// Aucun secret n'est exposé.
//
// ============================================================================

export interface PaymentProviderConfiguration {
  provider: PaymentProviderName;

  /**
   * true uniquement si la configuration serveur nécessaire existe réellement.
   */
  configured: boolean;

  /**
   * Environnement d'exécution.
   */
  environment: "sandbox" | "production" | "unknown";

  /**
   * Capacités disponibles lorsque le provider est configuré.
   */
  capabilities: PaymentProviderCapabilities | null;
}

// ============================================================================
// NORMALIZED PROVIDER EVENT
// ============================================================================
//
// Tous les webhooks/callbacks doivent être convertis dans cette structure
// avant d'entrer dans le Payment Core.
//
// ============================================================================

export interface NormalizedProviderEvent {
  /**
   * Provider source.
   */
  provider: PaymentProviderName;

  /**
   * Identifiant UNIQUE de l'événement fourni par le provider.
   *
   * Indispensable à l'idempotence des webhooks.
   */
  providerEventId: string;

  /**
   * Identifiant réel de transaction provider.
   */
  providerTransactionId?: string;

  /**
   * Payment Intent interne si résolu.
   */
  paymentIntentId?: string;

  /**
   * Payment Attempt interne si résolu.
   */
  paymentAttemptId?: string;

  /**
   * Etat normalisé.
   */
  state: ProviderTransactionState;

  /**
   * Signature reçue du provider si disponible.
   *
   * Elle ne doit jamais être considérée comme preuve par le client.
   */
  signature?: string;

  /**
   * Empreinte du payload exact reçu.
   *
   * Exemple :
   *   SHA-256 du corps brut.
   */
  payloadHash?: string;

  /**
   * Payload minimal conservé pour audit.
   *
   * Aucun secret ne doit être conservé.
   */
  rawPayload?: string;
}

// ============================================================================
// PROVIDER ERROR CODES
// ============================================================================

export type PaymentProviderErrorCode =
  | "PROVIDER_NOT_CONFIGURED"
  | "PROVIDER_AUTHENTICATION_FAILED"
  | "PROVIDER_BAD_REQUEST"
  | "PROVIDER_UNAUTHORIZED"
  | "PROVIDER_FORBIDDEN"
  | "PROVIDER_NOT_FOUND"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_RATE_LIMITED"
  | "PROVIDER_INVALID_RESPONSE"
  | "PROVIDER_TRANSACTION_FAILED"
  | "PROVIDER_TRANSACTION_REVERSED"
  | "PROVIDER_UNKNOWN_ERROR";

// ============================================================================
// PROVIDER ERROR
// ============================================================================

export class PaymentProviderError extends Error {
  readonly code: PaymentProviderErrorCode;

  readonly provider: PaymentProviderName;

  readonly retryable: boolean;

  readonly providerTransactionId?: string;

  constructor(params: {
    code: PaymentProviderErrorCode;
    provider: PaymentProviderName;
    message: string;
    retryable: boolean;
    providerTransactionId?: string;
  }) {
    super(params.message);

    this.name = "PaymentProviderError";

    this.code = params.code;

    this.provider = params.provider;

    this.retryable = params.retryable;

    this.providerTransactionId = params.providerTransactionId;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ============================================================================
// PAYMENT PROVIDER INTERFACE
// ============================================================================
//
// Toute implémentation concrète doit respecter ce contrat.
//
// ============================================================================

export interface PaymentProvider {
  /**
   * Nom stable du provider.
   */
  readonly name: PaymentProviderName;

  /**
   * Capacités du provider.
   */
  readonly capabilities: PaymentProviderCapabilities;

  /**
   * Vérifie la configuration serveur.
   *
   * Aucun secret ne doit être retourné.
   */
  getConfiguration(): Promise<PaymentProviderConfiguration>;

  /**
   * Soumet réellement un paiement au provider.
   *
   * Cette méthode doit effectuer le véritable appel API lorsque le provider
   * est configuré.
   *
   * INTERDIT :
   *
   *   return {
   *     state: "succeeded",
   *   };
   *
   * sans réponse réelle du provider.
   */
  createPayment(
    request: PaymentProviderRequest,
  ): Promise<PaymentProviderResponse>;

  /**
   * Consulte réellement le statut d'une transaction déjà soumise.
   */
  getPaymentStatus(
    request: PaymentStatusRequest,
  ): Promise<PaymentProviderResponse>;

  /**
   * Vérifie cryptographiquement puis normalise un webhook/callback.
   *
   * IMPORTANT :
   * verifyWebhook() doit retourner verified=true uniquement lorsque
   * l'authenticité du message est effectivement vérifiée.
   */
  verifyWebhook(input: ProviderWebhookInput): Promise<VerifiedWebhookResult>;
}

// ============================================================================
// WEBHOOK INPUT
// ============================================================================
//
// Le rawBody doit rester EXACTEMENT celui reçu par HTTP.
//
// Ne pas parser puis re-sérialiser avant la vérification de signature.
//
// ============================================================================

export interface ProviderWebhookInput {
  /**
   * Corps HTTP brut exact.
   */
  rawBody: string;

  /**
   * Headers HTTP normalisés en minuscules par la couche HTTP.
   */
  headers: Record<string, string | undefined>;
}

// ============================================================================
// VERIFIED WEBHOOK RESULT
// ============================================================================

export interface VerifiedWebhookResult {
  /**
   * true uniquement si le webhook a été authentifié et correctement parsé.
   */
  verified: boolean;

  /**
   * Evénement fiable lorsque verified=true.
   */
  event?: NormalizedProviderEvent;

  /**
   * Erreur de vérification lorsque verified=false.
   */
  errorCode?:
    | "INVALID_SIGNATURE"
    | "INVALID_PAYLOAD"
    | "UNKNOWN_EVENT"
    | "MISSING_EVENT_ID"
    | "MISSING_TRANSACTION_ID";

  /**
   * Message non sensible.
   */
  errorMessage?: string;
}

// ============================================================================
// PROVIDER REGISTRY
// ============================================================================
//
// Registry serveur déterministe.
//
// Le registry ne crée aucun provider automatiquement.
//
// Les adapters réels sont responsables de leur propre configuration.
//
// ============================================================================

const providerRegistry = new Map<PaymentProviderName, PaymentProvider>();

// ============================================================================
// REGISTER PROVIDER
// ============================================================================

export function registerPaymentProvider(provider: PaymentProvider): void {
  if (!provider) {
    throw new Error("Provider de paiement manquant.");
  }

  if (!PAYMENT_PROVIDERS.includes(provider.name)) {
    throw new Error(`Provider de paiement non supporté: ${provider.name}`);
  }

  if (providerRegistry.has(provider.name)) {
    throw new Error(`Provider déjà enregistré: ${provider.name}`);
  }

  providerRegistry.set(provider.name, provider);
}

// ============================================================================
// GET PROVIDER
// ============================================================================

export function getPaymentProvider(
  providerName: PaymentProviderName,
): PaymentProvider {
  const provider = providerRegistry.get(providerName);

  if (!provider) {
    throw new PaymentProviderError({
      code: "PROVIDER_NOT_CONFIGURED",
      provider: providerName,
      message: `Le provider ${providerName} n'est pas configuré côté serveur.`,
      retryable: false,
    });
  }

  return provider;
}

// ============================================================================
// CHECK PROVIDER SUPPORT
// ============================================================================

export function isSupportedPaymentProvider(
  value: string,
): value is PaymentProviderName {
  return (PAYMENT_PROVIDERS as readonly string[]).includes(value);
}

// ============================================================================
// ASSERT PROVIDER SUPPORT
// ============================================================================

export function assertSupportedPaymentProvider(
  value: string,
): asserts value is PaymentProviderName {
  if (!isSupportedPaymentProvider(value)) {
    throw new Error(`Provider de paiement non supporté: ${value}`);
  }
}

// ============================================================================
// PROVIDER FACTORY TYPE
// ============================================================================

export type PaymentProviderFactory = () => PaymentProvider;

// ============================================================================
// VALIDATE PROVIDER RESPONSE
// ============================================================================
//
// Cette fonction constitue une barrière de sécurité entre un adapter et le
// Payment Core.
//
// Elle empêche notamment :
//
//   succeeded
//   +
//   aucun providerTransactionId
//
// ============================================================================

export function validateProviderResponse(
  provider: PaymentProviderName,
  response: PaymentProviderResponse,
): PaymentProviderResponse {
  if (!response) {
    throw new PaymentProviderError({
      code: "PROVIDER_INVALID_RESPONSE",
      provider,
      message: "Le provider a retourné une réponse vide.",
      retryable: true,
    });
  }

  if (!PROVIDER_TRANSACTION_STATES.includes(response.state)) {
    throw new PaymentProviderError({
      code: "PROVIDER_INVALID_RESPONSE",
      provider,
      message: "Le provider a retourné un état de transaction inconnu.",
      retryable: false,
    });
  }

  if (response.state === "succeeded") {
    const transactionId = response.providerTransactionId?.trim();

    if (!transactionId) {
      throw new PaymentProviderError({
        code: "PROVIDER_INVALID_RESPONSE",
        provider,
        message:
          "Le provider a indiqué un succès sans identifiant de transaction réel.",
        retryable: false,
      });
    }

    /**
     * Un succès ne doit pas demander simultanément une action client.
     */
    if (response.requiresCustomerAction === true) {
      throw new PaymentProviderError({
        code: "PROVIDER_INVALID_RESPONSE",
        provider,
        message:
          "Réponse incohérente: transaction réussie avec action client requise.",
        retryable: false,
        providerTransactionId: transactionId,
      });
    }
  }

  if (response.state === "failed") {
    if (!response.errorCode) {
      return {
        ...response,
        errorCode: "PROVIDER_TRANSACTION_FAILED",
      };
    }
  }

  if (response.state === "reversed") {
    if (!response.providerTransactionId?.trim()) {
      throw new PaymentProviderError({
        code: "PROVIDER_INVALID_RESPONSE",
        provider,
        message:
          "Une transaction reversée doit posséder un identifiant provider réel.",
        retryable: false,
      });
    }

    if (!response.errorCode) {
      return {
        ...response,
        errorCode: "PROVIDER_TRANSACTION_REVERSED",
      };
    }
  }

  return response;
}

// ============================================================================
// REQUIRE PROVIDER TRANSACTION ID
// ============================================================================
//
// Utilitaire strict utilisé par le Payment Core lorsqu'un état nécessite
// une transaction externe.
//
// ============================================================================

export function requireProviderTransactionId(
  response: PaymentProviderResponse,
): string {
  const transactionId = response.providerTransactionId?.trim();

  if (!transactionId) {
    throw new PaymentProviderError({
      code: "PROVIDER_INVALID_RESPONSE",
      provider: "orange_money",
      message: "providerTransactionId manquant.",
      retryable: false,
    });
  }

  return transactionId;
}

// ============================================================================
// REQUIRE VERIFIED WEBHOOK EVENT
// ============================================================================
//
// Barrière supplémentaire avant transmission au Payment Core.
//
// ============================================================================

export function requireVerifiedWebhookEvent(
  result: VerifiedWebhookResult,
): NormalizedProviderEvent {
  if (!result.verified) {
    throw new Error(result.errorMessage ?? "Webhook provider non vérifié.");
  }

  if (!result.event) {
    throw new Error("Webhook marqué comme vérifié mais événement absent.");
  }

  if (!result.event.providerEventId.trim()) {
    throw new Error("providerEventId manquant.");
  }

  return result.event;
}

// ============================================================================
// UNCONFIGURED PROVIDER
// ============================================================================
//
// Ce provider est volontairement BLOQUANT.
//
// Il permet au Payment Core de connaître l'existence d'un rail sans jamais
// simuler une transaction.
//
// Exemple:
//
//   Orange Money non configuré
//        ↓
//   createPayment()
//        ↓
//   PROVIDER_NOT_CONFIGURED
//        ↓
//   aucun ledger credit
//
// ============================================================================

export function createUnconfiguredProvider(
  provider: PaymentProviderName,
): PaymentProvider {
  return {
    name: provider,

    capabilities: {
      supportsInbound: false,
      supportsOutbound: false,
      supportsWebhooks: false,
      supportsStatusQuery: false,
      supportsIdempotency: false,
    },

    async getConfiguration() {
      return {
        provider,
        configured: false,
        environment: "unknown",
        capabilities: null,
      };
    },

    async createPayment() {
      throw new PaymentProviderError({
        code: "PROVIDER_NOT_CONFIGURED",
        provider,
        message: `Le provider ${provider} n'est pas configuré côté serveur.`,
        retryable: false,
      });
    },

    async getPaymentStatus() {
      throw new PaymentProviderError({
        code: "PROVIDER_NOT_CONFIGURED",
        provider,
        message: `Le provider ${provider} n'est pas configuré côté serveur.`,
        retryable: false,
      });
    },

    async verifyWebhook() {
      return {
        verified: false,
        errorCode: "INVALID_PAYLOAD",
        errorMessage: `Le provider ${provider} n'est pas configuré.`,
      };
    },
  };
}

// ============================================================================
// PROVIDER LIST
// ============================================================================
//
// Retourne une copie immuable de la liste supportée.
//
// ============================================================================

export function getSupportedPaymentProviders(): readonly PaymentProviderName[] {
  return PAYMENT_PROVIDERS;
}

// ============================================================================
// CAPABILITY CHECKS
// ============================================================================

export function assertProviderCapability(
  provider: PaymentProvider,
  direction: PaymentDirection,
): void {
  if (direction === "inbound" && !provider.capabilities.supportsInbound) {
    throw new PaymentProviderError({
      code: "PROVIDER_BAD_REQUEST",
      provider: provider.name,
      message: `Le provider ${provider.name} ne supporte pas les paiements entrants.`,
      retryable: false,
    });
  }

  if (direction === "outbound" && !provider.capabilities.supportsOutbound) {
    throw new PaymentProviderError({
      code: "PROVIDER_BAD_REQUEST",
      provider: provider.name,
      message: `Le provider ${provider.name} ne supporte pas les paiements sortants.`,
      retryable: false,
    });
  }
}

// ============================================================================
// REQUEST VALIDATION
// ============================================================================
//
// Validation structurelle commune avant appel provider.
//
// La validation métier complète reste dans payments.ts.
//
// ============================================================================

export function validatePaymentProviderRequest(
  request: PaymentProviderRequest,
): void {
  if (!request.paymentIntentId.trim()) {
    throw new Error("paymentIntentId est obligatoire.");
  }

  if (!request.paymentAttemptId.trim()) {
    throw new Error("paymentAttemptId est obligatoire.");
  }

  if (!request.operation) {
    throw new Error("operation est obligatoire.");
  }

  if (!request.direction) {
    throw new Error("direction est obligatoire.");
  }

  if (!Number.isFinite(request.amount) || request.amount <= 0) {
    throw new Error("Le montant du paiement doit être strictement positif.");
  }

  if (!request.currency.trim()) {
    throw new Error("La devise du paiement est obligatoire.");
  }

  if (!request.idempotencyKey.trim()) {
    throw new Error("idempotencyKey est obligatoire.");
  }

  if (
    request.customerReference !== undefined &&
    !request.customerReference.trim()
  ) {
    throw new Error("customerReference ne peut pas être vide.");
  }

  if (request.referenceId !== undefined && !request.referenceId.trim()) {
    throw new Error("referenceId ne peut pas être vide.");
  }
}

// ============================================================================
// WEBHOOK EVENT VALIDATION
// ============================================================================
//
// Validation structurelle après vérification cryptographique.
//
// ============================================================================

export function validateNormalizedProviderEvent(
  event: NormalizedProviderEvent,
): void {
  if (!event.providerEventId.trim()) {
    throw new Error("providerEventId est obligatoire.");
  }

  if (
    event.providerTransactionId !== undefined &&
    !event.providerTransactionId.trim()
  ) {
    throw new Error("providerTransactionId ne peut pas être vide.");
  }

  if (event.paymentIntentId !== undefined && !event.paymentIntentId.trim()) {
    throw new Error("paymentIntentId ne peut pas être vide.");
  }

  if (event.paymentAttemptId !== undefined && !event.paymentAttemptId.trim()) {
    throw new Error("paymentAttemptId ne peut pas être vide.");
  }

  if (event.state === "succeeded" && !event.providerTransactionId?.trim()) {
    throw new Error(
      "Un événement succeeded doit contenir providerTransactionId.",
    );
  }

  if (event.state === "reversed" && !event.providerTransactionId?.trim()) {
    throw new Error(
      "Un événement reversed doit contenir providerTransactionId.",
    );
  }
}

// ============================================================================
// WEBHOOK CAPABILITY CHECK
// ============================================================================

export function assertWebhookSupport(provider: PaymentProvider): void {
  if (!provider.capabilities.supportsWebhooks) {
    throw new PaymentProviderError({
      code: "PROVIDER_BAD_REQUEST",
      provider: provider.name,
      message: `Le provider ${provider.name} ne supporte pas les webhooks.`,
      retryable: false,
    });
  }
}

// ============================================================================
// STATUS QUERY CAPABILITY CHECK
// ============================================================================

export function assertStatusQuerySupport(provider: PaymentProvider): void {
  if (!provider.capabilities.supportsStatusQuery) {
    throw new PaymentProviderError({
      code: "PROVIDER_BAD_REQUEST",
      provider: provider.name,
      message: `Le provider ${provider.name} ne supporte pas la consultation de statut.`,
      retryable: false,
    });
  }
}

// ============================================================================
// IDEMPOTENCY CAPABILITY CHECK
// ============================================================================

export function assertIdempotencySupport(provider: PaymentProvider): void {
  if (!provider.capabilities.supportsIdempotency) {
    throw new PaymentProviderError({
      code: "PROVIDER_BAD_REQUEST",
      provider: provider.name,
      message: `Le provider ${provider.name} ne supporte pas l'idempotence externe.`,
      retryable: false,
    });
  }
}

// ============================================================================
// END OF FILE
// ============================================================================
//
// Ce fichier est volontairement indépendant de :
//
//   - Convex database
//   - HTTP
//   - fetch()
//   - credentials
//   - secrets
//   - Mobile Money SDK
//   - wallet ledger
//
// Les prochains adapters doivent implémenter ce contrat sans jamais simuler
// une réponse provider.
//
// ============================================================================
