// convex/http.ts

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { WebhookReceiver } from "livekit-server-sdk";

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

export default http;
