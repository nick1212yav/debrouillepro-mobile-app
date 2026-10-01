import { internalQuery } from "./_generated/server";

function parseLegacyTimestamp(value: string | undefined): number | null {
  if (!value) return null;

  const trimmed = value.trim();

  if (!trimmed) return null;

  const numeric = Number(trimmed);

  if (Number.isFinite(numeric)) {
    // Timestamp Unix en secondes.
    if (numeric < 1_000_000_000_000) {
      return Math.round(numeric * 1000);
    }

    // Timestamp Unix en millisecondes.
    return Math.round(numeric);
  }

  const parsed = Date.parse(trimmed);

  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Audit READ-ONLY de l'état canonique Live.
 *
 * Vérifie :
 * - la version de schéma des streams ;
 * - les champs legacy encore présents ;
 * - les timestamps legacy ;
 * - les champs canoniques obligatoires ;
 * - l'intégrité de liveStreamPresence ;
 * - les doublons de présence.
 *
 * Cette query ne modifie aucune donnée.
 *
 */
export const auditLiveMigration = internalQuery({
  args: {},

  handler: async (ctx) => {
    const streams = await ctx.db.query("liveStreams").collect();
    const presence = await ctx.db.query("liveStreamPresence").collect();

    let canonical = 0;
    let needsMigration = 0;

    let missingSchemaVersion = 0;
    let oldSchemaVersion = 0;
    let canonicalSchemaVersion = 0;

    let legacyThumbnail = 0;
    let legacyStreamUrl = 0;
    let legacyIsPublic = 0;

    let legacyScheduledAt = 0;
    let legacyStartedAt = 0;
    let legacyEndedAt = 0;

    let validScheduledAt = 0;
    let invalidScheduledAt = 0;

    let validStartedAt = 0;
    let invalidStartedAt = 0;

    let validEndedAt = 0;
    let invalidEndedAt = 0;

    let missingCreatedAt = 0;
    let missingUpdatedAt = 0;

    let missingModerationStatus = 0;
    let missingVisibility = 0;
    let missingIsActive = 0;
    let missingIsDeleted = 0;
    let missingIsPinned = 0;

    const problematicStreams: Array<{
      id: string;
      title: string;
      schemaVersion: number | undefined;
      issues: string[];
    }> = [];

    // ============================================================
    // STREAMS
    // ============================================================

    for (const stream of streams) {
      const issues: string[] = [];

      // ----------------------------------------------------------
      // Schema version
      // ----------------------------------------------------------

      if (stream.schemaVersion === undefined) {
        missingSchemaVersion++;
        issues.push("missing_schemaVersion");
      } else if (stream.schemaVersion < 1) {
        oldSchemaVersion++;
        issues.push("old_schemaVersion");
      } else {
        canonicalSchemaVersion++;
      }

      // ----------------------------------------------------------
      // Legacy media
      // ----------------------------------------------------------

      if (stream.thumbnailUrl !== undefined) {
        legacyThumbnail++;
        issues.push("legacy_thumbnailUrl");
      }

      if (stream.streamUrl !== undefined) {
        legacyStreamUrl++;
        issues.push("legacy_streamUrl");
      }

      // ----------------------------------------------------------
      // Legacy visibility
      // ----------------------------------------------------------

      if (stream.isPublic !== undefined) {
        legacyIsPublic++;
      }

      // ----------------------------------------------------------
      // Legacy timestamps
      // ----------------------------------------------------------

      if (stream.scheduledAt !== undefined) {
        legacyScheduledAt++;

        if (parseLegacyTimestamp(stream.scheduledAt) !== null) {
          validScheduledAt++;
        } else {
          invalidScheduledAt++;
          issues.push("invalid_scheduledAt");
        }
      }

      if (stream.startedAt !== undefined) {
        legacyStartedAt++;

        if (parseLegacyTimestamp(stream.startedAt) !== null) {
          validStartedAt++;
        } else {
          invalidStartedAt++;
          issues.push("invalid_startedAt");
        }
      }

      if (stream.endedAt !== undefined) {
        legacyEndedAt++;

        if (parseLegacyTimestamp(stream.endedAt) !== null) {
          validEndedAt++;
        } else {
          invalidEndedAt++;
          issues.push("invalid_endedAt");
        }
      }

      // ----------------------------------------------------------
      // Canonical timestamps
      // ----------------------------------------------------------

      if (stream.createdAt === undefined) {
        missingCreatedAt++;
        issues.push("missing_createdAt");
      }

      if (stream.updatedAt === undefined) {
        missingUpdatedAt++;
        issues.push("missing_updatedAt");
      }

      // ----------------------------------------------------------
      // Canonical moderation / visibility / state
      // ----------------------------------------------------------

      if (stream.moderationStatus === undefined) {
        missingModerationStatus++;
        issues.push("missing_moderationStatus");
      }

      if (stream.visibility === undefined) {
        missingVisibility++;
        issues.push("missing_visibility");
      }

      if (stream.isActive === undefined) {
        missingIsActive++;
        issues.push("missing_isActive");
      }

      if (stream.isDeleted === undefined) {
        missingIsDeleted++;
        issues.push("missing_isDeleted");
      }

      if (stream.isPinned === undefined) {
        missingIsPinned++;
        issues.push("missing_isPinned");
      }

      // ----------------------------------------------------------
      // Classification
      // ----------------------------------------------------------

      if (issues.length === 0) {
        canonical++;
      } else {
        needsMigration++;

        if (problematicStreams.length < 100) {
          problematicStreams.push({
            id: String(stream._id),
            title: stream.title,
            schemaVersion: stream.schemaVersion,
            issues,
          });
        }
      }
    }

    // ============================================================
    // PRESENCE
    // ============================================================

    const presenceKeys = new Map<string, number>();

    let presenceWithUser = 0;
    let presenceWithSession = 0;
    let presenceWithNeither = 0;
    let presenceWithBoth = 0;

    for (const row of presence) {
      const hasUser = row.userId !== undefined;
      const hasSession = row.sessionId !== undefined;

      if (hasUser) {
        presenceWithUser++;
      }

      if (hasSession) {
        presenceWithSession++;
      }

      if (!hasUser && !hasSession) {
        presenceWithNeither++;
      }

      if (hasUser && hasSession) {
        presenceWithBoth++;
      }

      if (hasUser) {
        const key = `${String(row.streamId)}::user::${String(row.userId)}`;

        presenceKeys.set(key, (presenceKeys.get(key) ?? 0) + 1);
      }

      if (hasSession) {
        const key = `${String(row.streamId)}::session::${String(row.sessionId)}`;

        presenceKeys.set(key, (presenceKeys.get(key) ?? 0) + 1);
      }
    }

    let duplicatePresenceKeys = 0;

    for (const count of presenceKeys.values()) {
      if (count > 1) {
        duplicatePresenceKeys++;
      }
    }

    // ============================================================
    // RESULT
    // ============================================================

    return {
      generatedAt: Date.now(),

      streams: {
        total: streams.length,
        canonical,
        needsMigration,
        missingSchemaVersion,
        oldSchemaVersion,
        canonicalSchemaVersion,
      },

      legacyFields: {
        thumbnailUrl: legacyThumbnail,
        streamUrl: legacyStreamUrl,
        isPublic: legacyIsPublic,
        scheduledAt: legacyScheduledAt,
        startedAt: legacyStartedAt,
        endedAt: legacyEndedAt,
      },

      timestamps: {
        scheduledAt: {
          total: legacyScheduledAt,
          valid: validScheduledAt,
          invalid: invalidScheduledAt,
        },

        startedAt: {
          total: legacyStartedAt,
          valid: validStartedAt,
          invalid: invalidStartedAt,
        },

        endedAt: {
          total: legacyEndedAt,
          valid: validEndedAt,
          invalid: invalidEndedAt,
        },

        missingCreatedAt,
        missingUpdatedAt,
      },

      canonicalFields: {
        missingModerationStatus,
        missingVisibility,
        missingIsActive,
        missingIsDeleted,
        missingIsPinned,
      },

      currentPresence: {
        total: presence.length,
        withUserId: presenceWithUser,
        withSessionId: presenceWithSession,
        withNeither: presenceWithNeither,
        withBoth: presenceWithBoth,
        duplicateKeys: duplicatePresenceKeys,
      },

      problematicStreams,
    };
  },
});
