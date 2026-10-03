// convex/liveReplay.ts
"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

import { EgressClient, EncodedFileOutput, S3Upload } from "livekit-server-sdk";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type ReplayResult = {
  egressId: string | null;
};

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const ROOM_PREFIX = "stream-";

/*
 * LiveKit EgressStatus :
 *   0 = EGRESS_STARTING
 *   1 = EGRESS_ACTIVE
 *   2 = EGRESS_ENDING
 *   3 = EGRESS_COMPLETE
 *   4 = EGRESS_FAILED
 *   5 = EGRESS_ABORTED
 *   6 = EGRESS_LIMIT_REACHED
 *
 * On considère "en cours" tout ce qui est < 3.
 */
const EGRESS_STATUS_ENDING = 2;
const EGRESS_STATUS_COMPLETE = 3;

/* ============================================================================
 * LIVEKIT EGRESS CLIENT
 * ========================================================================== */

function getEgressClient(): EgressClient {
  const host = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!host || !apiKey || !apiSecret) {
    throw new Error("LIVEKIT_CONFIGURATION_MISSING");
  }

  const httpUrl = host.replace(/^ws/, "http");

  return new EgressClient(httpUrl, apiKey, apiSecret);
}

/* ============================================================================
 * ROOM NAME
 * ========================================================================== */

function getRoomName(streamId: string): string {
  return `${ROOM_PREFIX}${streamId}`;
}

/* ============================================================================
 * REPLAY OUTPUT
 * ========================================================================== */

function getReplayOutput(streamId: string): EncodedFileOutput | null {
  const bucket = process.env.REPLAY_S3_BUCKET;

  const region = process.env.REPLAY_S3_REGION ?? "auto";

  const endpoint = process.env.REPLAY_S3_ENDPOINT;

  const accessKey = process.env.REPLAY_S3_ACCESS_KEY;

  const secretKey = process.env.REPLAY_S3_SECRET_KEY;

  /*
   * Le replay est optionnel tant que R2/S3
   * n'est pas encore configuré.
   */
  if (!bucket || !accessKey || !secretKey) {
    return null;
  }

  const filepath = `replays/${streamId}-${Date.now()}.mp4`;

  return new EncodedFileOutput({
    filepath,

    output: {
      case: "s3",

      value: new S3Upload({
        bucket,
        region,
        endpoint,
        accessKey,
        secret: secretKey,
        forcePathStyle: Boolean(endpoint),
      }),
    },
  });
}

/* ============================================================================
 * START REPLAY EGRESS
 *
 * Appelé depuis liveStreams.startStream via :
 *   ctx.scheduler.runAfter(0, internal.liveReplay.startReplayEgress, { streamId })
 * ========================================================================== */

export const startReplayEgress = internalAction({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, { streamId }): Promise<ReplayResult> => {
    /*
     * Si R2/S3 n'est pas configuré,
     * le live continue normalement sans replay.
     */
    const output = getReplayOutput(String(streamId));

    if (!output) {
      console.warn("[liveReplay] R2/S3 non configuré — Egress non démarré.");

      return {
        egressId: null,
      };
    }

    const egress = getEgressClient();

    const roomName = getRoomName(String(streamId));

    /* ------------------------------------------------------------------------
     * Évite plusieurs Egress simultanés sur la même room.
     * ---------------------------------------------------------------------- */

    let existing: Awaited<ReturnType<typeof egress.listEgress>> = [];

    try {
      existing = await egress.listEgress({ roomName });
    } catch (error) {
      console.warn("[liveReplay] listEgress failed:", error);
    }

    /*
     * On cherche un Egress encore vivant :
     *   - status !== COMPLETE (3)
     *   - on garde aussi les STARTING/ACTIVE/ENDING
     */
    const activeEgress = existing.find(
      (item) => item.status < EGRESS_STATUS_COMPLETE,
    );

    if (activeEgress) {
      console.info(
        `[liveReplay] Egress déjà actif: ${activeEgress.egressId} (status ${activeEgress.status})`,
      );

      return {
        egressId: activeEgress.egressId,
      };
    }

    /* ------------------------------------------------------------------------
     * Enregistre toute la Room LiveKit.
     * ---------------------------------------------------------------------- */

    let info;

    try {
      info = await egress.startRoomCompositeEgress(roomName, {
        file: output,
      });
    } catch (error) {
      console.error("[liveReplay] startRoomCompositeEgress failed:", error);

      /*
       * La room n'existe peut-être pas encore.
       * On ne casse pas le démarrage du live pour autant.
       */
      return {
        egressId: null,
      };
    }

    /* ------------------------------------------------------------------------
     * La persistance DB est déléguée
     * au module non-Node (liveReplayInternal).
     * ---------------------------------------------------------------------- */

    await ctx.runMutation(internal.liveReplayInternal.recordEgress, {
      streamId,

      egressId: info.egressId,

      status: "recording",
    });

    return {
      egressId: info.egressId,
    };
  },
});

/* ============================================================================
 * STOP REPLAY EGRESS
 *
 * Appelé depuis liveStreams.endStream via :
 *   ctx.scheduler.runAfter(0, internal.liveReplay.stopReplayEgress, { streamId })
 * ========================================================================== */

export const stopReplayEgress = internalAction({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, { streamId }): Promise<{ ok: boolean }> => {
    /*
     * S3 non configuré → aucun Egress en cours, on sort proprement.
     */
    if (!process.env.REPLAY_S3_BUCKET) {
      return { ok: true };
    }

    const egress = getEgressClient();

    const roomName = getRoomName(String(streamId));

    let list;

    try {
      list = await egress.listEgress({ roomName });
    } catch (error) {
      console.error("[liveReplay] Impossible de lister les Egress:", error);

      await ctx.runMutation(internal.liveReplayInternal.markProcessing, {
        streamId,
      });

      return {
        ok: false,
      };
    }

    let stopped = false;

    for (const item of list) {
      /*
       * On stoppe tout ce qui est ACTIVE (1) ou ENDING (2).
       * Les COMPLETE (3) et FAILED (4+) sont déjà terminés.
       */
      if (item.status >= EGRESS_STATUS_COMPLETE) {
        continue;
      }

      try {
        await egress.stopEgress(item.egressId);

        stopped = true;
      } catch (error) {
        console.warn(
          `[liveReplay] stopEgress failed (${item.egressId}):`,
          error,
        );
      }
    }

    /*
     * Le fichier passe en processing.
     *
     * Le webhook `egress_ended` terminera ensuite le cycle
     * en marquant `ready` (ou `failed`).
     */
    await ctx.runMutation(internal.liveReplayInternal.markProcessing, {
      streamId,
    });

    return {
      ok: stopped || list.length === 0,
    };
  },
});
