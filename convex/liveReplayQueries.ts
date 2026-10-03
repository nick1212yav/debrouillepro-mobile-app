// convex/liveReplayQueries.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

/* ============================================================================
 * GET REPLAY
 * ========================================================================== */

export const getReplay = query({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, { streamId }) => {
    const row = await ctx.db
      .query("liveStreamReplays")
      .withIndex("by_stream", (q) => q.eq("streamId", streamId))
      .order("desc")
      .first();

    if (!row) {
      return null;
    }

    return {
      status: row.status,

      url: row.url ?? null,

      durationSec: row.durationSec ?? null,

      sizeBytes: row.sizeBytes ?? null,

      egressId: row.egressId,

      error: row.error ?? null,

      createdAt: row.createdAt,

      updatedAt: row.updatedAt,
    };
  },
});
