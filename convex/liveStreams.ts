// convex/liveStreams.ts

import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { startStreamInternal, endStreamInternal } from "./liveStreamsHelpers";

type AuthCtx = QueryCtx | MutationCtx;

const GIFT_TYPES = ["star", "crown", "fire", "diamond", "rocket"] as const;

const MAX_MESSAGE_LENGTH = 300;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5_000;
const MAX_TAGS = 30;
const MAX_TAG_LENGTH = 50;
const MAX_GIFT_MESSAGE_LENGTH = 500;
const MAX_REPORT_DETAILS_LENGTH = 2_000;

const DEFAULT_GIFT_CURRENCY = "credits";

const PRESENCE_TIMEOUT_MS = 60_000;

/* ============================================================================
 * TIMESTAMP HELPERS
 * ========================================================================== */

const toIso = (ms: number) => new Date(ms).toISOString();

/* ============================================================================
 * AUTHENTICATION
 * ========================================================================== */

async function requireUser(ctx: AuthCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Connexion requise",
    });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Utilisateur introuvable",
    });
  }

  return user;
}

async function getOptionalUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  return ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

/* ============================================================================
 * VALIDATION HELPERS
 * ========================================================================== */

function normalizeTitle(title: string) {
  const value = title.trim();

  if (!value) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: "Le titre du live est obligatoire",
    });
  }

  if (value.length > MAX_TITLE_LENGTH) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: `Le titre ne peut pas dépasser ${MAX_TITLE_LENGTH} caractères`,
    });
  }

  return value;
}

function normalizeDescription(description?: string) {
  if (description === undefined) {
    return undefined;
  }

  const value = description.trim();

  if (!value) {
    return undefined;
  }

  if (value.length > MAX_DESCRIPTION_LENGTH) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: `La description ne peut pas dépasser ${MAX_DESCRIPTION_LENGTH} caractères`,
    });
  }

  return value;
}

function normalizeTags(tags: string[]) {
  if (tags.length > MAX_TAGS) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: `Maximum ${MAX_TAGS} tags`,
    });
  }

  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => tag.slice(0, MAX_TAG_LENGTH)),
    ),
  );
}

function parseLegacyTimestamp(value?: string) {
  if (!value) {
    return undefined;
  }

  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: "Date invalide",
    });
  }

  return timestamp;
}

function assertFinitePositive(value: number, message = "Montant invalide") {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message,
    });
  }
}

function assertFiniteNonNegative(
  value: number,
  message = "Valeur numérique invalide",
) {
  if (!Number.isFinite(value) || value < 0) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message,
    });
  }
}

/* ============================================================================
 * PERMISSIONS
 * ========================================================================== */

function isAdmin(user: { isAdmin?: boolean }) {
  return user.isAdmin === true;
}

async function assertHost(ctx: MutationCtx, streamId: Id<"liveStreams">) {
  const user = await requireUser(ctx);
  const stream = await ctx.db.get(streamId);

  if (!stream) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Stream introuvable",
    });
  }

  if (stream.hostId !== user._id && !isAdmin(user)) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Accès refusé",
    });
  }

  return {
    user,
    stream,
  };
}

async function assertStreamExists(ctx: AuthCtx, streamId: Id<"liveStreams">) {
  const stream = await ctx.db.get(streamId);

  if (!stream) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Stream introuvable",
    });
  }

  return stream;
}

/* ============================================================================
 * MODERATION / BAN HELPERS
 * ========================================================================== */

async function getActiveBan(
  ctx: AuthCtx,
  streamId: Id<"liveStreams">,
  userId: Id<"users">,
) {
  const now = Date.now();

  const bans = await ctx.db
    .query("liveStreamBans")
    .withIndex("by_stream_and_active", (q) =>
      q.eq("streamId", streamId).eq("isActive", true),
    )
    .collect();

  for (const ban of bans) {
    if (ban.userId !== userId) {
      continue;
    }

    if (
      ban.type === "timeout" &&
      ban.expiresAt !== undefined &&
      ban.expiresAt <= now
    ) {
      continue;
    }

    return ban;
  }

  return null;
}

async function isUserRestricted(
  ctx: AuthCtx,
  streamId: Id<"liveStreams">,
  userId: Id<"users">,
) {
  const ban = await getActiveBan(ctx, streamId, userId);

  return ban !== null;
}

async function assertCanChat(
  ctx: MutationCtx,
  stream: {
    _id: Id<"liveStreams">;
  },
  userId: Id<"users">,
) {
  const ban = await getActiveBan(ctx, stream._id, userId);

  if (!ban) {
    return;
  }

  if (ban.type === "ban") {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Vous êtes banni de ce live",
    });
  }

  if (ban.type === "mute") {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Vous êtes réduit au silence sur ce live",
    });
  }

  if (ban.type === "timeout") {
    const remaining =
      ban.expiresAt !== undefined ? Math.max(0, ban.expiresAt - Date.now()) : 0;

    if (remaining > 0) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous êtes temporairement réduit au silence",
      });
    }
  }
}

async function assertCanModerate(
  ctx: MutationCtx,
  streamId: Id<"liveStreams">,
) {
  const user = await requireUser(ctx);
  const stream = await ctx.db.get(streamId);

  if (!stream) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Stream introuvable",
    });
  }

  if (stream.hostId === user._id || isAdmin(user)) {
    return {
      user,
      stream,
    };
  }

  const cohost = await ctx.db
    .query("liveStreamCoHosts")
    .withIndex("by_stream_and_user", (q) =>
      q.eq("streamId", streamId).eq("userId", user._id),
    )
    .first();

  if (
    cohost &&
    cohost.status === "accepted" &&
    (cohost.role === "moderator" || cohost.role === "cohost")
  ) {
    return {
      user,
      stream,
    };
  }

  throw new ConvexError({
    code: "FORBIDDEN",
    message: "Droits de modération insuffisants",
  });
}

