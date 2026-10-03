// convex/liveCohosts.ts

import { internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

import { requireUserId } from "./lib/auth";

// ═══════════════════════════════════════════════════════════════
// LIVE — CO-HOSTS / GUESTS / MODERATORS
// V2.1
// ═══════════════════════════════════════════════════════════════
//
// Contrat schema :
//
// liveStreamCoHosts {
//   streamId
//   userId
//   role: "cohost" | "moderator" | "guest"
//   status: "invited" | "accepted" | "declined" | "removed"
//   invitedBy
//   invitedAt
//   respondedAt?
// }
//
// Permissions :
//
// HOST
//   → inviter
//   → modifier le rôle
//   → retirer un participant
//
// COHOST
//   → publier caméra / micro
//
// GUEST
//   → publier caméra / micro
//
// MODERATOR
//   → modérer
//   → NE publie pas automatiquement caméra / micro
//
// VIEWER
//   → aucune publication
//
// ═══════════════════════════════════════════════════════════════

type CohostContext = QueryCtx | MutationCtx;

// ═══════════════════════════════════════════════════════════════
// HELPERS — accès utilisateur défensif
// ═══════════════════════════════════════════════════════════════

/**
 * Le schéma `users` peut exposer l'avatar sous `avatarUrl`, `avatar`
 * ou `image` selon les modules. Idem pour le nom (`name` ou `username`).
 *
 * On reste tolérant pour ne pas casser le frontend si le schéma évolue.
 */
function pickUserName(user: any): string {
  return user?.name ?? user?.username ?? "Utilisateur";
}

function pickUserAvatar(user: any): string | undefined {
  return user?.avatarUrl ?? user?.avatar ?? user?.image ?? undefined;
}

// ═══════════════════════════════════════════════════════════════
// HOST AUTHORIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Vérifie que l'utilisateur connecté est l'hôte du live.
 */
async function assertHost(
  ctx: CohostContext,
  streamId: Id<"liveStreams">,
  userId: Id<"users">,
) {
  const stream = await ctx.db.get(streamId);

  if (!stream) {
    throw new Error("Stream introuvable");
  }

  if (stream.hostId !== userId) {
    throw new Error("Réservé à l'hôte");
  }

  return stream;
}

// ═══════════════════════════════════════════════════════════════
// INTERNAL — PUBLISHER AUTHORIZATION (LiveKit token)
// ═══════════════════════════════════════════════════════════════

/**
 * Utilisé par `convex/livekit.ts` (getLiveKitToken) pour décider si
 * l'utilisateur peut publier caméra + micro dans la room LiveKit.
 *
 * Règles :
 *   - HOST              → true
 *   - COHOST accepted   → true
 *   - GUEST accepted    → true
 *   - MODERATOR accept  → false (modère, ne publie pas)
 *   - VIEWER            → false
 *
 * Appel :
 *   await ctx.runQuery(
 *     internal.liveCohosts.canPublishInternal,
 *     { streamId, userId },
 *   );
 */
export const canPublishInternal = internalQuery({
  args: {
    streamId: v.id("liveStreams"),
    userId: v.id("users"),
  },

  handler: async (ctx, { streamId, userId }): Promise<boolean> => {
    const stream = await ctx.db.get(streamId);

    if (!stream) {
      return false;
    }

    // HOST : toujours publisher.
    if (stream.hostId === userId) {
      return true;
    }

    const row = await ctx.db
      .query("liveStreamCoHosts")
      .withIndex("by_stream_and_user", (q) =>
        q.eq("streamId", streamId).eq("userId", userId),
      )
      .first();

    if (!row || row.status !== "accepted") {
      return false;
    }

    return row.role === "cohost" || row.role === "guest";
  },
});

// ═══════════════════════════════════════════════════════════════
// INVITE
// ═══════════════════════════════════════════════════════════════

/**
 * Invite un utilisateur sur scène.
 *
 * Le host peut lui attribuer :
 *   - cohost
 *   - moderator
 *   - guest
 *
 * Si l'utilisateur est déjà accepté :
 *   → son rôle peut être modifié sans nouvelle invitation.
 *
 * Si une ancienne invitation existe :
 *   → elle est remplacée par une nouvelle invitation.
 */
export const invite = mutation({
  args: {
    streamId: v.id("liveStreams"),

    userId: v.id("users"),

    role: v.union(
      v.literal("cohost"),
      v.literal("moderator"),
      v.literal("guest"),
    ),
  },

  handler: async (ctx, { streamId, userId, role }) => {
    const me = await requireUserId(ctx);

    const stream = await assertHost(ctx, streamId, me);

    // L'hôte n'a pas besoin de s'inviter lui-même.
    if (userId === stream.hostId) {
      throw new Error("Vous êtes déjà hôte");
    }

    const existing = await ctx.db
      .query("liveStreamCoHosts")
      .withIndex("by_stream_and_user", (q) =>
        q.eq("streamId", streamId).eq("userId", userId),
      )
      .first();

    // ─────────────────────────────────────────────────────────
    // EXISTING ACCEPTED PARTICIPANT
    // ─────────────────────────────────────────────────────────

    if (existing && existing.status === "accepted") {
      // Modification de rôle sans nouvelle invitation.
      if (existing.role !== role) {
        await ctx.db.patch(existing._id, {
          role,
          respondedAt: Date.now(),
        });
      }

      return existing._id;
    }

    // ─────────────────────────────────────────────────────────
    // EXISTING INVITATION / DECLINED / REMOVED
    // ─────────────────────────────────────────────────────────

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // ─────────────────────────────────────────────────────────
    // NEW INVITATION
    // ─────────────────────────────────────────────────────────

    return await ctx.db.insert("liveStreamCoHosts", {
      streamId,
      userId,
      role,
      status: "invited",
      invitedBy: me,
      invitedAt: Date.now(),
    });
  },
});

// ═══════════════════════════════════════════════════════════════
// RESPOND TO INVITATION
// ═══════════════════════════════════════════════════════════════

/**
 * Accepte ou refuse une invitation.
 *
 * Important :
 * seul le destinataire de l'invitation peut répondre.
 */
export const respond = mutation({
  args: {
    streamId: v.id("liveStreams"),
    accept: v.boolean(),
  },

  handler: async (ctx, { streamId, accept }) => {
    const me = await requireUserId(ctx);

    const invite = await ctx.db
      .query("liveStreamCoHosts")
      .withIndex("by_stream_and_user", (q) =>
        q.eq("streamId", streamId).eq("userId", me),
      )
      .first();

    if (!invite || invite.status !== "invited") {
      throw new Error("Aucune invitation en attente");
    }

    // Vérification du stream avant acceptation.
    const stream = await ctx.db.get(streamId);

    if (!stream) {
      throw new Error("Stream introuvable");
    }

    // Une invitation ne doit pas permettre
    // de rejoindre un live supprimé.
    if (stream.isDeleted === true) {
      throw new Error("Ce live n'est plus disponible");
    }

    const now = Date.now();

    await ctx.db.patch(invite._id, {
      status: accept ? "accepted" : "declined",
      respondedAt: now,
    });

    return {
      success: true,
      status: accept ? ("accepted" as const) : ("declined" as const),
      role: invite.role,
      respondedAt: now,
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// REMOVE
// ═══════════════════════════════════════════════════════════════

/**
 * Retire un cohost / guest / moderator du live.
 *
 * On conserve le document historique et on passe son statut
 * à "removed" plutôt que de supprimer définitivement la ligne.
 */
export const remove = mutation({
  args: {
    streamId: v.id("liveStreams"),
    userId: v.id("users"),
  },

  handler: async (ctx, { streamId, userId }) => {
    const me = await requireUserId(ctx);

    const stream = await assertHost(ctx, streamId, me);

    if (userId === stream.hostId) {
      throw new Error("Impossible de retirer l'hôte");
    }

    const row = await ctx.db
      .query("liveStreamCoHosts")
      .withIndex("by_stream_and_user", (q) =>
        q.eq("streamId", streamId).eq("userId", userId),
      )
      .first();

    if (!row) {
      return {
        success: true,
        alreadyRemoved: true,
      };
    }

    if (row.status === "removed") {
      return {
        success: true,
        alreadyRemoved: true,
      };
    }

    const now = Date.now();

    await ctx.db.patch(row._id, {
      status: "removed",
      respondedAt: now,
    });

    return {
      success: true,
      alreadyRemoved: false,
      userId,
      removedAt: now,
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// LIST
// ═══════════════════════════════════════════════════════════════

/**
 * Liste les participants actuellement pertinents :
 *
 *   invited
 *   accepted
 *
 * Les entrées declined / removed restent dans la DB
 * pour l'historique mais ne sont pas exposées ici.
 */
export const list = query({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, { streamId }) => {
    const rows = await ctx.db
      .query("liveStreamCoHosts")
      .withIndex("by_stream", (q) => q.eq("streamId", streamId))
      .collect();

    const activeRows = rows.filter(
      (row) => row.status === "accepted" || row.status === "invited",
    );

    return await Promise.all(
      activeRows.map(async (row) => {
        const user = await ctx.db.get(row.userId);

        return {
          _id: row._id,
          userId: row.userId,
          userName: pickUserName(user),
          userAvatar: pickUserAvatar(user),
          role: row.role,
          status: row.status,
          invitedAt: row.invitedAt,
          respondedAt: row.respondedAt,
        };
      }),
    );
  },
});

// ═══════════════════════════════════════════════════════════════
// MY PENDING INVITATION
// ═══════════════════════════════════════════════════════════════

/**
 * Retourne l'invitation actuellement en attente
 * pour l'utilisateur connecté.
 *
 * Utilisé par le frontend pour afficher :
 *
 * "Vous êtes invité à rejoindre ce live"
 *
 * avec :
 *
 *   Rejoindre
 *   Refuser
 */
export const myPendingInvite = query({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, { streamId }) => {
    let me: Id<"users">;

    try {
      me = await requireUserId(ctx);
    } catch {
      return null;
    }

    const row = await ctx.db
      .query("liveStreamCoHosts")
      .withIndex("by_stream_and_user", (q) =>
        q.eq("streamId", streamId).eq("userId", me),
      )
      .first();

    if (!row || row.status !== "invited") {
      return null;
    }

    return {
      _id: row._id,
      streamId: row.streamId,
      role: row.role,
      status: row.status,
      invitedBy: row.invitedBy,
      invitedAt: row.invitedAt,
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// PUBLISHER AUTHORIZATION (helper serveur)
// ═══════════════════════════════════════════════════════════════

/**
 * Utilisé par le système de token LiveKit.
 *
 * Un publisher est :
 *
 *   HOST
 *     → toujours publisher
 *
 *   COHOST accepté
 *     → publisher
 *
 *   GUEST accepté
 *     → publisher
 *
 *   MODERATOR accepté
 *     → PAS publisher automatiquement
 *
 *   VIEWER
 *     → PAS publisher
 *
 * Cette distinction est importante :
 * un modérateur peut modérer le chat sans forcément
 * obtenir l'accès caméra/micro.
 */
export async function amIPublisher(
  ctx: CohostContext,
  streamId: Id<"liveStreams">,
  userId: Id<"users">,
): Promise<boolean> {
  const stream = await ctx.db.get(streamId);

  if (!stream) {
    return false;
  }

  // L'hôte est toujours publisher.
  if (stream.hostId === userId) {
    return true;
  }

  const row = await ctx.db
    .query("liveStreamCoHosts")
    .withIndex("by_stream_and_user", (q) =>
      q.eq("streamId", streamId).eq("userId", userId),
    )
    .first();

  if (!row) {
    return false;
  }

  if (row.status !== "accepted") {
    return false;
  }

  return row.role === "cohost" || row.role === "guest";
}

// ═══════════════════════════════════════════════════════════════
// ON-STAGE STATUS
// ═══════════════════════════════════════════════════════════════

/**
 * Retourne le rôle actuel de l'utilisateur connecté
 * sur le live.
 *
 * Résultats :
 *
 *   { role: "host" }
 *   { role: "cohost" }
 *   { role: "guest" }
 *   { role: "moderator" }
 *   { role: null }
 */
export const amIOnStage = query({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, { streamId }) => {
    let me: Id<"users">;

    try {
      me = await requireUserId(ctx);
    } catch {
      return {
        role: null,
      };
    }

    const stream = await ctx.db.get(streamId);

    if (!stream) {
      return {
        role: null,
      };
    }

    // HOST
    if (stream.hostId === me) {
      return {
        role: "host" as const,
      };
    }

    const row = await ctx.db
      .query("liveStreamCoHosts")
      .withIndex("by_stream_and_user", (q) =>
        q.eq("streamId", streamId).eq("userId", me),
      )
      .first();

    if (!row || row.status !== "accepted") {
      return {
        role: null,
      };
    }

    return {
      role: row.role,
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// CAN PUBLISH — EXPLICIT QUERY
// ═══════════════════════════════════════════════════════════════

/**
 * Version query de amIPublisher().
 *
 * Utile pour le frontend avant d'afficher/activer
 * la caméra et le microphone.
 */
export const canPublish = query({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, { streamId }) => {
    let me: Id<"users">;

    try {
      me = await requireUserId(ctx);
    } catch {
      return {
        canPublish: false,
        role: null,
      };
    }

    const stream = await ctx.db.get(streamId);

    if (!stream) {
      return {
        canPublish: false,
        role: null,
      };
    }

    // HOST
    if (stream.hostId === me) {
      return {
        canPublish: true,
        role: "host" as const,
      };
    }

    const row = await ctx.db
      .query("liveStreamCoHosts")
      .withIndex("by_stream_and_user", (q) =>
        q.eq("streamId", streamId).eq("userId", me),
      )
      .first();

    if (!row || row.status !== "accepted") {
      return {
        canPublish: false,
        role: null,
      };
    }

    const canPublish = row.role === "cohost" || row.role === "guest";

    return {
      canPublish,
      role: row.role,
    };
  },
});
