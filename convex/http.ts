// convex/http.ts

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { WebhookReceiver } from "livekit-server-sdk";

import { StripeProvider } from "./providers/stripe";
import type { NormalizedProviderEvent } from "./providers/payment_provider";

const http = httpRouter();

/* ============================================================================
 * LIVEKIT WEBHOOK
 * ========================================================================== *
 *
 * Endpoint:
 *
 *   POST /livekit/webhook
 *
 * LiveKit envoie ici les événements serveur, notamment:
 *
 *   egress_ended
 *
 * Le webhook est vérifié cryptographiquement avec:
 *
 *   LIVEKIT_API_KEY
 *   LIVEKIT_API_SECRET
 *
 * ========================================================================== */

function createWebhookReceiver(): WebhookReceiver {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error(
      "LIVEKIT_API_KEY et LIVEKIT_API_SECRET sont requis pour le webhook.",
    );
  }

  return new WebhookReceiver(apiKey, apiSecret);
}

/* ============================================================================
 * ROUTE
 * ========================================================================== */

http.route({
  path: "/livekit/webhook",
  method: "POST",

  handler: httpAction(async (ctx, req) => {
    /* ------------------------------------------------------------------------
     * 1. CORPS BRUT
     * ---------------------------------------------------------------------- */

    /*
     * LiveKit signe le corps exact de la requête.
     *
     * Il est donc essentiel d'utiliser req.text()
     * et de ne pas parser le JSON avant la vérification.
     */
    const body = await req.text();

    /* ------------------------------------------------------------------------
     * 2. SIGNATURE
     * ---------------------------------------------------------------------- */

    /*
     * Le SDK LiveKit attend le header Authorization
     * contenant la signature JWT du webhook.
     */
    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return new Response("missing authorization", {
        status: 401,
      });
    }

    /* ------------------------------------------------------------------------
     * 3. VÉRIFICATION CRYPTOGRAPHIQUE
     * ---------------------------------------------------------------------- */

    let event;

    try {
      const receiver = createWebhookReceiver();

      event = await receiver.receive(body, authorization);
    } catch (error) {
      console.warn(
        "[livekit/webhook] Signature invalide:",
        error instanceof Error ? error.message : error,
      );

      return new Response("invalid signature", {
        status: 401,
      });
    }

    /* ========================================================================
     * EGRESS ENDED
     * ====================================================================== */

    if (event.event === "egress_ended") {
      const info = event.egressInfo;

      if (!info) {
        console.warn("[livekit/webhook] egress_ended sans egressInfo.");

        /*
         * Le webhook est authentifié mais incomplet.
         *
         * On répond 200 afin d'éviter des retries inutiles
         * pour un événement impossible à traiter.
         */
        return new Response("ok", {
          status: 200,
        });
      }

      /* ----------------------------------------------------------------------
       * EGRESS ID
       * -------------------------------------------------------------------- */

      const egressId = info.egressId;

      if (!egressId) {
        console.warn("[livekit/webhook] egress_ended sans egressId.");

        return new Response("ok", {
          status: 200,
        });
      }

      /* ----------------------------------------------------------------------
       * FICHIER PRODUIT PAR EGRESS
       * -------------------------------------------------------------------- */

      const fileResult = info.fileResults?.[0];

      /*
       * FileInfo.location est la propriété utilisée par
       * le SDK LiveKit de ce projet.
       *
       * Ne pas utiliser playlistLocation.
       */
      const location = fileResult?.location;

      /* ----------------------------------------------------------------------
       * DURÉE
       * -------------------------------------------------------------------- */

      /*
       * LiveKit expose la durée en nanosecondes.
       *
       * Conversion:
       *
       *   ns / 1 000 000 = ms
       */
      const durationNs = fileResult?.duration;

      const durationMs =
        durationNs !== undefined && durationNs !== null
          ? Number(durationNs) / 1_000_000
          : undefined;

      /* ----------------------------------------------------------------------
       * ERREUR EGRESS
       * -------------------------------------------------------------------- */

      const error = info.error || undefined;

      /* ----------------------------------------------------------------------
       * CONVEX
       * -------------------------------------------------------------------- */

      /*
       * ⚠️ On pointe vers `liveReplayInternal` et non `liveReplay`.
       *
       * Raison : `convex/liveReplay.ts` est un fichier "use node"
       * qui ne peut exposer QUE des actions. Les mutations internes
       * (comme handleEgressEnded) vivent dans `liveReplayInternal.ts`.
       */
      await ctx.runMutation(internal.liveReplayInternal.handleEgressEnded, {
        egressId,
        url: location || undefined,
        durationMs,
        error,
      });
    }

    /* ========================================================================
     * AUTRES ÉVÉNEMENTS
     * ====================================================================== */

    /*
     * Les autres événements LiveKit sont volontairement
     * acceptés sans traitement.
     *
     * Cela permet d'ajouter ultérieurement:
     *
     *   room_started
     *   room_finished
     *   participant_joined
     *   participant_left
     *   egress_started
     *   etc.
     *
     * sans casser le endpoint actuel.
     */

    return new Response("ok", {
      status: 200,
    });
  }),
});