/* ============================================================================
 * STREAM VISIBILITY
 * ========================================================================== */

function isPubliclyDiscoverable(stream: {
  status: string;
  moderationStatus?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  visibility?: string;
}) {
  return (
    stream.status === "live" &&
    stream.moderationStatus === "approved" &&
    stream.isActive === true &&
    stream.isDeleted !== true &&
    stream.visibility === "public"
  );
}

/* ============================================================================
 * STREAMS — LIST
 * ========================================================================== */

/**
 * Catalogue Live.
 *
 * `status` accepte désormais `"all"` en plus des statuts individuels.
 *
 *   - "all"     → live + ended avec replay (limités, triés desc)
 *   - "live"    → live uniquement
 *   - autre     → un seul statut
 *
 * Le filtre de visibilité est appliqué PAR STREAM (pas par requête),
 * pour gérer correctement le mélange live/ended.
 */
export const listLiveStreams = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("live"),
        v.literal("scheduled"),
        v.literal("ended"),
        v.literal("all"),
      ),
    ),
  },

  handler: async (ctx, args) => {
    const requested = args.status ?? "live";

    /* ------------------------------------------------------------------------
     * RÉCUPÉRATION BRUTE
     *
     * ⚠️ `Doc<"liveStreams">[]` — sinon TS infère l'union de TOUS les
     * documents du schema et casse tous les accès `.status`, `.hostId`, etc.
     * ---------------------------------------------------------------------- */

    let raw: Doc<"liveStreams">[] = [];

    if (requested === "all") {
      const live = await ctx.db
        .query("liveStreams")
        .withIndex("by_status", (q) => q.eq("status", "live"))
        .order("desc")
        .take(20);

      const ended = await ctx.db
        .query("liveStreams")
        .withIndex("by_status", (q) => q.eq("status", "ended"))
        .order("desc")
        .take(40);

      // On ne garde que les `ended` avec un replay prêt.
      const endedWithReplay = ended.filter((s) => !!s.replayUrl);

      raw = [...live, ...endedWithReplay];
    } else {
      raw = await ctx.db
        .query("liveStreams")
        .withIndex("by_status", (q) => q.eq("status", requested))
        .order("desc")
        .take(20);
    }

    /* ------------------------------------------------------------------------
     * FILTRAGE VISIBILITÉ (par stream)
     * ---------------------------------------------------------------------- */

    const visibleStreams = raw.filter((stream) => {
      if (stream.status === "live") {
        return isPubliclyDiscoverable(stream);
      }

      // scheduled / ended : ne pas exposer les masqués / supprimés
      return (
        stream.moderationStatus === "approved" &&
        stream.isActive === true &&
        stream.isDeleted !== true
      );
    });

    /* ------------------------------------------------------------------------
     * ENRICHISSEMENT
     * ---------------------------------------------------------------------- */

    return Promise.all(
      visibleStreams.map(async (stream) => {
        const host = await ctx.db.get(stream.hostId);
        const now = Date.now();

        const activeViewerCount =
          stream.status === "live"
            ? await ctx.db
                .query("liveStreamPresence")
                .withIndex("by_stream_and_heartbeat", (q) =>
                  q
                    .eq("streamId", stream._id)
                    .gt("lastHeartbeatAt", now - PRESENCE_TIMEOUT_MS),
                )
                .collect()
                .then(
                  (presence) =>
                    presence.filter(
                      (item) => item.leftAt === undefined || item.leftAt > now,
                    ).length,
                )
            : stream.viewerCount;

        return {
          ...stream,
          hostName: host?.name ?? "Inconnu",
          hostAvatar: host?.avatar ?? undefined,
          liveViewerCount: activeViewerCount,
        };
      }),
    );
  },
});

export const listLiveStreamsPaginated = query({
  args: {
    status: v.optional(
      v.union(v.literal("live"), v.literal("scheduled"), v.literal("ended")),
    ),

    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },

  handler: async (ctx, args) => {
    const status = args.status ?? "live";

    const result = await ctx.db
      .query("liveStreams")
      .withIndex("by_status", (q) => q.eq("status", status))
      .order("desc")
      .paginate(args.paginationOpts);

    const page = await Promise.all(
      result.page
        .filter((stream) => {
          if (status === "live") {
            return isPubliclyDiscoverable(stream);
          }

          return (
            stream.moderationStatus === "approved" &&
            stream.isActive === true &&
            stream.isDeleted !== true
          );
        })
        .map(async (stream) => {
          const host = await ctx.db.get(stream.hostId);

          return {
            ...stream,
            hostName: host?.name ?? "Inconnu",
            hostAvatar: host?.avatar ?? undefined,
          };
        }),
    );

    return {
      ...result,
      page,
    };
  },
});

/* ============================================================================
 * STREAM — SINGLE
 * ========================================================================== */

export const getStream = query({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, args) => {
    const stream = await ctx.db.get(args.streamId);

    if (!stream || stream.isDeleted) {
      return null;
    }

    const host = await ctx.db.get(stream.hostId);
    const now = Date.now();

    const activeViewerCount =
      stream.status === "live"
        ? await ctx.db
            .query("liveStreamPresence")
            .withIndex("by_stream_and_heartbeat", (q) =>
              q
                .eq("streamId", args.streamId)
                .gt("lastHeartbeatAt", now - PRESENCE_TIMEOUT_MS),
            )
            .collect()
            .then(
              (presence) =>
                presence.filter(
                  (item) => item.leftAt === undefined || item.leftAt > now,
                ).length,
            )
        : stream.viewerCount;

    const user = await getOptionalUser(ctx);

    let likedByMe = false;

    if (user) {
      const like = await ctx.db
        .query("liveStreamLikes")
        .withIndex("by_user_and_stream", (q) =>
          q.eq("userId", user._id).eq("streamId", args.streamId),
        )
        .first();

      likedByMe = like !== null;
    }

    return {
      ...stream,

      hostName: host?.name ?? "Inconnu",
      hostAvatar: host?.avatar ?? undefined,
      liveViewerCount: activeViewerCount,
      likedByMe,

      replayUrl: stream.replayUrl ?? null,
      replayDurationMs: stream.replayDurationMs ?? null,
      egressStatus: stream.egressStatus ?? null,
      egressId: stream.egressId ?? null,
    };
  },
});

