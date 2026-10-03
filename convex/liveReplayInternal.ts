import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/* ============================================================================
 * RECORD EGRESS
 * ========================================================================== */

export const recordEgress = internalMutation({
  args: {
    streamId: v.id("liveStreams"),

    egressId: v.string(),

    status: v.union(
      v.literal("starting"),
      v.literal("recording"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("failed"),
    ),
  },

  handler: async (ctx, { streamId, egressId, status }) => {
    const now = Date.now();

    /*
     * Idempotence :
     * si le même Egress est enregistré
     * deux fois, on met simplement à jour
     * l'entrée existante.
     */
    const existing = await ctx.db
      .query("liveStreamReplays")
      .withIndex("by_egress", (q) => q.eq("egressId", egressId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("liveStreamReplays", {
        streamId,
        egressId,
        status,
        createdAt: now,
        updatedAt: now,
      });
    }

    /*
     * Synchronisation du stream principal.
     */
    await ctx.db.patch(streamId, {
      egressId,
      egressStatus: status,
    });
  },
});

/* ============================================================================
 * MARK PROCESSING
 * ========================================================================== */

export const markProcessing = internalMutation({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, { streamId }) => {
    const now = Date.now();

    const rows = await ctx.db
      .query("liveStreamReplays")
      .withIndex("by_stream", (q) => q.eq("streamId", streamId))
      .collect();

    /*
     * Les Egress actifs passent
     * en processing.
     */
    const activeRows = rows.filter(
      (row) => row.status === "starting" || row.status === "recording",
    );

    for (const row of activeRows) {
      await ctx.db.patch(row._id, {
        status: "processing",
        updatedAt: now,
      });
    }

    await ctx.db.patch(streamId, {
      egressStatus: "processing",
    });
  },
});

/* ============================================================================
 * HANDLE EGRESS ENDED
 *
 * Appelé par convex/http.ts après réception
 * du webhook LiveKit `egress_ended`.
 *
 * ⚠️ Convention d'unités :
 *   - Ce mutation REÇOIT `durationMs` (millisecondes), aligné sur
 *     ce que `convex/http.ts` calcule depuis `fileResult.duration`
 *     (nanosecondes LiveKit / 1 000 000).
 *   - La table `liveStreamReplays` stocke `durationSec` (secondes).
 *   - La table `liveStreams` stocke `replayDurationMs` (millisecondes).
 *   - La conversion ms → sec est faite ici, avant l'écriture en base.
 * ========================================================================== */

export const handleEgressEnded = internalMutation({
  args: {
    egressId: v.string(),

    url: v.optional(v.string()),

    // ⚠️ Millisecondes (issu de LiveKit nanos / 1e6 côté http.ts).
    durationMs: v.optional(v.number()),

    sizeBytes: v.optional(v.number()),

    error: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const now = Date.now();

    const row = await ctx.db
      .query("liveStreamReplays")
      .withIndex("by_egress", (q) => q.eq("egressId", args.egressId))
      .first();

    /*
     * Webhook inconnu :
     * ne jamais créer un replay fantôme.
     */
    if (!row) {
      console.warn(`[liveReplayInternal] Egress inconnu: ${args.egressId}`);

      return;
    }

    const failed = Boolean(args.error);

    const status: "ready" | "failed" = failed ? "failed" : "ready";

    /*
     * Conversion ms → sec pour la table liveStreamReplays.
     * On arrondit à la seconde la plus proche.
     */
    const durationSec =
      args.durationMs !== undefined
        ? Math.max(0, Math.round(args.durationMs / 1000))
        : undefined;

    await ctx.db.patch(row._id, {
      status,

      url: args.url,

      durationSec,

      sizeBytes: args.sizeBytes,

      error: args.error,

      updatedAt: now,
    });

    /*
     * Synchronisation du document liveStreams.
     *
     * ⚠️ liveStreams.replayDurationMs est en millisecondes :
     *    on passe directement `args.durationMs`.
     */
    await ctx.db.patch(row.streamId, {
      replayUrl: args.url,

      replayDurationMs: args.durationMs,

      egressId: args.egressId,

      egressStatus: status,
    });
  },
});
