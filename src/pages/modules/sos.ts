import { paginationOptsValidator, query, mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const SOS_EXPIRATION_MS = 30 * 60 * 1000;
const SOS_RATE_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_SOS_PER_WINDOW = 5;
const MAX_MESSAGE_LENGTH = 1000;

type AuthCtx = QueryCtx | MutationCtx;

async function requireUser(ctx: AuthCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Non authentifié",
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

function normalizeMessage(message?: string) {
  const value = message?.trim() ?? "";

  if (value.length > MAX_MESSAGE_LENGTH) {
    throw new ConvexError({
      code: "INVALID_ARGUMENT",
      message: "Message SOS trop long",
    });
  }

  return value;
}

/**
 * Retourne le nombre d'alertes créées pendant la fenêtre
 * anti-abus.
 *
 * La limitation est volontairement côté serveur.
 * Le client ne peut donc pas la contourner.
 */
async function countRecentSOS(
  ctx: MutationCtx,
  userId: ReturnType<typeof v.id<"users">> extends never ? never : any,
  now: number,
) {
  const since = now - SOS_RATE_WINDOW_MS;

  const recent = await ctx.db
    .query("emergencyAlerts")
    .withIndex("by_user_createdAt", (q) =>
      q.eq("userId", userId).gte("createdAt", since),
    )
    .collect();

  return recent.length;
}

/**
 * Vérifie qu'il n'existe pas déjà une alerte active.
 */
async function getActiveAlert(ctx: QueryCtx | MutationCtx, userId: any) {
  return await ctx.db
    .query("emergencyAlerts")
    .withIndex("by_user_status", (q) =>
      q.eq("userId", userId).eq("status", "active"),
    )
    .first();
}

/**
 * Récupère une alerte appartenant exclusivement
 * à l'utilisateur connecté.
 */
async function requireOwnedAlert(ctx: MutationCtx, alertId: any, userId: any) {
  const alert = await ctx.db.get(alertId);

  if (!alert || alert.userId !== userId) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Alerte SOS introuvable",
    });
  }

  return alert;
}

// ─────────────────────────────────────────────────────────────
// SOS — ÉTAT ACTIF
// ─────────────────────────────────────────────────────────────

