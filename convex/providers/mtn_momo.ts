// ============================================================================
// DÃ‰BROUILLEPAY â€” MTN MoMo PROVIDER
// ============================================================================
//
// Provider : MTN MoMo
// Produit  : MoMo Open APIs â€” Collection / RequestToPay
//
// ============================================================================
//
// CONTRAT API VÃ‰RIFIÃ‰
// -------------------
//
// Le flux Collection / RequestToPay MTN MoMo fonctionne de maniÃ¨re
// asynchrone :
//
//   1. Le serveur DÃ©brouillePay demande un access token.
//   2. Le serveur appelle RequestToPay.
//   3. MTN MoMo retourne HTTP 202 Accepted.
//   4. La transaction est placÃ©e en traitement.
//   5. Le rÃ©sultat final arrive via callback.
//   6. En cas de callback manquant, le statut peut Ãªtre consultÃ© via GET.
//
// Sources MTN MoMo :
//   - MoMo API
//   - RequestToPay
//   - Payment Status
//   - Callback
//
// IMPORTANT
// ---------
//
// Ce fichier implÃ©mente uniquement le contrat rÃ©ellement confirmÃ©.
//
// Il ne fabrique PAS :
//
//   - un endpoint production arbitraire,
//   - un X-Target-Environment arbitraire,
//   - une signature webhook inventÃ©e,
//   - un statut succeeded,
//   - un providerTransactionId fictif.
//
// ============================================================================
//
// PÃ‰RIMÃˆTRE ACTUEL
// ----------------
//
// ImplÃ©mentÃ© :
//
//   âœ… Collection / RequestToPay
//   âœ… Access Token
//   âœ… Payment Status
//   âœ… gestion HTTP 202
//   âœ… mapping des statuts MTN
//   âœ… erreurs provider
//   âœ… configuration serveur
//
// Non dÃ©clarÃ© comme disponible dans cet adapter :
//
//   âŒ Disbursement / Transfer
//   âŒ Webhook vÃ©rifiÃ©
//   âŒ Idempotence externe garantie
//
// Le disbursement devra Ãªtre ajoutÃ© dans une implÃ©mentation sÃ©parÃ©e lorsque
// le compte DÃ©brouillePro sera activÃ© pour le produit MTN correspondant.
//
// ============================================================================