export const getLiveStream = query({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, args) => {
    const stream = await ctx.db.get(args.streamId);

    if (!stream || stream.isDeleted) {
      return null;
    }

    const host = await ctx.db.get(stream.hostId);
    const now = Date.now();

    const activeViewerCount =
      stream.status === "live"
        ? await ctx.db
            .query("liveStreamPresence")
            .withIndex("by_stream_and_heartbeat", (q) =>
              q
                .eq("streamId", args.streamId)
                .gt("lastHeartbeatAt", now - PRESENCE_TIMEOUT_MS),
            )
            .collect()
            .then(
              (presence) =>
                presence.filter(
                  (item) => item.leftAt === undefined || item.leftAt > now,
                ).length,
            )
        : stream.viewerCount;

    return {
      ...stream,

      hostName: host?.name ?? "Inconnu",
      hostAvatar: host?.avatar ?? undefined,
      liveViewerCount: activeViewerCount,

      replayUrl: stream.replayUrl ?? null,
      replayDurationMs: stream.replayDurationMs ?? null,
      egressStatus: stream.egressStatus ?? null,
      egressId: stream.egressId ?? null,
    };
  },
});

/* ============================================================================
 * MY STREAMS
 * ========================================================================== */

export const getMyStreams = query({
  args: {},

  handler: async (ctx) => {
    const user = await getOptionalUser(ctx);

    if (!user) {
      return [];
    }

    return ctx.db
      .query("liveStreams")
      .withIndex("by_host", (q) => q.eq("hostId", user._id))
      .order("desc")
      .take(20);
  },
});

export const getMyActiveStream = query({
  args: {},

  handler: async (ctx) => {
    const user = await getOptionalUser(ctx);

    if (!user) {
      return null;
    }

    const streams = await ctx.db
      .query("liveStreams")
      .withIndex("by_host", (q) => q.eq("hostId", user._id))
      .order("desc")
      .take(20);

    return (
      streams.find(
        (stream) =>
          stream.status === "live" &&
          stream.isActive === true &&
          stream.isDeleted !== true,
      ) ?? null
    );
  },
});

/* ============================================================================
 * CREATE STREAM — LEGACY COMPATIBILITY
 * ========================================================================== */

export const createStream = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    thumbnailUrl: v.optional(v.string()),
    scheduledAt: v.optional(v.string()),
    tags: v.array(v.string()),
    isPublic: v.boolean(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (user.isBanned === true) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Votre compte ne peut pas créer de live",
      });
    }

    const now = Date.now();

    const title = normalizeTitle(args.title);
    const description = normalizeDescription(args.description);
    const tags = normalizeTags(args.tags);

    parseLegacyTimestamp(args.scheduledAt);

    const scheduledAtIso = args.scheduledAt;
    const isScheduled = scheduledAtIso !== undefined;

    const visibility = args.isPublic ? "public" : "private";

    const streamId = await ctx.db.insert("liveStreams", {
      hostId: user._id,
      schemaVersion: 1,

      title,
      description,
      category: args.category.trim() || "general",
      tags,

      thumbnailUrl: args.thumbnailUrl,

      playbackUrl: undefined,
      ingestUrl: undefined,

      replayStorageId: undefined,
      replayUrl: undefined,
      replayDurationMs: undefined,

      egressId: undefined,
      egressStatus: undefined,

      status: isScheduled ? "scheduled" : "live",
      moderationStatus: "approved",

      visibility,

      isActive: true,
      isDeleted: false,
      isPinned: false,

      isPublic: args.isPublic,

      createdAt: now,
      updatedAt: now,

      scheduledAt: scheduledAtIso,
      startedAt: isScheduled ? undefined : toIso(now),
      endedAt: undefined,

      viewerCount: 0,
      peakViewers: 0,
      likeCount: 0,
      chatCount: 0,
      giftCount: 0,
      shareCount: 0,
      totalViewCount: 0,

      city: undefined,
      languageCode: undefined,
    });

    if (!isScheduled) {
      await ctx.scheduler.runAfter(0, internal.liveReplay.startReplayEgress, {
        streamId,
      });
    }

    return streamId;
  },
});

/* ============================================================================
 * START LIVE STREAM — EGRESS V2
 * ========================================================================== */

export const startStream = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    thumbnailUrl: v.optional(v.string()),
    tags: v.array(v.string()),
    isPublic: v.boolean(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (user.isBanned === true) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Votre compte ne peut pas lancer de live",
      });
    }

    const streamId = await startStreamInternal(ctx, user, {
      title: args.title,
      description: args.description,
      category: args.category,
      thumbnailUrl: args.thumbnailUrl,
      tags: args.tags,
      isPublic: args.isPublic,
    });

    await ctx.scheduler.runAfter(0, internal.liveReplay.startReplayEgress, {
      streamId,
    });

    return streamId;
  },
});

/* ============================================================================
 * GO LIVE — SCHEDULED STREAM + EGRESS
 * ========================================================================== */

