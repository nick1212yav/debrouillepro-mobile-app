// convex/notifications.ts
//
// MODULE GLOBAL DES NOTIFICATIONS DE DÉBROUILLE PRO
//
// ⚠️ À NE PAS CONFONDRE AVEC :
//   convex/messages/notifications.ts
//
// Ce fichier gère les notifications globales de l'application :
// - système
// - messages
// - jobs
// - immobilier
// - paiements
// - livraison
// - santé
// - agriculture
// - transport
// - communauté
// - likes / commentaires / follows
// - streak
// - digest
// - notifications push
//
// Il est exposé via :
//   api.notifications.*
//
// La logique spécifique au module Messages reste dans :
//   convex/messages/notifications.ts

import { ConvexError } from "convex/values";
import { v } from "convex/values";

import { internalMutation, mutation, query } from "./_generated/server";

import { internal } from "./_generated/api";

import type { MutationCtx, QueryCtx } from "./_generated/server";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────

const MAX_NOTIFICATIONS = 100;
const MAX_UNREAD_COUNT = 1000;

const MARK_READ_BATCH_SIZE = 500;

const SOCIAL_DEDUP_WINDOW_MS = 60_000;
const SOCIAL_RECENT_SCAN_LIMIT = 10;

const MAX_TITLE_LENGTH = 200;
const MAX_BODY_LENGTH = 2000;
const MAX_MODULE_LENGTH = 100;
const MAX_ACTION_PAGE_LENGTH = 500;
const MAX_INITIALS_LENGTH = 20;
const MAX_AMOUNT_LENGTH = 100;

const MAX_PUSH_ENDPOINT_LENGTH = 4096;
const MAX_PUSH_KEY_LENGTH = 1024;

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATEURS
// ─────────────────────────────────────────────────────────────────────────────

const notifTypeValidator = v.union(
  v.literal("message"),
  v.literal("job"),
  v.literal("immo"),
  v.literal("payment"),
  v.literal("system"),
  v.literal("delivery"),
  v.literal("sante"),
  v.literal("agri"),
  v.literal("transport"),
  v.literal("community"),
  v.literal("like"),
  v.literal("comment"),
  v.literal("follow"),
  v.literal("boost"),
  v.literal("event"),
  v.literal("streak"),
  v.literal("digest"),
  v.literal("annonce"),
);

const priorityValidator = v.union(
  v.literal("high"),
  v.literal("normal"),
  v.literal("low"),
);

