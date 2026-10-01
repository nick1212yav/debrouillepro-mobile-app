import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

type LegacyStream = {
  _id: Id<"liveStreams">;
  schemaVersion?: number;
  isPublic: boolean;
  status: "scheduled" | "live" | "ended" | "cancelled";
  moderationStatus?: "pending" | "approved" | "rejected";
  visibility?: "public" | "followers" | "private";
  isActive?: boolean;
  isDeleted?: boolean;
  isPinned?: boolean;
  createdAt?: number;
  updatedAt?: number;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
};

function parseLegacyTimestamp(value: string | undefined): number | null {
  if (!value) return null;

  const trimmed = value.trim();

  if (!trimmed) return null;

  const numeric = Number(trimmed);

  if (Number.isFinite(numeric)) {
    // Ancien timestamp Unix en secondes.
    if (numeric < 1_000_000_000_000) {
      return Math.round(numeric * 1000);
    }

    // Timestamp Unix déjà exprimé en millisecondes.
    return Math.round(numeric);
  }

  const parsed = Date.parse(trimmed);

  return Number.isFinite(parsed) ? parsed : null;
}

function getBestLegacyTimestamp(
  stream: LegacyStream,
  ...values: Array<string | undefined>
): number | null {
  for (const value of values) {
    const parsed = parseLegacyTimestamp(value);

    if (parsed !== null) {
      return parsed;
    }
  }

  if (stream.createdAt !== undefined) {
    return stream.createdAt;
  }

  if (stream.updatedAt !== undefined) {
    return stream.updatedAt;
  }

  return null;
}

/**
 * Phase 7B
 *
 * Backfill des documents liveStreams vers le contrat canonique.
 *
 * Garanties :
 * - aucune suppression ;
 * - migration idempotente ;
 * - les valeurs canoniques existantes ne sont jamais remplacées ;
 * - les timestamps legacy valides sont convertis en Unix ms ;
 * - isPublic est utilisé uniquement pour reconstruire visibility ;
 * - un startedAt ne transforme jamais à lui seul un stream en live.
 */
export const migrateLiveStreams = internalMutation({
  args: {},

  handler: async (ctx) => {
    const streams = await ctx.db.query("liveStreams").collect();

    let scanned = 0;
    let migrated = 0;
    let alreadyCanonical = 0;
    let skipped = 0;
    let invalidTimestamps = 0;

    const migratedIds: string[] = [];
    const skippedIds: string[] = [];
    const invalidTimestampIds: string[] = [];

    for (const rawStream of streams) {
      scanned++;

      const stream = rawStream as LegacyStream;

      const patch: {
        schemaVersion?: number;
        createdAt?: number;
        updatedAt?: number;
        moderationStatus?: "pending" | "approved" | "rejected";
        visibility?: "public" | "followers" | "private";
        isActive?: boolean;
        isDeleted?: boolean;
        isPinned?: boolean;
      } = {};

      // ─────────────────────────────────────────────
      // schemaVersion
      // ─────────────────────────────────────────────

      if (stream.schemaVersion === undefined) {
        patch.schemaVersion = 1;
      }

      // ─────────────────────────────────────────────
      // moderationStatus
      // ─────────────────────────────────────────────

      if (stream.moderationStatus === undefined) {
        patch.moderationStatus = "approved";
      }

      // ─────────────────────────────────────────────
      // visibility
      // ─────────────────────────────────────────────

      if (stream.visibility === undefined) {
        patch.visibility = stream.isPublic ? "public" : "private";
      }

      // ─────────────────────────────────────────────
      // isDeleted
      // ─────────────────────────────────────────────

      if (stream.isDeleted === undefined) {
        patch.isDeleted = false;
      }

      // ─────────────────────────────────────────────
      // isPinned
      // ─────────────────────────────────────────────

      if (stream.isPinned === undefined) {
        patch.isPinned = false;
      }

      // ─────────────────────────────────────────────
      // isActive
      // ─────────────────────────────────────────────
      //
      // Seul status === "live" peut reconstruire
      // un état actif.
      //
      if (stream.isActive === undefined) {
        patch.isActive = stream.status === "live";
      }

      // ─────────────────────────────────────────────
      // createdAt
      // ─────────────────────────────────────────────
      //
      // Priorité historique :
      // 1. scheduledAt
      // 2. startedAt
      // 3. endedAt
      // 4. createdAt existant
      // 5. updatedAt existant
      //
      if (stream.createdAt === undefined) {
        const createdAt = getBestLegacyTimestamp(
          stream,
          stream.scheduledAt,
          stream.startedAt,
          stream.endedAt,
        );

        if (createdAt !== null) {
          patch.createdAt = createdAt;
        }
      }

      // ─────────────────────────────────────────────
      // updatedAt
      // ─────────────────────────────────────────────
      //
      // Priorité :
      // 1. endedAt
      // 2. startedAt
      // 3. scheduledAt
      // 4. createdAt / updatedAt existants
      //
      if (stream.updatedAt === undefined) {
        const updatedAt = getBestLegacyTimestamp(
          stream,
          stream.endedAt,
          stream.startedAt,
          stream.scheduledAt,
        );

        if (updatedAt !== null) {
          patch.updatedAt = updatedAt;
        }
      }

      // ─────────────────────────────────────────────
      // Validation des timestamps legacy
      // ─────────────────────────────────────────────

      let hasInvalidTimestamp = false;

      const legacyTimestamps = [
        stream.scheduledAt,
        stream.startedAt,
        stream.endedAt,
      ];

      for (const value of legacyTimestamps) {
        if (value !== undefined && parseLegacyTimestamp(value) === null) {
          hasInvalidTimestamp = true;
          invalidTimestamps++;
        }
      }

      if (hasInvalidTimestamp) {
        invalidTimestampIds.push(String(stream._id));
      }

      // ─────────────────────────────────────────────
      // Aucun changement
      // ─────────────────────────────────────────────

      if (Object.keys(patch).length === 0) {
        alreadyCanonical++;
        continue;
      }

      // ─────────────────────────────────────────────
      // Application du backfill
      // ─────────────────────────────────────────────

      await ctx.db.patch(stream._id, patch);

      migrated++;
      migratedIds.push(String(stream._id));
    }

    return {
      scanned,
      migrated,
      alreadyCanonical,
      skipped,
      invalidTimestamps,
      migratedIds,
      skippedIds,
      invalidTimestampIds,
    };
  },
});