export const goLive = mutation({
  args: {
    streamId: v.id("liveStreams"),
    streamUrl: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const { stream } = await assertHost(ctx, args.streamId);

    if (stream.status === "ended" || stream.status === "cancelled") {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Ce stream ne peut plus être démarré",
      });
    }

    const egressAlreadyActive =
      stream.egressStatus === "starting" || stream.egressStatus === "recording";

    const now = Date.now();

    await ctx.db.patch(args.streamId, {
      status: "live",
      isActive: true,
      isDeleted: false,
      startedAt: toIso(now),
      updatedAt: now,
      playbackUrl: args.streamUrl,
      streamUrl: args.streamUrl,
    });

    if (!egressAlreadyActive) {
      await ctx.scheduler.runAfter(0, internal.liveReplay.startReplayEgress, {
        streamId: args.streamId,
      });
    }

    return args.streamId;
  },
});

/* ============================================================================
 * END STREAM — STOP EGRESS
 * ========================================================================== */

export const endStream = mutation({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, args) => {
    await assertHost(ctx, args.streamId);

    await endStreamInternal(ctx, args.streamId);

    await ctx.scheduler.runAfter(0, internal.liveReplay.stopReplayEgress, {
      streamId: args.streamId,
    });

    return args.streamId;
  },
});

/* ============================================================================
 * CANCEL STREAM
 * ========================================================================== */

export const cancelStream = mutation({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, args) => {
    await assertHost(ctx, args.streamId);

    const now = Date.now();

    await ctx.db.patch(args.streamId, {
      status: "cancelled",
      isActive: false,
      endedAt: toIso(now),
      updatedAt: now,
      viewerCount: 0,
    });

    await ctx.scheduler.runAfter(0, internal.liveReplay.stopReplayEgress, {
      streamId: args.streamId,
    });

    return args.streamId;
  },
});

/* ============================================================================
 * CHAT — READ
 * ========================================================================== */

export const getStreamMessages = query({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("liveStreamMessages")
      .withIndex("by_stream_createdAt", (q) => q.eq("streamId", args.streamId))
      .order("asc")
      .take(100);

    return Promise.all(
      messages
        .filter(
          (message) =>
            message.isDeleted !== true &&
            message.moderationStatus !== "rejected",
        )
        .map(async (message) => {
          const user = await ctx.db.get(message.userId);

          return {
            ...message,
            userId: message.userId,
            userName: user?.name ?? "Utilisateur",
            userAvatar: user?.avatar ?? undefined,
          };
        }),
    );
  },
});

export const getStreamMessagesPaginated = query({
  args: {
    streamId: v.id("liveStreams"),

    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },

  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("liveStreamMessages")
      .withIndex("by_stream_createdAt", (q) => q.eq("streamId", args.streamId))
      .order("desc")
      .paginate(args.paginationOpts);

    const page = await Promise.all(
      result.page
        .filter(
          (message) =>
            message.isDeleted !== true &&
            message.moderationStatus !== "rejected",
        )
        .map(async (message) => {
          const user = await ctx.db.get(message.userId);

          return {
            ...message,
            userId: message.userId,
            userName: user?.name ?? "Utilisateur",
            userAvatar: user?.avatar ?? undefined,
          };
        }),
    );

    return {
      ...result,
      page,
    };
  },
});

/* ============================================================================
 * CHAT — SEND
 * ========================================================================== */

export const sendMessage = mutation({
  args: {
    streamId: v.id("liveStreams"),

    text: v.string(),

    type: v.optional(
      v.union(v.literal("chat"), v.literal("super_chat"), v.literal("system")),
    ),

    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    giftType: v.optional(v.string()),
    giftQuantity: v.optional(v.number()),
    replyToMessageId: v.optional(v.id("liveStreamMessages")),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (await isUserRestricted(ctx, args.streamId, user._id)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous êtes actuellement restreint sur ce live.",
      });
    }

    const stream = await assertStreamExists(ctx, args.streamId);

    if (
      stream.status !== "live" ||
      stream.isActive !== true ||
      stream.isDeleted === true
    ) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Stream non actif",
      });
    }

    await assertCanChat(ctx, stream, user._id);

    const text = args.text.trim();

    if (!text) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Message vide",
      });
    }

    if (text.length > MAX_MESSAGE_LENGTH) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: `Message trop long (${MAX_MESSAGE_LENGTH} caractères maximum)`,
      });
    }

    if (args.amount !== undefined) {
      assertFiniteNonNegative(args.amount, "Montant invalide");
    }

    if (args.giftQuantity !== undefined) {
      assertFinitePositive(
        args.giftQuantity,
        "La quantité du cadeau doit être supérieure à zéro",
      );
    }

    if (args.replyToMessageId) {
      const parent = await ctx.db.get(args.replyToMessageId);

      if (!parent || parent.streamId !== args.streamId) {
        throw new ConvexError({
          code: "BAD_REQUEST",
          message: "Message parent introuvable",
        });
      }
    }

    const now = Date.now();
    const messageType = args.type ?? "chat";

    const messageId = await ctx.db.insert("liveStreamMessages", {
      streamId: args.streamId,
      userId: user._id,
      text,
      type: messageType,
      amount: args.amount,
      currency: args.currency,
      giftType: args.giftType,
      giftQuantity: args.giftQuantity,
      replyToMessageId: args.replyToMessageId,

      isDeleted: false,
      isPinned: false,

      moderationStatus: "approved",

      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.streamId, {
      chatCount: (stream.chatCount ?? 0) + 1,
      updatedAt: now,
    });

    return messageId;
  },
});

/* ============================================================================
 * SEND STREAM MESSAGE — LEGACY COMPATIBILITY
 * ========================================================================== */