/* ============================================================================
 * STRIPE WEBHOOK
 * ========================================================================== *
 *
 * Endpoint:
 *
 *   POST /stripe/webhook
 *
 * Le corps est lu via req.text() — JAMAIS parsé avant la vérification de
 * signature. La vérification cryptographique est déléguée à
 * StripeProvider.verifyWebhook() :
 *
 *   - HMAC SHA-256
 *   - comparaison à temps constant
 *   - tolérance timestamp ±300 s
 *   - payloadHash = SHA-256(rawBody) distinct du HMAC
 *
 * L'événement normalisé est ensuite transmis au Payment Core via
 * internal.payments.processVerifiedProviderEvent.
 *
 * Aucun crédit ledger ne peut être écrit sans :
 *   - signature valide ;
 *   - vérification du providerTransactionId réel ;
 *   - confirmation processVerifiedProviderEvent.
 *
 * ========================================================================== */

type ProcessEventEventType =
  | "payment_pending"
  | "payment_processing"
  | "payment_succeeded"
  | "payment_failed"
  | "payment_cancelled"
  | "payment_reversed"
  | "unknown";

function mapStateToEventType(
  state: NormalizedProviderEvent["state"],
): ProcessEventEventType {
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

    default:
      return "unknown";
  }
}

http.route({
  path: "/stripe/webhook",
  method: "POST",

  handler: httpAction(async (ctx, req) => {
    /* ------------------------------------------------------------------------
     * 1. RAW BODY
     * ---------------------------------------------------------------------- */

    const rawBody = await req.text();

    /* ------------------------------------------------------------------------
     * 2. SIGNATURE HEADER
     * ---------------------------------------------------------------------- */

    const stripeSignature = req.headers.get("stripe-signature");

    if (!stripeSignature) {
      return new Response("missing stripe-signature", { status: 401 });
    }

    /* ------------------------------------------------------------------------
     * 3. VÉRIFICATION CRYPTOGRAPHIQUE
     * ---------------------------------------------------------------------- */

    const provider = new StripeProvider();

    const verification = await provider.verifyWebhook({
      rawBody,
      headers: { "stripe-signature": stripeSignature },
    });

    if (!verification.verified || !verification.event) {
      console.warn(
        "[stripe/webhook] Verification failed:",
        verification.errorCode,
        verification.errorMessage,
      );

      return new Response("invalid signature", { status: 401 });
    }

    const event = verification.event;

    /* ------------------------------------------------------------------------
     * 4. FORWARD AU PAYMENT CORE
     * ------------------------------------------------------------------------
     *
     * Les IDs de metadata sont transmis comme candidats (strings) —
     * le Core les validera via ctx.db.normalizeId() côté mutation.
     */

    const eventType = mapStateToEventType(event.state);

    try {
      await ctx.runMutation(internal.payments.processVerifiedProviderEvent, {
        provider: "stripe",
        providerEventId: event.providerEventId,
        providerTransactionId: event.providerTransactionId,
        paymentIntentId: event.paymentIntentId,
        paymentAttemptId: event.paymentAttemptId,
        eventType,
        signature: event.signature,
        payloadHash: event.payloadHash,
        rawPayload: event.rawPayload,
        verified: true,
      });
    } catch (error) {
      console.error(
        "[stripe/webhook] processVerifiedProviderEvent failed:",
        error instanceof Error ? error.message : error,
      );

      /*
       * Retour 500 → Stripe retente selon exponential backoff.
       * La mutation est idempotente via providerEventId,
       * donc un retry ne créera pas de doublon.
       */
      return new Response("processing failed", { status: 500 });
    }

    return new Response("ok", { status: 200 });
  }),
});

export default http;