export const getActiveSOS = query({
  args: {},

  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const alert = await getActiveAlert(ctx, user._id);

    if (!alert) {
      return null;
    }

    const recipients = await ctx.db
      .query("emergencyAlertRecipients")
      .withIndex("by_alert", (q) => q.eq("alertId", alert._id))
      .collect();

    return {
      ...alert,
      recipients,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// SOS — CRÉATION
// ─────────────────────────────────────────────────────────────

export const requestSOS = mutation({
  args: {
    message: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    accuracy: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const now = Date.now();

    const recentCount = await countRecentSOS(ctx, user._id, now);

    if (recentCount >= MAX_SOS_PER_WINDOW) {
      throw new ConvexError({
        code: "RATE_LIMITED",
        message: "Trop de déclenchements SOS. Réessayez plus tard.",
      });
    }

    const existing = await getActiveAlert(ctx, user._id);

    if (existing) {
      throw new ConvexError({
        code: "SOS_ALREADY_ACTIVE",
        message: "Une alerte SOS est déjà active.",
      });
    }

    if (
      args.latitude !== undefined &&
      (args.latitude < -90 || args.latitude > 90)
    ) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Latitude invalide",
      });
    }

    if (
      args.longitude !== undefined &&
      (args.longitude < -180 || args.longitude > 180)
    ) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Longitude invalide",
      });
    }

    if (args.accuracy !== undefined && args.accuracy < 0) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Précision GPS invalide",
      });
    }

    const message = normalizeMessage(args.message);

    /**
     * On prend un instantané des contacts au moment
     * du déclenchement.
     *
     * Cela permet de conserver l'historique même si
     * l'utilisateur modifie ensuite ses contacts.
     */
    const contacts = await ctx.db
      .query("emergencyContacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (contacts.length === 0) {
      throw new ConvexError({
        code: "NO_EMERGENCY_CONTACTS",
        message:
          "Ajoutez au moins un contact d'urgence avant de déclencher une alerte.",
      });
    }

    const expiresAt = now + SOS_EXPIRATION_MS;

    const alertId = await ctx.db.insert("emergencyAlerts", {
      userId: user._id,

      status: "active",

      message: message || "Alerte SOS déclenchée.",

      latitude: args.latitude,
      longitude: args.longitude,
      accuracy: args.accuracy,

      createdAt: now,
      updatedAt: now,
      expiresAt,

      resolvedAt: undefined,
      cancelledAt: undefined,
      expiredAt: undefined,
    });

    /**
     * Création des destinataires.
     *
     * Le statut est "pending_dispatch".
     *
     * C'est intentionnel :
     * aucun fournisseur d'envoi réel n'est encore appelé.
     */
    for (const contact of contacts) {
      await ctx.db.insert("emergencyAlertRecipients", {
        alertId,
        userId: user._id,

        name: contact.name,
        phone: contact.phone,
        relation: contact.relation,
        isPrimary: contact.isPrimary,

        status: "pending_dispatch",

        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      alertId,
      status: "active" as const,
      recipientCount: contacts.length,
      expiresAt,
      dispatchStatus: "pending_dispatch" as const,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// SOS — MISE À JOUR GPS
// ─────────────────────────────────────────────────────────────

export const updateSOSLocation = mutation({
  args: {
    alertId: v.id("emergencyAlerts"),
    latitude: v.number(),
    longitude: v.number(),
    accuracy: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (args.latitude < -90 || args.latitude > 90) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Latitude invalide",
      });
    }

    if (args.longitude < -180 || args.longitude > 180) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Longitude invalide",
      });
    }

    if (args.accuracy !== undefined && args.accuracy < 0) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Précision GPS invalide",
      });
    }

    const alert = await requireOwnedAlert(ctx, args.alertId, user._id);

    if (alert.status !== "active") {
      throw new ConvexError({
        code: "SOS_NOT_ACTIVE",
        message: "Cette alerte SOS n'est plus active.",
      });
    }

    const now = Date.now();

    if (now >= alert.expiresAt) {
      await ctx.db.patch(args.alertId, {
        status: "expired",
        expiredAt: now,
        updatedAt: now,
      });

      throw new ConvexError({
        code: "SOS_EXPIRED",
        message: "Cette alerte SOS a expiré.",
      });
    }

    await ctx.db.patch(args.alertId, {
      latitude: args.latitude,
      longitude: args.longitude,
      accuracy: args.accuracy,
      updatedAt: now,
    });

    return {
      success: true,
      updatedAt: now,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// SOS — ANNULATION
// ─────────────────────────────────────────────────────────────

export const cancelSOS = mutation({
  args: {
    alertId: v.id("emergencyAlerts"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const alert = await requireOwnedAlert(ctx, args.alertId, user._id);

    if (alert.status !== "active") {
      return {
        success: true,
        status: alert.status,
      };
    }

    const now = Date.now();

    await ctx.db.patch(args.alertId, {
      status: "cancelled",
      cancelledAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      status: "cancelled" as const,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// SOS — RÉSOLUTION
// ─────────────────────────────────────────────────────────────

export const resolveSOS = mutation({
  args: {
    alertId: v.id("emergencyAlerts"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const alert = await requireOwnedAlert(ctx, args.alertId, user._id);

    if (alert.status !== "active") {
      return {
        success: true,
        status: alert.status,
      };
    }

    const now = Date.now();

    await ctx.db.patch(args.alertId, {
      status: "resolved",
      resolvedAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      status: "resolved" as const,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// SOS — EXPIRATION
// ─────────────────────────────────────────────────────────────

export const expireSOS = mutation({
  args: {
    alertId: v.id("emergencyAlerts"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const alert = await requireOwnedAlert(ctx, args.alertId, user._id);

    if (alert.status !== "active") {
      return {
        success: true,
        status: alert.status,
      };
    }

    const now = Date.now();

    if (now < alert.expiresAt) {
      throw new ConvexError({
        code: "NOT_EXPIRED",
        message: "Cette alerte n'a pas encore atteint sa date d'expiration.",
      });
    }

    await ctx.db.patch(args.alertId, {
      status: "expired",
      expiredAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      status: "expired" as const,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// SOS — HISTORIQUE
// ─────────────────────────────────────────────────────────────

export const listMySOSHistory = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    return await ctx.db
      .query("emergencyAlerts")
      .withIndex("by_user_createdAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// ─────────────────────────────────────────────────────────────
// SOS — DÉTAIL D'UNE ALERTE
// ─────────────────────────────────────────────────────────────

export const getSOS = query({
  args: {
    alertId: v.id("emergencyAlerts"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const alert = await ctx.db.get(args.alertId);

    if (!alert || alert.userId !== user._id) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Alerte SOS introuvable",
      });
    }

    const recipients = await ctx.db
      .query("emergencyAlertRecipients")
      .withIndex("by_alert", (q) => q.eq("alertId", alert._id))
      .collect();

    return {
      ...alert,
      recipients,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// CHECK-IN DE SÉCURITÉ
// ─────────────────────────────────────────────────────────────

export const createSafetyCheckIn = mutation({
  args: {
    message: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    accuracy: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (
      args.latitude !== undefined &&
      (args.latitude < -90 || args.latitude > 90)
    ) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Latitude invalide",
      });
    }

    if (
      args.longitude !== undefined &&
      (args.longitude < -180 || args.longitude > 180)
    ) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Longitude invalide",
      });
    }

    const message = normalizeMessage(args.message);

    const now = Date.now();

    const contacts = await ctx.db
      .query("emergencyContacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const checkInId = await ctx.db.insert("safetyCheckIns", {
      userId: user._id,

      status: "created",

      message: message || "Je suis en sécurité.",

      latitude: args.latitude,
      longitude: args.longitude,
      accuracy: args.accuracy,

      recipientCount: contacts.length,

      createdAt: now,
    });

    /**
     * Le check-in est enregistré.
     *
     * Il ne doit pas être présenté comme "envoyé"
     * tant qu'un fournisseur de notification réel
     * n'est pas branché.
     */
    return {
      checkInId,
      status: "created" as const,
      recipientCount: contacts.length,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// ADMIN / JOB DE MAINTENANCE
// ─────────────────────────────────────────────────────────────

export const expireDueSOS = mutation({
  args: {
    alertId: v.id("emergencyAlerts"),
  },

  handler: async (ctx, args) => {
    const alert = await ctx.db.get(args.alertId);

    if (!alert) {
      return {
        success: false,
        reason: "NOT_FOUND",
      };
    }

    if (alert.status !== "active") {
      return {
        success: true,
        status: alert.status,
      };
    }

    const now = Date.now();

    if (now < alert.expiresAt) {
      return {
        success: false,
        reason: "NOT_DUE",
      };
    }

    await ctx.db.patch(args.alertId, {
      status: "expired",
      expiredAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      status: "expired" as const,
    };
  },
});