export const sendStreamMessage = mutation({
  args: {
    streamId: v.id("liveStreams"),

    text: v.string(),

    type: v.optional(
      v.union(v.literal("chat"), v.literal("super_chat"), v.literal("system")),
    ),

    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (await isUserRestricted(ctx, args.streamId, user._id)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous êtes actuellement restreint sur ce live.",
      });
    }

    const stream = await assertStreamExists(ctx, args.streamId);

    if (stream.status !== "live") {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Stream non actif",
      });
    }

    await assertCanChat(ctx, stream, user._id);

    const text = args.text.trim();

    if (!text) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Message vide",
      });
    }

    if (text.length > MAX_MESSAGE_LENGTH) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: `Message trop long (${MAX_MESSAGE_LENGTH} caractères maximum)`,
      });
    }

    const now = Date.now();
    const messageType = args.type ?? "chat";

    const messageId = await ctx.db.insert("liveStreamMessages", {
      streamId: args.streamId,
      userId: user._id,
      text,
      type: messageType,
      amount: args.amount,
      currency: args.currency,

      isDeleted: false,
      isPinned: false,

      moderationStatus: "approved",

      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.streamId, {
      chatCount: (stream.chatCount ?? 0) + 1,
      updatedAt: now,
    });

    return messageId;
  },
});

/* ============================================================================
 * LIKES
 * ========================================================================== */

export const likeStream = mutation({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const stream = await assertStreamExists(ctx, args.streamId);

    if (stream.isDeleted === true) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Stream introuvable",
      });
    }

    const existing = await ctx.db
      .query("liveStreamLikes")
      .withIndex("by_user_and_stream", (q) =>
        q.eq("userId", user._id).eq("streamId", args.streamId),
      )
      .first();

    const now = Date.now();
    const currentLikes = stream.likeCount ?? 0;

    if (existing) {
      await ctx.db.delete(existing._id);

      const newCount = Math.max(0, currentLikes - 1);

      await ctx.db.patch(args.streamId, {
        likeCount: newCount,
        updatedAt: now,
      });

      return {
        liked: false,
        likeCount: newCount,
      };
    }

    await ctx.db.insert("liveStreamLikes", {
      streamId: args.streamId,
      userId: user._id,
      likedAt: now,
    });

    const newCount = currentLikes + 1;

    await ctx.db.patch(args.streamId, {
      likeCount: newCount,
      updatedAt: now,
    });

    return {
      liked: true,
      likeCount: newCount,
    };
  },
});

export const getLikeStatus = query({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, args) => {
    const user = await getOptionalUser(ctx);

    if (!user) {
      return {
        liked: false,
      };
    }

    const like = await ctx.db
      .query("liveStreamLikes")
      .withIndex("by_user_and_stream", (q) =>
        q.eq("userId", user._id).eq("streamId", args.streamId),
      )
      .first();

    return {
      liked: like !== null,
    };
  },
});

/* ============================================================================
 * PRESENCE — JOIN
 * ========================================================================== */

export const joinStream = mutation({
  args: {
    streamId: v.id("liveStreams"),
    sessionId: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const stream = await assertStreamExists(ctx, args.streamId);

    if (
      stream.status !== "live" ||
      stream.isActive !== true ||
      stream.isDeleted === true
    ) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Ce stream n'est pas actif",
      });
    }

    const now = Date.now();

    const existing = await ctx.db
      .query("liveStreamPresence")
      .withIndex("by_stream_and_user", (q) =>
        q.eq("streamId", args.streamId).eq("userId", user._id),
      )
      .filter((q) => q.eq(q.field("leftAt"), undefined))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastHeartbeatAt: now,
        leftAt: undefined,
      });

      return {
        presenceId: existing._id,
        viewerCount: stream.viewerCount,
      };
    }

    const presenceId = await ctx.db.insert("liveStreamPresence", {
      streamId: args.streamId,
      userId: user._id,
      sessionId: args.sessionId,

      joinedAt: now,
      lastHeartbeatAt: now,

      leftAt: undefined,
      counted: true,
    });

    const activePresence = await ctx.db
      .query("liveStreamPresence")
      .withIndex("by_stream_and_heartbeat", (q) =>
        q
          .eq("streamId", args.streamId)
          .gt("lastHeartbeatAt", now - PRESENCE_TIMEOUT_MS),
      )
      .collect();

    const viewerCount = activePresence.filter(
      (item) => item.leftAt === undefined || item.leftAt > now,
    ).length;

    await ctx.db.patch(args.streamId, {
      viewerCount,
      peakViewers: Math.max(stream.peakViewers ?? 0, viewerCount),
      totalViewCount: (stream.totalViewCount ?? 0) + 1,
      updatedAt: now,
    });

    return {
      presenceId,
      viewerCount,
    };
  },
});

/* ============================================================================
 * PRESENCE — HEARTBEAT
 * ========================================================================== */

export const heartbeatStream = mutation({
  args: {
    streamId: v.id("liveStreams"),
    sessionId: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const stream = await assertStreamExists(ctx, args.streamId);

    if (
      stream.status !== "live" ||
      stream.isActive !== true ||
      stream.isDeleted === true
    ) {
      return {
        active: false,
        viewerCount: 0,
      };
    }

    const now = Date.now();

    const presence = await ctx.db
      .query("liveStreamPresence")
      .withIndex("by_stream_and_user", (q) =>
        q.eq("streamId", args.streamId).eq("userId", user._id),
      )
      .filter((q) => q.eq(q.field("leftAt"), undefined))
      .first();

    if (!presence) {
      return {
        active: false,
        viewerCount: stream.viewerCount,
      };
    }

    await ctx.db.patch(presence._id, {
      lastHeartbeatAt: now,
      sessionId: args.sessionId ?? presence.sessionId,
    });

    const activePresence = await ctx.db
      .query("liveStreamPresence")
      .withIndex("by_stream_and_heartbeat", (q) =>
        q
          .eq("streamId", args.streamId)
          .gt("lastHeartbeatAt", now - PRESENCE_TIMEOUT_MS),
      )
      .collect();

    const viewerCount = activePresence.filter(
      (item) => item.leftAt === undefined || item.leftAt > now,
    ).length;

    await ctx.db.patch(args.streamId, {
      viewerCount,
      peakViewers: Math.max(stream.peakViewers ?? 0, viewerCount),
      updatedAt: now,
    });

    return {
      active: true,
      viewerCount,
    };
  },
});