const actionButtonValidator = v.object({
  label: v.string(),
  variant: v.union(v.literal("primary"), v.literal("danger")),
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

function assertNonEmpty(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new ConvexError({
      message: `${field} ne peut pas être vide`,
      code: "INVALID_ARGUMENT",
    });
  }
}

function assertMaxLength(
  value: string | undefined,
  maxLength: number,
  field: string,
): void {
  if (value !== undefined && value.length > maxLength) {
    throw new ConvexError({
      message: `${field} dépasse la longueur maximale autorisée`,
      code: "INVALID_ARGUMENT",
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS AUTHENTIFICATION
// ─────────────────────────────────────────────────────────────────────────────

async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const user = await getAuthenticatedUser(ctx);

  if (!user) {
    throw new ConvexError({
      message: "Utilisateur non authentifié",
      code: "UNAUTHENTICATED",
    });
  }

  return user;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Récupérer les notifications de l'utilisateur connecté.
 *
 * Résultat borné pour protéger les performances du client.
 *
 * Une pagination native pourra être introduite ultérieurement
 * sans modifier la source de vérité `notifications`.
 */
export const list = query({
  args: {},

  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(MAX_NOTIFICATIONS);
  },
});

/**
 * Compter les notifications non lues.
 *
 * Le résultat est plafonné à MAX_UNREAD_COUNT.
 */
export const unreadCount = query({
  args: {},

  handler: async (ctx): Promise<number> => {
    const user = await getAuthenticatedUser(ctx);

    if (!user) {
      return 0;
    }

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", user._id).eq("read", false),
      )
      .take(MAX_UNREAD_COUNT);

    return unread.length;
  },
});

/**
 * Vérifier si l'utilisateur possède au moins
 * une souscription push active.
 */
export const hasPushSubscription = query({
  args: {},

  handler: async (ctx): Promise<boolean> => {
    const user = await getAuthenticatedUser(ctx);

    if (!user) {
      return false;
    }

    const subscription = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return subscription !== null;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS — LECTURE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Marquer une notification comme lue.
 *
 * Ownership obligatoire :
 * une notification appartenant à un autre utilisateur
 * ne peut jamais être modifiée.
 */
export const markNotificationRead = mutation({
  args: {
    id: v.id("notifications"),
  },

  handler: async (ctx, args): Promise<void> => {
    const user = await requireUser(ctx);

    const notification = await ctx.db.get(args.id);

    if (!notification) {
      return;
    }

    if (notification.userId !== user._id) {
      return;
    }

    if (notification.read) {
      return;
    }

    await ctx.db.patch(args.id, {
      read: true,
    });
  },
});

/**
 * Marquer toutes les notifications comme lues.
 *
 * Le traitement est effectué par lots afin d'éviter
 * une mutation géante susceptible de dépasser les limites
 * de transaction.
 *
 * Si un lot complet est traité, une continuation interne
 * est programmée.
 */
export const markAllRead = mutation({
  args: {},

  handler: async (ctx): Promise<void> => {
    const user = await requireUser(ctx);

    const batch = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", user._id).eq("read", false),
      )
      .take(MARK_READ_BATCH_SIZE);

    if (batch.length === 0) {
      return;
    }

    await Promise.all(
      batch.map((notification) =>
        ctx.db.patch(notification._id, {
          read: true,
        }),
      ),
    );

    if (batch.length === MARK_READ_BATCH_SIZE) {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.continueMarkAllRead,
        {
          userId: user._id,
        },
      );
    }
  },
});

/**
 * Continuation interne de markAllRead.
 */
export const continueMarkAllRead = internalMutation({
  args: {
    userId: v.id("users"),
  },

  handler: async (ctx, args): Promise<void> => {
    const batch = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", args.userId).eq("read", false),
      )
      .take(MARK_READ_BATCH_SIZE);

    if (batch.length === 0) {
      return;
    }

    await Promise.all(
      batch.map((notification) =>
        ctx.db.patch(notification._id, {
          read: true,
        }),
      ),
    );

    if (batch.length === MARK_READ_BATCH_SIZE) {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.continueMarkAllRead,
        {
          userId: args.userId,
        },
      );
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS — SUPPRESSION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Supprimer une notification appartenant à l'utilisateur connecté.
 */
export const dismiss = mutation({
  args: {
    id: v.id("notifications"),
  },

  handler: async (ctx, args): Promise<void> => {
    const user = await requireUser(ctx);

    const notification = await ctx.db.get(args.id);

    if (!notification) {
      return;
    }

    if (notification.userId !== user._id) {
      return;
    }

    await ctx.db.delete(args.id);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS — INSERTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Insérer une notification pour l'utilisateur connecté.
 *
 * API historique conservée :
 *
 *   api.notifications.insert
 *
 * Les validations supplémentaires protègent la taille des données
 * sans modifier le contrat fonctionnel.
 */
export const insert = mutation({
  args: {
    type: notifTypeValidator,

    module: v.string(),

    title: v.string(),

    body: v.string(),

    pinned: v.optional(v.boolean()),

    priority: v.optional(priorityValidator),

    initials: v.optional(v.string()),

    actionPage: v.optional(v.string()),

    amount: v.optional(v.string()),

    actionButtons: v.optional(v.array(actionButtonValidator)),
  },

  handler: async (ctx, args): Promise<void> => {
    const user = await requireUser(ctx);

    assertNonEmpty(args.module, "module");
    assertNonEmpty(args.title, "title");

    assertMaxLength(args.module, MAX_MODULE_LENGTH, "module");

    assertMaxLength(args.title, MAX_TITLE_LENGTH, "title");

    assertMaxLength(args.body, MAX_BODY_LENGTH, "body");

    assertMaxLength(args.initials, MAX_INITIALS_LENGTH, "initials");

    assertMaxLength(args.actionPage, MAX_ACTION_PAGE_LENGTH, "actionPage");

    assertMaxLength(args.amount, MAX_AMOUNT_LENGTH, "amount");

    await ctx.db.insert("notifications", {
      userId: user._id,

      type: args.type,

      module: args.module,

      title: args.title,

      body: args.body,

      read: false,

      pinned: args.pinned ?? false,

      priority: args.priority ?? "normal",

      initials: args.initials,

      actionPage: args.actionPage,

      amount: args.amount,

      actionButtons: args.actionButtons,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PUSH SUBSCRIPTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Enregistrer ou mettre à jour une souscription push.
 *
 * L'endpoint est la clé d'identification de la souscription.
 *
 * Un utilisateur ne peut jamais reprendre l'endpoint
 * appartenant à un autre compte.
 */
export const registerPush = mutation({
  args: {
    endpoint: v.string(),

    p256dh: v.string(),

    auth: v.string(),
  },

  handler: async (ctx, args): Promise<void> => {
    const user = await requireUser(ctx);

    assertNonEmpty(args.endpoint, "endpoint");

    assertNonEmpty(args.p256dh, "p256dh");

    assertNonEmpty(args.auth, "auth");

    assertMaxLength(args.endpoint, MAX_PUSH_ENDPOINT_LENGTH, "endpoint");

    assertMaxLength(args.p256dh, MAX_PUSH_KEY_LENGTH, "p256dh");

    assertMaxLength(args.auth, MAX_PUSH_KEY_LENGTH, "auth");

    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();

    if (existing) {
      if (existing.userId !== user._id) {
        throw new ConvexError({
          message: "Cette souscription push appartient à un autre utilisateur",
          code: "FORBIDDEN",
        });
      }

      await ctx.db.patch(existing._id, {
        keys: {
          p256dh: args.p256dh,
          auth: args.auth,
        },
      });

      return;
    }

    await ctx.db.insert("pushSubscriptions", {
      userId: user._id,

      endpoint: args.endpoint,

      keys: {
        p256dh: args.p256dh,
        auth: args.auth,
      },
    });
  },
});

/**
 * Désenregistrer une souscription push.
 */
export const unregisterPush = mutation({
  args: {
    endpoint: v.string(),
  },

  handler: async (ctx, args): Promise<void> => {
    const user = await requireUser(ctx);

    assertNonEmpty(args.endpoint, "endpoint");

    assertMaxLength(args.endpoint, MAX_PUSH_ENDPOINT_LENGTH, "endpoint");

    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();

    if (!existing) {
      return;
    }

    if (existing.userId !== user._id) {
      return;
    }

    await ctx.db.delete(existing._id);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// SEED DEMO — SUPPRIMÉ
// ─────────────────────────────────────────────────────────────────────────────
//
// Aucune notification fictive n'est générée ici.
//
// `notifications` reste une source de vérité réelle.
//
// Si un environnement de démonstration est nécessaire,
// il doit utiliser une source de données explicitement dédiée
// au mode démo et ne jamais polluer les notifications réelles.
//
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS SOCIALES INTERNES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Créer une notification sociale depuis une autre mutation.
 *
 * Cas supportés :
 * - like
 * - comment
 * - follow
 *
 * Fonction interne uniquement.
 */
export const createSocial = internalMutation({
  args: {
    toUserId: v.id("users"),

    fromUserId: v.id("users"),

    type: v.union(v.literal("like"), v.literal("comment"), v.literal("follow")),

    fromUserName: v.optional(v.string()),

    fromUserAvatar: v.optional(v.string()),

    publicationId: v.optional(v.id("publications")),

    title: v.string(),

    body: v.string(),

    actionPage: v.optional(v.string()),
  },

  handler: async (ctx, args): Promise<void> => {
    // ─────────────────────────────────────────────────────────────────────
    // AUTO-NOTIFICATION INTERDITE
    // ─────────────────────────────────────────────────────────────────────

    if (args.toUserId === args.fromUserId) {
      return;
    }

    assertNonEmpty(args.title, "title");

    assertMaxLength(args.title, MAX_TITLE_LENGTH, "title");

    assertMaxLength(args.body, MAX_BODY_LENGTH, "body");

    assertMaxLength(args.fromUserName, MAX_TITLE_LENGTH, "fromUserName");

    assertMaxLength(
      args.fromUserAvatar,
      MAX_ACTION_PAGE_LENGTH,
      "fromUserAvatar",
    );

    assertMaxLength(args.actionPage, MAX_ACTION_PAGE_LENGTH, "actionPage");

    // ─────────────────────────────────────────────────────────────────────
    // DÉDUPLICATION COURTE
    // ─────────────────────────────────────────────────────────────────────

    const recent = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.toUserId))
      .order("desc")
      .take(SOCIAL_RECENT_SCAN_LIMIT);

    const oneMinuteAgo = Date.now() - SOCIAL_DEDUP_WINDOW_MS;

    const duplicate = recent.find((notification) => {
      if (notification.fromUserId !== args.fromUserId) {
        return false;
      }

      if (notification.type !== args.type) {
        return false;
      }

      if (notification._creationTime <= oneMinuteAgo) {
        return false;
      }

      if (args.publicationId) {
        return notification.publicationId === args.publicationId;
      }

      return true;
    });

    if (duplicate) {
      return;
    }

    // ─────────────────────────────────────────────────────────────────────
    // INSERTION
    // ─────────────────────────────────────────────────────────────────────

    await ctx.db.insert("notifications", {
      userId: args.toUserId,

      type: args.type,

      fromUserId: args.fromUserId,

      fromUserName: args.fromUserName,

      fromUserAvatar: args.fromUserAvatar,

      publicationId: args.publicationId,

      module: args.type === "follow" ? "Réseau" : "Feed",

      title: args.title,

      body: args.body,

      read: false,

      pinned: false,

      priority: "normal",

      actionPage: args.actionPage ?? "home",
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS INTELLIGENTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Créer les notifications intelligentes réellement justifiées
 * par les données présentes en base.
 *
 * Actuellement :
 * - danger du streak
 * - digest quotidien
 *
 * Aucune donnée utilisateur fictive n'est générée.
 */
export const sendSmartNotifs = mutation({
  args: {},

  handler: async (ctx): Promise<void> => {
    const user = await getAuthenticatedUser(ctx);

    if (!user) {
      return;
    }

    // Les règles historiques de ce module utilisent UTC.
    const now = new Date();

    const today = now.toISOString().slice(0, 10);

    const hour = now.getUTCHours();

    // ─────────────────────────────────────────────────────────────────────
    // STREAK EN DANGER
    // ─────────────────────────────────────────────────────────────────────

    const streak = await ctx.db
      .query("userStreaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (streak && streak.currentStreak > 0 && hour >= 16) {
      const yesterday = (() => {
        const date = new Date();

        date.setUTCDate(date.getUTCDate() - 1);

        return date.toISOString().slice(0, 10);
      })();

      const isInDanger = streak.lastClaimedDate === yesterday;

      if (isInDanger) {
        const dedupKey = `streak-danger-${today}`;

        const existingDanger = await ctx.db
          .query("notifications")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .filter((q) => q.eq(q.field("actionPage"), dedupKey))
          .first();

        if (!existingDanger) {
          await ctx.db.insert("notifications", {
            userId: user._id,

            type: "streak",

            module: "Streak",

            title: `🔥 Ton streak de ${streak.currentStreak} jours est en danger !`,

            body: "Reviens aujourd'hui pour le conserver.",

            read: false,

            pinned: true,

            priority: "high",

            actionPage: dedupKey,
          });
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // DIGEST MATINAL
    // ─────────────────────────────────────────────────────────────────────

    if (hour >= 6 && hour < 10) {
      const dedupKey = `digest-${today}`;

      const existingDigest = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("actionPage"), dedupKey))
        .first();

      if (!existingDigest) {
        await ctx.db.insert("notifications", {
          userId: user._id,

          type: "digest",

          module: "Débrouille Pro",

          title: "Ton résumé du jour est prêt",

          body: "",

          read: false,

          pinned: false,

          priority: "normal",

          actionPage: dedupKey,
        });
      }
    }
  },
});
