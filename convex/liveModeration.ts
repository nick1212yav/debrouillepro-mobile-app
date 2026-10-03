// convex/liveModeration.ts

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

import { requireUserId } from "./lib/auth";

// ═══════════════════════════════════════════════════════════════
// LIVE — MODERATION
// V1.5 — Ban / Mute / Timeout / Revoke
// ═══════════════════════════════════════════════════════════════
//
// Contrat schema utilisé :
//
// liveStreamBans {
//   streamId
//   userId
//   bannedBy
//   type: "ban" | "mute" | "timeout"
//   reason?
//   expiresAt?
//   isActive
//   createdAt
//   revokedAt?
//   revokedBy?
// }
//
// Permissions :
//   HOST      → modération complète
//   MODERATOR → modération complète
//   COHOST    → pas de modération sauf rôle moderator
//   GUEST     → pas de modération
//   VIEWER    → pas de modération
//
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// INTERNAL TYPES
// ─────────────────────────────────────────────────────────────

type ReadContext = QueryCtx | MutationCtx;

// ═══════════════════════════════════════════════════════════════
// AUTHORIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Vérifie que l'utilisateur est :
 *
 * - l'hôte du live
 * OU
 * - un co-host accepté avec le rôle "moderator".
 *
 * Retourne le stream afin d'éviter un second db.get().
 */
async function assertCanModerate(
  ctx: ReadContext,
  streamId: Id<"liveStreams">,
  userId: Id<"users">,
) {
  const stream = await ctx.db.get(streamId);

  if (!stream) {
    throw new Error("Stream introuvable");
  }

  // L'hôte dispose toujours des droits de modération.
  if (stream.hostId === userId) {
    return stream;
  }

  // Recherche du rôle de l'utilisateur sur ce live.
  const cohost = await ctx.db
    .query("liveStreamCoHosts")
    .withIndex("by_stream_and_user", (q) =>
      q.eq("streamId", streamId).eq("userId", userId),
    )
    .first();

  if (cohost && cohost.status === "accepted" && cohost.role === "moderator") {
    return stream;
  }

  throw new Error("Réservé à l'hôte ou à un modérateur");
}

/**
 * Vérifie qu'une cible différente de l'utilisateur connecté
 * est bien modérable.
 */
function assertNotSelf(
  moderatorId: Id<"users">,
  targetUserId: Id<"users">,
): void {
  if (moderatorId === targetUserId) {
    throw new Error("Impossible de se modérer soi-même");
  }
}

// ═══════════════════════════════════════════════════════════════
// TIMEOUT DURATIONS
// ═══════════════════════════════════════════════════════════════

const TIMEOUT_MS = {
  "1m": 60_000,
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
  "1h": 60 * 60_000,
} as const;

type TimeoutDuration = keyof typeof TIMEOUT_MS;

// ═══════════════════════════════════════════════════════════════
// RESTRICTION CHECK
// ═══════════════════════════════════════════════════════════════

/**
 * Détermine si un utilisateur est actuellement restreint
 * sur un live.
 *
 * true pour :
 *   - ban actif
 *   - mute actif
 *   - timeout non expiré
 *
 * false pour :
 *   - sanction révoquée
 *   - timeout expiré
 *   - aucune sanction
 *
 * Utilisable depuis d'autres modules backend.
 */
export async function isUserRestricted(
  ctx: ReadContext,
  streamId: Id<"liveStreams">,
  userId: Id<"users">,
): Promise<boolean> {
  const rows = await ctx.db
    .query("liveStreamBans")
    .withIndex("by_stream_and_user", (q) =>
      q.eq("streamId", streamId).eq("userId", userId),
    )
    .collect();

  const now = Date.now();

  return rows.some((row) => {
    // Sanction révoquée.
    if (!row.isActive) {
      return false;
    }

    // Ban permanent.
    if (row.type === "ban") {
      return true;
    }

    // Mute permanent jusqu'à révocation.
    if (row.type === "mute") {
      return true;
    }

    // Timeout temporaire.
    if (row.type === "timeout") {
      return !row.expiresAt || row.expiresAt > now;
    }

    return false;
  });
}