/* ============================================================================
 * PRESENCE — LEAVE
 * ========================================================================== */

export const leaveStream = mutation({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const presence = await ctx.db
      .query("liveStreamPresence")
      .withIndex("by_stream_and_user", (q) =>
        q.eq("streamId", args.streamId).eq("userId", user._id),
      )
      .filter((q) => q.eq(q.field("leftAt"), undefined))
      .first();

    if (!presence) {
      return;
    }

    const now = Date.now();

    await ctx.db.patch(presence._id, {
      leftAt: now,
      lastHeartbeatAt: now,
    });

    const stream = await ctx.db.get(args.streamId);

    if (!stream) {
      return;
    }

    const activePresence = await ctx.db
      .query("liveStreamPresence")
      .withIndex("by_stream_and_heartbeat", (q) =>
        q
          .eq("streamId", args.streamId)
          .gt("lastHeartbeatAt", now - PRESENCE_TIMEOUT_MS),
      )
      .collect();

    const viewerCount = activePresence.filter(
      (item) => item.leftAt === undefined || item.leftAt > now,
    ).length;

    await ctx.db.patch(args.streamId, {
      viewerCount,
      updatedAt: now,
    });
  },
});

/* ============================================================================
 * GIFTS / SUPER CHAT
 * ========================================================================== */

export const sendGift = mutation({
  args: {
    streamId: v.id("liveStreams"),

    giftType: v.union(
      v.literal("star"),
      v.literal("crown"),
      v.literal("fire"),
      v.literal("diamond"),
      v.literal("rocket"),
    ),

    amount: v.number(),
    quantity: v.optional(v.number()),
    currency: v.optional(v.string()),
    message: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const stream = await assertStreamExists(ctx, args.streamId);

    if (
      stream.status !== "live" ||
      stream.isActive !== true ||
      stream.isDeleted === true
    ) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Stream non actif",
      });
    }

    await assertCanChat(ctx, stream, user._id);

    assertFinitePositive(
      args.amount,
      "Le montant du cadeau doit être supérieur à zéro",
    );

    const quantity = args.quantity ?? 1;

    assertFinitePositive(
      quantity,
      "La quantité du cadeau doit être supérieure à zéro",
    );

    const giftMessage =
      args.message?.trim().slice(0, MAX_GIFT_MESSAGE_LENGTH) || undefined;

    const currency = args.currency?.trim() || DEFAULT_GIFT_CURRENCY;

    const now = Date.now();

    const LABELS: Record<(typeof GIFT_TYPES)[number], string> = {
      star: "⭐ Étoile",
      crown: "👑 Couronne",
      fire: "🔥 Feu",
      diamond: "💎 Diamant",
      rocket: "🚀 Fusée",
    };

    const chatText =
      giftMessage ??
      `${user.name ?? "Quelqu'un"} a envoyé ${LABELS[args.giftType]} × ${quantity}`;

    const messageId = await ctx.db.insert("liveStreamMessages", {
      streamId: args.streamId,
      userId: user._id,
      text: chatText,
      type: "gift",

      amount: args.amount,
      currency,
      giftType: args.giftType,
      giftQuantity: quantity,

      isDeleted: false,
      isPinned: false,

      moderationStatus: "approved",

      createdAt: now,
      updatedAt: now,
    });

    const giftId = await ctx.db.insert("liveStreamGifts", {
      streamId: args.streamId,

      senderId: user._id,
      recipientId: stream.hostId,

      giftType: args.giftType,
      quantity,

      amount: args.amount,
      currency,

      message: giftMessage,
      messageId,

      createdAt: now,
    });

    await ctx.db.insert("creatorEarnings", {
      creatorId: stream.hostId,

      amount: args.amount,
      currency,

      type: "gift",

      sourceId: String(giftId),
      sourceType: "liveStream",

      createdAt: new Date(now).toISOString(),
    });

    await ctx.db.patch(args.streamId, {
      giftCount: (stream.giftCount ?? 0) + 1,
      chatCount: (stream.chatCount ?? 0) + 1,
      updatedAt: now,
    });

    return {
      giftId,
      messageId,
      giftType: args.giftType,
      quantity,
      amount: args.amount,
      currency,
    };
  },
});

/* ============================================================================
 * BANS / MUTES / TIMEOUTS
 * ========================================================================== */

export const banUser = mutation({
  args: {
    streamId: v.id("liveStreams"),
    userId: v.id("users"),

    type: v.union(v.literal("ban"), v.literal("mute"), v.literal("timeout")),

    reason: v.optional(v.string()),
    durationMs: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const { user, stream } = await assertCanModerate(ctx, args.streamId);

    if (args.userId === stream.hostId) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Le propriétaire du live ne peut pas être sanctionné ainsi",
      });
    }

    if (
      args.type === "timeout" &&
      (!args.durationMs ||
        !Number.isFinite(args.durationMs) ||
        args.durationMs <= 0)
    ) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Une durée est obligatoire pour un timeout",
      });
    }

    const now = Date.now();

    const existing = await ctx.db
      .query("liveStreamBans")
      .withIndex("by_stream_and_user", (q) =>
        q.eq("streamId", args.streamId).eq("userId", args.userId),
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        type: args.type,
        reason: args.reason?.trim(),

        expiresAt:
          args.type === "timeout" ? now + (args.durationMs ?? 0) : undefined,

        isActive: true,
      });

      return existing._id;
    }

    return ctx.db.insert("liveStreamBans", {
      streamId: args.streamId,
      userId: args.userId,
      bannedBy: user._id,

      type: args.type,
      reason: args.reason?.trim(),

      expiresAt:
        args.type === "timeout" ? now + (args.durationMs ?? 0) : undefined,

      isActive: true,
      createdAt: now,
    });
  },
});