import {
  PaymentProviderError,
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
// TYPES
// ============================================================================

type MtnMomoEnvironment = "sandbox" | "production" | "unknown";

// ============================================================================
// SERVER CONFIGURATION
// ============================================================================
//
// Aucune URL production n'est inventÃ©e.
//
// Le BASE_URL doit Ãªtre fourni par la configuration de l'environnement MTN
// rÃ©ellement attribuÃ© au compte DÃ©brouillePro.
//
// Exemple sandbox connu dans la documentation MTN :
//
//   https://sandbox.momodeveloper.mtn.com
//
// Pour la production, la valeur doit provenir du compte/portail MTN MoMo.
//
// ============================================================================

interface MtnMomoServerConfiguration {
  baseUrl: string;

  subscriptionKey?: string;

  apiUser?: string;

  apiKey?: string;

  environment: MtnMomoEnvironment;

  targetEnvironment?: string;
}

// ============================================================================
// PROVIDER
// ============================================================================

export class MtnMomoProvider implements PaymentProvider {
  readonly name = "mtn_momo" as const;

  // ==========================================================================
  // CAPABILITIES
  // ==========================================================================
  //
  // Cet adapter implÃ©mente actuellement le produit Collection / RequestToPay.
  //
  // Il ne faut donc PAS annoncer outbound=true ici.
  //
  // Le disbursement/transfer possÃ¨de son propre produit MTN MoMo et doit Ãªtre
  // implÃ©mentÃ© sÃ©parÃ©ment aprÃ¨s activation du produit correspondant.
  //
  // Le statut est officiellement disponible via GET.
  //
  // Le callback existe dans le protocole MTN MoMo, mais nous ne le dÃ©clarons
  // pas "verified" dans cet adapter tant qu'un mÃ©canisme d'authentification
  // permettant d'Ã©tablir son authenticitÃ© n'est pas configurÃ©.
  //
  // ==========================================================================

  readonly capabilities: PaymentProviderCapabilities = {
    supportsInbound: true,

    supportsOutbound: false,

    supportsWebhooks: false,

    supportsStatusQuery: true,

    supportsIdempotency: false,
  };

  private readonly configuration: MtnMomoServerConfiguration;

  // ==========================================================================
  // CONSTRUCTOR
  // ==========================================================================

  constructor(params?: {
    baseUrl?: string;
    subscriptionKey?: string;
    apiUser?: string;
    apiKey?: string;
    environment?: MtnMomoEnvironment;
    targetEnvironment?: string;
  }) {
    this.configuration = {
      baseUrl:
        params?.baseUrl ??
        process.env.MTN_MOMO_BASE_URL ??
        "https://sandbox.momodeveloper.mtn.com",

      subscriptionKey:
        params?.subscriptionKey ?? process.env.MTN_MOMO_SUBSCRIPTION_KEY,

      apiUser: params?.apiUser ?? process.env.MTN_MOMO_API_USER,

      apiKey: params?.apiKey ?? process.env.MTN_MOMO_API_KEY,

      environment: params?.environment ?? this.resolveEnvironment(),

      targetEnvironment:
        params?.targetEnvironment ?? process.env.MTN_MOMO_TARGET_ENVIRONMENT,
    };
  }

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  async getConfiguration(): Promise<PaymentProviderConfiguration> {
    const configured = this.hasCompleteServerConfiguration();

    return {
      provider: this.name,

      configured,

      environment: this.configuration.environment,

      capabilities: configured ? this.capabilities : null,
    };
  }

  // ==========================================================================
  // CREATE PAYMENT
  // ==========================================================================
  //
  // Flux :
  //
  //   Payment Core
  //        â”‚
  //        â–¼
  //   createPayment()
  //        â”‚
  //        â”œâ”€â”€ access token
  //        â”‚
  //        â–¼
  //   POST /collection/v1_0/requesttopay
  //        â”‚
  //        â–¼
  //   HTTP 202
  //        â”‚
  //        â–¼
  //   processing
  //
  // IMPORTANT :
  //
  // HTTP 202 NE SIGNIFIE PAS "succeeded".
  //
  // Cela signifie que MTN a acceptÃ© la demande pour traitement.
  //
  // ==========================================================================

  async createPayment(
    request: PaymentProviderRequest,
  ): Promise<PaymentProviderResponse> {
    this.assertConfigured();

    if (request.operation !== "wallet_topup") {
      throw new PaymentProviderError({
        code: "PROVIDER_BAD_REQUEST",

        provider: this.name,

        message:
          "Cet adapter MTN MoMo implÃ©mente actuellement le flux Collection / RequestToPay pour les wallet topup. Le disbursement doit utiliser le produit MTN MoMo Transfer correspondant.",

        retryable: false,
      });
    }

    if (request.direction !== "inbound") {
      throw new PaymentProviderError({
        code: "PROVIDER_BAD_REQUEST",

        provider: this.name,

        message:
          "Le flux RequestToPay MTN MoMo utilisÃ© par cet adapter est un flux entrant.",

        retryable: false,
      });
    }

    const customerReference = request.customerReference?.trim();

    if (!customerReference) {
      throw new PaymentProviderError({
        code: "PROVIDER_BAD_REQUEST",

        provider: this.name,

        message:
          "Le numÃ©ro MSISDN du payeur MTN MoMo est obligatoire pour RequestToPay.",

        retryable: false,
      });
    }

    const subscriptionKey = this.requireSubscriptionKey();

    const apiUser = this.requireApiUser();

    const apiKey = this.requireApiKey();

    const accessToken = await this.createAccessToken({
      subscriptionKey,
      apiUser,
      apiKey,
    });

    // ------------------------------------------------------------------------
    // RÃ‰FÃ‰RENCE EXTERNE
    // ------------------------------------------------------------------------
    //
    // MTN utilise X-Reference-Id pour identifier la demande RequestToPay.
    //
    // Nous ne fabriquons pas un identifiant indÃ©pendant avec Math.random()
    // ou un mÃ©canisme arbitraire.
    //
    // La clÃ© d'idempotence fournie par le Payment Core constitue la meilleure
    // rÃ©fÃ©rence stable disponible dans notre contrat.
    //
    // Si le Payment Core garantit dÃ©jÃ  son unicitÃ©, elle peut Ãªtre utilisÃ©e
    // comme rÃ©fÃ©rence provider.
    //
    // ------------------------------------------------------------------------

    const referenceId = this.normalizeReferenceId(request.idempotencyKey);

    const response = await this.request(
      `${this.configuration.baseUrl}/collection/v1_0/requesttopay`,
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${accessToken}`,

          "Ocp-Apim-Subscription-Key": subscriptionKey,

          "X-Target-Environment": this.requireTargetEnvironment(),

          "X-Reference-Id": referenceId,

          "Content-Type": "application/json",

          Accept: "application/json",
        },

        body: JSON.stringify({
          amount: this.formatAmount(request.amount),

          currency: request.currency,

          externalId: request.paymentIntentId,

          payer: {
            partyIdType: "MSISDN",

            partyId: customerReference,
          },

          payerMessage: request.description ?? "DÃ©brouillePay",

          payeeNote: request.description ?? "DÃ©brouillePay",
        }),
      },
    );

    // ------------------------------------------------------------------------
    // 202 ACCEPTED
    // ------------------------------------------------------------------------
    //
    // MTN documente RequestToPay comme asynchrone.
    //
    // Donc :
    //
    //   202 => processing
    //
    // JAMAIS :
    //
    //   202 => succeeded
    //
    // ------------------------------------------------------------------------

    if (response.status === 202) {
      return {
        state: "processing",

        providerTransactionId: referenceId,

        providerReference: referenceId,

        customerMessage:
          "La demande de paiement MTN MoMo a Ã©tÃ© envoyÃ©e. Le paiement doit encore Ãªtre confirmÃ© par MTN MoMo.",

        requiresCustomerAction: true,

        nextAction: {
          type: "approve_mobile_money",

          message: "Approuvez la demande MTN MoMo sur votre tÃ©lÃ©phone.",
        },
      };
    }

    // ------------------------------------------------------------------------
    // ERREURS HTTP
    // ------------------------------------------------------------------------

    const body = await response.text();

    if (
      response.status === 400 ||
      response.status === 401 ||
      response.status === 403
    ) {
      throw new PaymentProviderError({
        code:
          response.status === 401
            ? "PROVIDER_AUTHENTICATION_FAILED"
            : response.status === 403
              ? "PROVIDER_FORBIDDEN"
              : "PROVIDER_BAD_REQUEST",

        provider: this.name,

        message: `MTN MoMo a refusÃ© la requÃªte (${response.status}).`,

        retryable: false,
      });
    }

    if (response.status === 404) {
      throw new PaymentProviderError({
        code: "PROVIDER_NOT_FOUND",

        provider: this.name,

        message:
          "L'endpoint MTN MoMo demandÃ© n'existe pas ou n'est pas disponible pour cette configuration.",

        retryable: false,
      });
    }

    if (response.status === 408) {
      throw new PaymentProviderError({
        code: "PROVIDER_TIMEOUT",

        provider: this.name,

        message: "MTN MoMo n'a pas rÃ©pondu dans le dÃ©lai attendu.",

        retryable: true,
      });
    }

    if (response.status === 429) {
      throw new PaymentProviderError({
        code: "PROVIDER_RATE_LIMITED",

        provider: this.name,

        message: "MTN MoMo a limitÃ© le nombre de requÃªtes.",

        retryable: true,
      });
    }

    if (response.status >= 500) {
      throw new PaymentProviderError({
        code: "PROVIDER_UNAVAILABLE",

        provider: this.name,

        message: `MTN MoMo est temporairement indisponible (${response.status}).`,

        retryable: true,
      });
    }

    throw new PaymentProviderError({
      code: "PROVIDER_INVALID_RESPONSE",

      provider: this.name,

      message: `RÃ©ponse MTN MoMo inattendue (${response.status}).`,

      retryable: false,
    });
  }

  // ==========================================================================
  // PAYMENT STATUS
  // ==========================================================================
  //
  // Flux :
  //
  //   GET /collection/v1_0/requesttopay/{X-Reference-Id}
  //
  // Le statut retournÃ© par MTN est la source provider.
  //
  // ==========================================================================

  async getPaymentStatus(
    request: PaymentStatusRequest,
  ): Promise<PaymentProviderResponse> {
    this.assertConfigured();

    const providerTransactionId = request.providerTransactionId.trim();

    if (!providerTransactionId) {
      throw new PaymentProviderError({
        code: "PROVIDER_BAD_REQUEST",

        provider: this.name,

        message:
          "providerTransactionId est obligatoire pour consulter le statut MTN MoMo.",

        retryable: false,
      });
    }

    const subscriptionKey = this.requireSubscriptionKey();

    const apiUser = this.requireApiUser();

    const apiKey = this.requireApiKey();

    const accessToken = await this.createAccessToken({
      subscriptionKey,
      apiUser,
      apiKey,
    });

    const response = await this.request(
      `${this.configuration.baseUrl}/collection/v1_0/requesttopay/${encodeURIComponent(
        providerTransactionId,
      )}`,
      {
        method: "GET",

        headers: {
          Authorization: `Bearer ${accessToken}`,

          "Ocp-Apim-Subscription-Key": subscriptionKey,

          "X-Target-Environment": this.requireTargetEnvironment(),

          Accept: "application/json",
        },
      },
    );

    const body = await response.text();

    // ------------------------------------------------------------------------
    // HTTP 200
    // ------------------------------------------------------------------------

    if (response.status === 200) {
      const parsed = this.parseJsonResponse(body);

      const status = extractMtnStatus(parsed);

      const state = normalizeMtnStatus(status);

      return {
        state,

        providerTransactionId,

        rawResponse: body,
      };
    }

    // ------------------------------------------------------------------------
    // ERREURS
    // ------------------------------------------------------------------------

    if (response.status === 401) {
      throw new PaymentProviderError({
        code: "PROVIDER_AUTHENTICATION_FAILED",

        provider: this.name,

        message:
          "MTN MoMo a refusÃ© l'authentification lors de la consultation du statut.",

        retryable: false,
      });
    }

    if (response.status === 403) {
      throw new PaymentProviderError({
        code: "PROVIDER_FORBIDDEN",

        provider: this.name,

        message:
          "MTN MoMo interdit la consultation de ce statut avec les credentials actuels.",

        retryable: false,
      });
    }

    if (response.status === 404) {
      throw new PaymentProviderError({
        code: "PROVIDER_NOT_FOUND",

        provider: this.name,

        message: "La transaction MTN MoMo demandÃ©e n'a pas Ã©tÃ© trouvÃ©e.",

        retryable: false,

        providerTransactionId,
      });
    }

    if (response.status === 408) {
      throw new PaymentProviderError({
        code: "PROVIDER_TIMEOUT",

        provider: this.name,

        message: "MTN MoMo n'a pas rÃ©pondu dans le dÃ©lai attendu.",

        retryable: true,

        providerTransactionId,
      });
    }

    if (response.status === 429) {
      throw new PaymentProviderError({
        code: "PROVIDER_RATE_LIMITED",

        provider: this.name,

        message: "MTN MoMo a limitÃ© la frÃ©quence des consultations de statut.",

        retryable: true,

        providerTransactionId,
      });
    }

    if (response.status >= 500) {
      throw new PaymentProviderError({
        code: "PROVIDER_UNAVAILABLE",

        provider: this.name,

        message:
          "Le service de statut MTN MoMo est temporairement indisponible.",

        retryable: true,

        providerTransactionId,
      });
    }

    throw new PaymentProviderError({
      code: "PROVIDER_INVALID_RESPONSE",

      provider: this.name,

      message: `Impossible de consulter le statut MTN MoMo (${response.status}).`,

      retryable: false,

      providerTransactionId,
    });
  }

  // ==========================================================================
  // VERIFY WEBHOOK
  // ==========================================================================
  //
  // MTN documente un callback final pour RequestToPay.
  //
  // Le callback est configurÃ© cÃ´tÃ© plateforme/account portal et MTN indique
  // Ã©galement que le callback peut Ãªtre utilisÃ© comme rÃ©sultat final.
  //
  // PROBLÃˆME DE SÃ‰CURITÃ‰ :
  //
  // Notre contrat PaymentProvider exige une preuve fiable avant que le
  // Payment Core puisse crÃ©diter le ledger.
  //
  // Le simple fait de recevoir un JSON depuis une URL HTTP ne constitue pas
  // une authentification cryptographique.
  //
  // Nous refusons donc de transformer automatiquement :
  //
  //   {
  //      status: "SUCCESSFUL"
  //   }
  //
  // en :
  //
  //   verified: true
  //
  // tant que le mÃ©canisme d'authentification rÃ©ellement configurÃ© pour
  // DÃ©brouillePro n'est pas Ã©tabli.
  //
  // Le Payment Core pourra utiliser getPaymentStatus() comme source de
  // vÃ©rification de secours.
  //
  // ==========================================================================

  async verifyWebhook(
    input: ProviderWebhookInput,
  ): Promise<VerifiedWebhookResult> {
    if (!input.rawBody.trim()) {
      return {
        verified: false,

        errorCode: "INVALID_PAYLOAD",

        errorMessage: "Payload MTN MoMo vide.",
      };
    }

    return {
      verified: false,

      errorCode: "INVALID_PAYLOAD",

      errorMessage:
        "Le callback MTN MoMo est reconnu comme mÃ©canisme asynchrone, mais ce provider ne marque aucun callback comme vÃ©rifiÃ© tant qu'un mÃ©canisme d'authentification fiable n'est pas configurÃ© pour le compte DÃ©brouillePro.",
    };
  }

  // ==========================================================================
  // ACCESS TOKEN
  // ==========================================================================
  //
  // MTN MoMo documente :
  //
  //   POST /collection/token/
  //
  // avec Basic Authentication :
  //
  //   apiUser:apiKey
  //
  // et :
  //
  //   Ocp-Apim-Subscription-Key
  //
  // ==========================================================================

  private async createAccessToken(params: {
    subscriptionKey: string;
    apiUser: string;
    apiKey: string;
  }): Promise<string> {
    const credentials = this.encodeBasicCredentials(
      params.apiUser,
      params.apiKey,
    );

    const response = await this.request(
      `${this.configuration.baseUrl}/collection/token/`,
      {
        method: "POST",

        headers: {
          Authorization: `Basic ${credentials}`,

          "Ocp-Apim-Subscription-Key": params.subscriptionKey,

          "Content-Type": "application/x-www-form-urlencoded",

          Accept: "application/json",
        },

        body: "grant_type=client_credentials",
      },
    );

    const body = await response.text();

    if (response.status === 401) {
      throw new PaymentProviderError({
        code: "PROVIDER_AUTHENTICATION_FAILED",

        provider: this.name,

        message:
          "MTN MoMo a refusÃ© les credentials utilisÃ©s pour gÃ©nÃ©rer l'access token.",

        retryable: false,
      });
    }

    if (response.status === 403) {
      throw new PaymentProviderError({
        code: "PROVIDER_FORBIDDEN",

        provider: this.name,

        message:
          "La souscription MTN MoMo n'autorise pas la gÃ©nÃ©ration du token avec cette configuration.",

        retryable: false,
      });
    }

    if (response.status === 429) {
      throw new PaymentProviderError({
        code: "PROVIDER_RATE_LIMITED",

        provider: this.name,

        message: "MTN MoMo limite actuellement les demandes de token.",

        retryable: true,
      });
    }

    if (response.status >= 500) {
      throw new PaymentProviderError({
        code: "PROVIDER_UNAVAILABLE",

        provider: this.name,

        message:
          "MTN MoMo est temporairement indisponible lors de la gÃ©nÃ©ration du token.",

        retryable: true,
      });
    }

    if (!response.ok) {
      throw new PaymentProviderError({
        code: "PROVIDER_AUTHENTICATION_FAILED",

        provider: this.name,

        message: `Impossible d'obtenir le token MTN MoMo (${response.status}).`,

        retryable: false,
      });
    }

    const parsed = this.parseJsonResponse(body);

    if (typeof parsed !== "object" || parsed === null) {
      throw new PaymentProviderError({
        code: "PROVIDER_INVALID_RESPONSE",

        provider: this.name,

        message: "MTN MoMo a retournÃ© une rÃ©ponse de token invalide.",

        retryable: false,
      });
    }

    const record = parsed as Record<string, unknown>;

    const accessToken = record.access_token;

    if (typeof accessToken !== "string" || !accessToken.trim()) {
      throw new PaymentProviderError({
        code: "PROVIDER_INVALID_RESPONSE",

        provider: this.name,

        message: "MTN MoMo n'a pas retournÃ© d'access token valide.",

        retryable: false,
      });
    }

    return accessToken;
  }

  // ==========================================================================
  // HTTP REQUEST
  // ==========================================================================
  //
  // Encapsulation unique du rÃ©seau.
  //
  // Aucun secret n'est journalisÃ©.
  //
  // ==========================================================================

  private async request(url: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(url, {
        ...init,

        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      throw new PaymentProviderError({
        code: "PROVIDER_TIMEOUT",

        provider: this.name,

        message:
          "La communication avec MTN MoMo a Ã©chouÃ© ou a dÃ©passÃ© le dÃ©lai autorisÃ©.",

        retryable: true,
      });
    }
  }

  // ==========================================================================
  // CONFIGURATION ASSERTION
  // ==========================================================================

  private assertConfigured(): void {
    if (!this.hasCompleteServerConfiguration()) {
      throw new PaymentProviderError({
        code: "PROVIDER_NOT_CONFIGURED",

        provider: this.name,

        message:
          "MTN MoMo n'est pas configurÃ© cÃ´tÃ© serveur. Subscription Key, API User et API Key sont obligatoires.",

        retryable: false,
      });
    }
  }

  // ==========================================================================
  // REQUIRED SUBSCRIPTION KEY
  // ==========================================================================

  private requireSubscriptionKey(): string {
    const value = this.configuration.subscriptionKey?.trim();

    if (!value) {
      throw new PaymentProviderError({
        code: "PROVIDER_NOT_CONFIGURED",

        provider: this.name,

        message: "MTN_MOMO_SUBSCRIPTION_KEY est manquant.",

        retryable: false,
      });
    }

    return value;
  }

  // ==========================================================================
  // REQUIRED API USER
  // ==========================================================================

  private requireApiUser(): string {
    const value = this.configuration.apiUser?.trim();

    if (!value) {
      throw new PaymentProviderError({
        code: "PROVIDER_NOT_CONFIGURED",

        provider: this.name,

        message: "MTN_MOMO_API_USER est manquant.",

        retryable: false,
      });
    }

    return value;
  }

  // ==========================================================================
  // REQUIRED API KEY
  // ==========================================================================

  private requireApiKey(): string {
    const value = this.configuration.apiKey?.trim();

    if (!value) {
      throw new PaymentProviderError({
        code: "PROVIDER_NOT_CONFIGURED",

        provider: this.name,

        message: "MTN_MOMO_API_KEY est manquant.",

        retryable: false,
      });
    }

    return value;
  }

  // ==========================================================================
  // TARGET ENVIRONMENT
  // ==========================================================================

  private requireTargetEnvironment(): string {
    const value = this.configuration.targetEnvironment?.trim();

    if (!value) {
      throw new PaymentProviderError({
        code: "PROVIDER_NOT_CONFIGURED",

        provider: this.name,

        message:
          "MTN_MOMO_TARGET_ENVIRONMENT est manquant. Il doit correspondre Ã  la configuration MTN MoMo rÃ©ellement attribuÃ©e au compte.",

        retryable: false,
      });
    }

    return value;
  }

  // ==========================================================================
  // COMPLETE CONFIGURATION
  // ==========================================================================

  private hasCompleteServerConfiguration(): boolean {
    return Boolean(
      this.configuration.baseUrl.trim() &&
      this.configuration.subscriptionKey?.trim() &&
      this.configuration.apiUser?.trim() &&
      this.configuration.apiKey?.trim() &&
      this.configuration.targetEnvironment?.trim(),
    );
  }

  // ==========================================================================
  // ENVIRONMENT
  // ==========================================================================

  private resolveEnvironment(): MtnMomoEnvironment {
    const value = process.env.MTN_MOMO_ENVIRONMENT;

    if (value === "production") {
      return "production";
    }

    if (value === "sandbox") {
      return "sandbox";
    }

    return "unknown";
  }

  // ==========================================================================
  // REFERENCE NORMALIZATION
  // ==========================================================================
  //
  // MTN attend une rÃ©fÃ©rence de requÃªte.
  //
  // Nous utilisons la clÃ© d'idempotence dÃ©jÃ  produite par le Payment Core.
  //
  // IMPORTANT :
  // le Payment Core doit garantir que cette valeur est unique pour la
  // tentative concernÃ©e.
  //
  // ==========================================================================

  private normalizeReferenceId(value: string): string {
    const normalized = value.trim();

    if (!normalized) {
      throw new PaymentProviderError({
        code: "PROVIDER_BAD_REQUEST",

        provider: this.name,

        message:
          "La clÃ© d'idempotence est obligatoire pour crÃ©er une demande MTN MoMo.",

        retryable: false,
      });
    }

    return normalized;
  }

  // ==========================================================================
  // AMOUNT
  // ==========================================================================

  private formatAmount(amount: number): string {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new PaymentProviderError({
        code: "PROVIDER_BAD_REQUEST",

        provider: this.name,

        message: "Le montant MTN MoMo doit Ãªtre strictement positif.",

        retryable: false,
      });
    }

    return amount.toString();
  }

  // ==========================================================================
  // BASIC AUTH
  // ==========================================================================

  private encodeBasicCredentials(username: string, password: string): string {
    return Buffer.from(`${username}:${password}`, "utf8").toString("base64");
  }

  // ==========================================================================
  // JSON PARSER
  // ==========================================================================

  private parseJsonResponse(body: string): unknown {
    if (!body.trim()) {
      throw new PaymentProviderError({
        code: "PROVIDER_INVALID_RESPONSE",

        provider: this.name,

        message: "MTN MoMo a retournÃ© une rÃ©ponse vide.",

        retryable: false,
      });
    }

    try {
      return JSON.parse(body);
    } catch {
      throw new PaymentProviderError({
        code: "PROVIDER_INVALID_RESPONSE",

        provider: this.name,

        message: "MTN MoMo a retournÃ© une rÃ©ponse JSON invalide.",

        retryable: false,
      });
    }
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createMtnMomoProvider(): MtnMomoProvider {
  return new MtnMomoProvider();
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

function extractMtnStatus(value: unknown): string {
  if (typeof value !== "object" || value === null) {
    return "unknown";
  }

  const record = value as Record<string, unknown>;

  return typeof record.status === "string" ? record.status : "unknown";
}

// ============================================================================
// STATUS NORMALIZATION
// ============================================================================

function normalizeMtnStatus(status: string): PaymentProviderResponse["state"] {
  switch (status.trim().toUpperCase()) {
    case "SUCCESSFUL":
    case "SUCCESS":
      return "succeeded";

    case "PENDING":
      return "pending";

    case "PROCESSING":
      return "processing";

    case "FAILED":
      return "failed";

    case "REJECTED":
      return "failed";

    case "CANCELLED":
    case "CANCELED":
      return "cancelled";

    case "REVERSED":
      return "reversed";

    default:
      return "unknown";
  }
}

// ============================================================================
// END OF FILE
// ============================================================================
//
// MTN MoMo â€” Ã©tat de l'adapter
//
//   Collection / RequestToPay       âœ…
//   Access Token                    âœ…
//   Payment Status                  âœ…
//   202 â†’ processing                âœ…
//   Status â†’ succeeded              âœ…
//   Status â†’ failed                 âœ…
//   Status â†’ reversed               âœ…
//   Disbursement                    â³ autre produit
//   Verified webhook                ðŸ”’ volontairement bloquÃ©
//
// ðŸ”’ = aucun Ã©vÃ©nement externe ne peut encore Ãªtre utilisÃ© seul pour crÃ©diter
//      le ledger tant que son authenticitÃ© n'est pas Ã©tablie.
//
// ============================================================================
//
// AUCUNE SIMULATION.
// AUCUN FAUX SOLDE.
// AUCUN FAUX SUCCÃˆS.
// AUCUN FAUX IDENTIFIANT.
// AUCUN CRÃ‰DIT LEDGER DIRECT.
// ============================================================================