// ═══════════════════════════════════════════════════════════════
// DEACTIVATE PREVIOUS SANCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Désactive les sanctions actives d'un utilisateur avant
 * d'en créer une nouvelle.
 *
 * Cette fonction écrit dans la base : elle doit donc recevoir
 * exclusivement un MutationCtx.
 *
 * Cela évite l'erreur TypeScript :
 *
 *   Property 'patch' does not exist on type 'GenericDatabaseReader'
 */
async function deactivateActiveSanctions(
  ctx: MutationCtx,
  streamId: Id<"liveStreams">,
  userId: Id<"users">,
  revokedBy: Id<"users">,
): Promise<void> {
  const rows = await ctx.db
    .query("liveStreamBans")
    .withIndex("by_stream_and_user", (q) =>
      q.eq("streamId", streamId).eq("userId", userId),
    )
    .collect();

  const now = Date.now();

  for (const row of rows) {
    if (!row.isActive) {
      continue;
    }

    await ctx.db.patch(row._id, {
      isActive: false,
      revokedAt: now,
      revokedBy,
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// BAN
// ═══════════════════════════════════════════════════════════════

/**
 * Bannit définitivement un utilisateur du live.
 */
export const banUser = mutation({
  args: {
    streamId: v.id("liveStreams"),
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },

  handler: async (ctx, { streamId, userId, reason }) => {
    const me = await requireUserId(ctx);

    assertNotSelf(me, userId);

    await assertCanModerate(ctx, streamId, me);

    const now = Date.now();

    // Nettoyage des sanctions précédentes.
    await deactivateActiveSanctions(ctx, streamId, userId, me);

    const banId = await ctx.db.insert("liveStreamBans", {
      streamId,
      userId,
      bannedBy: me,
      type: "ban",
      reason,
      isActive: true,
      createdAt: now,
    });

    return {
      banId,
      type: "ban" as const,
      userId,
      createdAt: now,
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// TIMEOUT
// ═══════════════════════════════════════════════════════════════

/**
 * Applique un timeout temporaire.
 */
export const timeoutUser = mutation({
  args: {
    streamId: v.id("liveStreams"),
    userId: v.id("users"),

    duration: v.union(
      v.literal("1m"),
      v.literal("5m"),
      v.literal("15m"),
      v.literal("1h"),
    ),

    reason: v.optional(v.string()),
  },

  handler: async (ctx, { streamId, userId, duration, reason }) => {
    const me = await requireUserId(ctx);

    assertNotSelf(me, userId);

    await assertCanModerate(ctx, streamId, me);

    const now = Date.now();
    const expiresAt = now + TIMEOUT_MS[duration as TimeoutDuration];

    // Désactive une éventuelle sanction précédente.
    await deactivateActiveSanctions(ctx, streamId, userId, me);

    const banId = await ctx.db.insert("liveStreamBans", {
      streamId,
      userId,
      bannedBy: me,
      type: "timeout",
      reason,
      expiresAt,
      isActive: true,
      createdAt: now,
    });

    return {
      banId,
      type: "timeout" as const,
      userId,
      expiresAt,
      duration,
      createdAt: now,
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// MUTE
// ═══════════════════════════════════════════════════════════════

/**
 * Empêche un utilisateur d'interagir vocalement/chat selon
 * les règles appliquées par le frontend/backend.
 *
 * Le mute reste actif jusqu'à révocation.
 */
export const muteUser = mutation({
  args: {
    streamId: v.id("liveStreams"),
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },

  handler: async (ctx, { streamId, userId, reason }) => {
    const me = await requireUserId(ctx);

    assertNotSelf(me, userId);

    await assertCanModerate(ctx, streamId, me);

    const now = Date.now();

    // Idempotence :
    // on ne conserve qu'une sanction active.
    await deactivateActiveSanctions(ctx, streamId, userId, me);

    const banId = await ctx.db.insert("liveStreamBans", {
      streamId,
      userId,
      bannedBy: me,
      type: "mute",
      reason,
      isActive: true,
      createdAt: now,
    });

    return {
      banId,
      type: "mute" as const,
      userId,
      createdAt: now,
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// REVOKE SANCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Révoque une sanction précise.
 */
export const revokeSanction = mutation({
  args: {
    streamId: v.id("liveStreams"),
    banId: v.id("liveStreamBans"),
  },

  handler: async (ctx, { streamId, banId }) => {
    const me = await requireUserId(ctx);

    await assertCanModerate(ctx, streamId, me);

    const row = await ctx.db.get(banId);

    if (!row || row.streamId !== streamId) {
      throw new Error("Sanction introuvable");
    }

    if (!row.isActive) {
      return {
        success: true,
        alreadyRevoked: true,
      };
    }

    const now = Date.now();

    await ctx.db.patch(banId, {
      isActive: false,
      revokedAt: now,
      revokedBy: me,
    });

    return {
      success: true,
      alreadyRevoked: false,
      banId,
      revokedAt: now,
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// LIST ACTIVE SANCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Retourne les sanctions actuellement actives.
 *
 * Accessible uniquement :
 *   - à l'hôte
 *   - aux modérateurs acceptés
 */
export const listActiveSanctions = query({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, { streamId }) => {
    let me: Id<"users">;

    try {
      me = await requireUserId(ctx);
    } catch {
      return [];
    }

    const stream = await ctx.db.get(streamId);

    if (!stream) {
      return [];
    }

    // ─────────────────────────────────────────────────────────
    // PERMISSION
    // ─────────────────────────────────────────────────────────

    const isHost = stream.hostId === me;

    if (!isHost) {
      const cohost = await ctx.db
        .query("liveStreamCoHosts")
        .withIndex("by_stream_and_user", (q) =>
          q.eq("streamId", streamId).eq("userId", me),
        )
        .first();

      if (
        !cohost ||
        cohost.status !== "accepted" ||
        cohost.role !== "moderator"
      ) {
        return [];
      }
    }

    // ─────────────────────────────────────────────────────────
    // ACTIVE SANCTIONS
    // ─────────────────────────────────────────────────────────

    const rows = await ctx.db
      .query("liveStreamBans")
      .withIndex("by_stream_and_active", (q) =>
        q.eq("streamId", streamId).eq("isActive", true),
      )
      .collect();

    const now = Date.now();

    // Un timeout expiré n'est plus considéré comme actif,
    // même si son document historique reste isActive=true.
    const activeRows = rows.filter((row) => {
      if (row.type !== "timeout") {
        return true;
      }

      return !row.expiresAt || row.expiresAt > now;
    });

    // ─────────────────────────────────────────────────────────
    // ENRICHISSEMENT UTILISATEUR
    // ─────────────────────────────────────────────────────────

    return await Promise.all(
      activeRows.map(async (row) => {
        const user = await ctx.db.get(row.userId);

        return {
          _id: row._id,
          userId: row.userId,

          userName: user?.name ?? "Utilisateur",

          userAvatar: user?.avatar ?? undefined,

          type: row.type,
          reason: row.reason,
          expiresAt: row.expiresAt,
          createdAt: row.createdAt,
          bannedBy: row.bannedBy,
        };
      }),
    );
  },
});

// ═══════════════════════════════════════════════════════════════
// CURRENT USER RESTRICTION
// ═══════════════════════════════════════════════════════════════

/**
 * Permet au frontend de savoir immédiatement si l'utilisateur
 * courant est actuellement restreint sur le live.
 */
export const amIRestricted = query({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, { streamId }) => {
    let me: Id<"users">;

    try {
      me = await requireUserId(ctx);
    } catch {
      return false;
    }

    return isUserRestricted(ctx, streamId, me);
  },
});