export const revokeBan = mutation({
  args: {
    banId: v.id("liveStreamBans"),
  },

  handler: async (ctx, args) => {
    const ban = await ctx.db.get(args.banId);

    if (!ban) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Sanction introuvable",
      });
    }

    const { user } = await assertCanModerate(ctx, ban.streamId);

    const now = Date.now();

    await ctx.db.patch(args.banId, {
      isActive: false,
      revokedAt: now,
      revokedBy: user._id,
    });

    return args.banId;
  },
});

export const listStreamBans = query({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, args) => {
    return ctx.db
      .query("liveStreamBans")
      .withIndex("by_stream", (q) => q.eq("streamId", args.streamId))
      .order("desc")
      .take(100);
  },
});

/* ============================================================================
 * REPORTS
 * ========================================================================== */

export const reportStream = mutation({
  args: {
    streamId: v.id("liveStreams"),

    reason: v.union(
      v.literal("spam"),
      v.literal("nudity"),
      v.literal("violence"),
      v.literal("harassment"),
      v.literal("misinformation"),
      v.literal("copyright"),
      v.literal("other"),
    ),

    details: v.optional(v.string()),
    messageId: v.optional(v.id("liveStreamMessages")),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const stream = await ctx.db.get(args.streamId);

    if (!stream) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Stream introuvable",
      });
    }

    if (args.messageId) {
      const message = await ctx.db.get(args.messageId);

      if (!message || message.streamId !== args.streamId) {
        throw new ConvexError({
          code: "BAD_REQUEST",
          message: "Message signalé introuvable",
        });
      }
    }

    const details =
      args.details?.trim().slice(0, MAX_REPORT_DETAILS_LENGTH) || undefined;

    const now = Date.now();

    return ctx.db.insert("liveStreamReports", {
      streamId: args.streamId,
      reporterId: user._id,

      reason: args.reason,
      details,
      messageId: args.messageId,

      status: "open",
      createdAt: now,
    });
  },
});

export const listStreamReports = query({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, args) => {
    const user = await getOptionalUser(ctx);

    if (!user) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Connexion requise",
      });
    }

    const stream = await ctx.db.get(args.streamId);

    if (!stream) {
      return [];
    }

    if (stream.hostId !== user._id && !isAdmin(user)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Accès refusé",
      });
    }

    return ctx.db
      .query("liveStreamReports")
      .withIndex("by_stream", (q) => q.eq("streamId", args.streamId))
      .order("desc")
      .take(100);
  },
});

export const reviewReport = mutation({
  args: {
    reportId: v.id("liveStreamReports"),

    status: v.union(
      v.literal("reviewing"),
      v.literal("resolved"),
      v.literal("dismissed"),
    ),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (!isAdmin(user)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Droits administrateur requis",
      });
    }

    const report = await ctx.db.get(args.reportId);

    if (!report) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Signalement introuvable",
      });
    }

    const now = Date.now();

    await ctx.db.patch(args.reportId, {
      status: args.status,
      reviewedBy: user._id,
      reviewedAt: now,
    });

    return args.reportId;
  },
});

/* ============================================================================
 * CO-HOSTS / MODERATORS / GUESTS
 * ========================================================================== */

export const inviteCoHost = mutation({
  args: {
    streamId: v.id("liveStreams"),
    userId: v.id("users"),

    role: v.union(
      v.literal("cohost"),
      v.literal("moderator"),
      v.literal("guest"),
    ),
  },

  handler: async (ctx, args) => {
    const { user, stream } = await assertHost(ctx, args.streamId);

    if (args.userId === stream.hostId) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Le propriétaire est déjà hôte",
      });
    }

    const invitedUser = await ctx.db.get(args.userId);

    if (!invitedUser) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Utilisateur invité introuvable",
      });
    }

    const existing = await ctx.db
      .query("liveStreamCoHosts")
      .withIndex("by_stream_and_user", (q) =>
        q.eq("streamId", args.streamId).eq("userId", args.userId),
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        role: args.role,
        status: "invited",
        invitedBy: user._id,
        invitedAt: now,
        respondedAt: undefined,
      });

      return existing._id;
    }

    return ctx.db.insert("liveStreamCoHosts", {
      streamId: args.streamId,
      userId: args.userId,

      role: args.role,
      status: "invited",

      invitedBy: user._id,
      invitedAt: now,
    });
  },
});

export const respondToCoHostInvite = mutation({
  args: {
    coHostId: v.id("liveStreamCoHosts"),

    status: v.union(v.literal("accepted"), v.literal("declined")),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const invitation = await ctx.db.get(args.coHostId);

    if (!invitation) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Invitation introuvable",
      });
    }

    if (invitation.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Cette invitation ne vous appartient pas",
      });
    }

    if (invitation.status !== "invited") {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Cette invitation n'est plus disponible",
      });
    }

    await ctx.db.patch(args.coHostId, {
      status: args.status,
      respondedAt: Date.now(),
    });

    return args.coHostId;
  },
});

export const removeCoHost = mutation({
  args: {
    coHostId: v.id("liveStreamCoHosts"),
  },

  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.coHostId);

    if (!invitation) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Co-hôte introuvable",
      });
    }

    await assertHost(ctx, invitation.streamId);

    await ctx.db.patch(args.coHostId, {
      status: "removed",
      respondedAt: Date.now(),
    });

    return args.coHostId;
  },
});

export const listCoHosts = query({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("liveStreamCoHosts")
      .withIndex("by_stream", (q) => q.eq("streamId", args.streamId))
      .collect();

    return Promise.all(
      entries.map(async (entry) => {
        const user = await ctx.db.get(entry.userId);

        return {
          ...entry,
          userName: user?.name ?? "Utilisateur",
          userAvatar: user?.avatar ?? undefined,
        };
      }),
    );
  },
});

/* ============================================================================
 * STREAM MANAGEMENT
 * ========================================================================== */

export const updateStream = mutation({
  args: {
    streamId: v.id("liveStreams"),

    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    thumbnailUrl: v.optional(v.string()),
    playbackUrl: v.optional(v.string()),

    visibility: v.optional(
      v.union(
        v.literal("public"),
        v.literal("followers"),
        v.literal("private"),
      ),
    ),

    isPublic: v.optional(v.boolean()),
  },

  handler: async (ctx, args) => {
    await assertHost(ctx, args.streamId);

    const patch: {
      updatedAt: number;
      title?: string;
      description?: string;
      category?: string;
      tags?: string[];
      thumbnailUrl?: string;
      playbackUrl?: string;
      streamUrl?: string;
      visibility?: "public" | "followers" | "private";
      isPublic?: boolean;
    } = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      patch.title = normalizeTitle(args.title);
    }

    if (args.description !== undefined) {
      patch.description = normalizeDescription(args.description);
    }

    if (args.category !== undefined) {
      patch.category = args.category.trim() || "general";
    }

    if (args.tags !== undefined) {
      patch.tags = normalizeTags(args.tags);
    }

    if (args.thumbnailUrl !== undefined) {
      patch.thumbnailUrl = args.thumbnailUrl;
    }

    if (args.playbackUrl !== undefined) {
      patch.playbackUrl = args.playbackUrl;
      patch.streamUrl = args.playbackUrl;
    }

    if (args.visibility !== undefined) {
      patch.visibility = args.visibility;
      patch.isPublic = args.visibility === "public";
    }

    if (args.isPublic !== undefined) {
      patch.isPublic = args.isPublic;

      if (args.visibility === undefined) {
        patch.visibility = args.isPublic ? "public" : "private";
      }
    }

    await ctx.db.patch(args.streamId, patch);

    return args.streamId;
  },
});

export const deleteStream = mutation({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, args) => {
    await assertHost(ctx, args.streamId);

    const now = Date.now();

    await ctx.db.patch(args.streamId, {
      isDeleted: true,
      isActive: false,
      status: "ended",

      endedAt: toIso(now),
      updatedAt: now,
      viewerCount: 0,
    });

    await ctx.scheduler.runAfter(0, internal.liveReplay.stopReplayEgress, {
      streamId: args.streamId,
    });

    return args.streamId;
  },
});

/* ============================================================================
 * MODERATION — STREAM
 * ========================================================================== */

export const updateModerationStatus = mutation({
  args: {
    streamId: v.id("liveStreams"),

    moderationStatus: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (!isAdmin(user)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Droits administrateur requis",
      });
    }

    const stream = await ctx.db.get(args.streamId);

    if (!stream) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Stream introuvable",
      });
    }

    const now = Date.now();

    await ctx.db.patch(args.streamId, {
      moderationStatus: args.moderationStatus,

      isActive:
        args.moderationStatus !== "rejected" && stream.isDeleted !== true,

      updatedAt: now,
    });

    return args.streamId;
  },
});

export const getModerationQueue = query({
  args: {},

  handler: async (ctx) => {
    const user = await getOptionalUser(ctx);

    if (!user || !isAdmin(user)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Droits administrateur requis",
      });
    }

    const streams = await ctx.db
      .query("liveStreams")
      .withIndex("by_moderationStatus", (q) =>
        q.eq("moderationStatus", "pending"),
      )
      .order("desc")
      .take(100);

    return Promise.all(
      streams.map(async (stream) => {
        const host = await ctx.db.get(stream.hostId);

        return {
          ...stream,
          hostName: host?.name ?? "Inconnu",
          hostAvatar: host?.avatar ?? undefined,
        };
      }),
    );
  },
});

/* ============================================================================
 * PIN
 * ========================================================================== */

export const togglePin = mutation({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, args) => {
    const { stream } = await assertHost(ctx, args.streamId);

    const now = Date.now();
    const newPinned = stream.isPinned !== true;

    await ctx.db.patch(args.streamId, {
      isPinned: newPinned,
      updatedAt: now,
    });

    return {
      isPinned: newPinned,
    };
  },
});

/* ============================================================================
 * SHARES
 * ========================================================================== */

export const recordShare = mutation({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, args) => {
    const stream = await assertStreamExists(ctx, args.streamId);

    const newCount = (stream.shareCount ?? 0) + 1;

    await ctx.db.patch(args.streamId, {
      shareCount: newCount,
      updatedAt: Date.now(),
    });

    return {
      shareCount: newCount,
    };
  },
});

/* ============================================================================
 * VIEW COUNT RECONCILIATION
 * ========================================================================== */

export const refreshViewerCount = mutation({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, args) => {
    const stream = await ctx.db.get(args.streamId);

    if (!stream) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Stream introuvable",
      });
    }

    const now = Date.now();

    const activePresence = await ctx.db
      .query("liveStreamPresence")
      .withIndex("by_stream_and_heartbeat", (q) =>
        q
          .eq("streamId", args.streamId)
          .gt("lastHeartbeatAt", now - PRESENCE_TIMEOUT_MS),
      )
      .collect();

    const viewerCount = activePresence.filter(
      (item) => item.leftAt === undefined || item.leftAt > now,
    ).length;

    const newPeak = Math.max(stream.peakViewers ?? 0, viewerCount);

    await ctx.db.patch(args.streamId, {
      viewerCount,
      peakViewers: newPeak,
      updatedAt: now,
    });

    return {
      viewerCount,
      peakViewers: newPeak,
    };
  },
});
