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

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import type { MutationCtx, QueryCtx } from "./_generated/server";

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
  v.literal("annonce"), // aligné sur convex/schema.ts
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
 * Bornée à 100. Le client consomme cette query comme un tableau simple.
 * Une pagination native sera introduite avec une migration client dédiée.
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
      .take(100);
  },
});

/**
 * Compter les notifications non lues.
 *
 * Bornée à 1000. Au-delà, la valeur retournée est plafonnée.
 * Un utilisateur avec plus de 1000 non-lues relève d'un problème UX,
 * pas d'un problème de compteur.
 */
export const unreadCount = query({
  args: {},
  handler: async (ctx): Promise<number> => {
    const user = await getAuthenticatedUser(ctx);

    if (!user) {
      return 0;
    }

    const MAX_UNREAD_COUNT = 1000;

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
 * Vérifier si l'utilisateur possède une souscription push.
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
// MUTATIONS NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Marquer une notification comme lue.
 */
export const markNotificationRead = mutation({
  args: {
    id: v.id("notifications"),
  },

  handler: async (ctx, args): Promise<void> => {
    const user = await requireUser(ctx);

    const notification = await ctx.db.get(args.id);

    if (!notification || notification.userId !== user._id) {
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
 * Traitement par lot de 500 dans cette mutation. Si un second lot reste
 * à traiter, la suite est déléguée à `continueMarkAllRead` via le
 * scheduler — évite tout timeout sur de gros volumes.
 */
export const markAllRead = mutation({
  args: {},

  handler: async (ctx): Promise<void> => {
    const user = await requireUser(ctx);

    const BATCH = 500;

    const batch = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", user._id).eq("read", false),
      )
      .take(BATCH);

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

    if (batch.length === BATCH) {
      // Il peut rester d'autres non-lues. On délègue la suite.
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.continueMarkAllRead,
        { userId: user._id },
      );
    }
  },
});

/**
 * Continuation de `markAllRead`.
 *
 * Internal uniquement : déclenchée par scheduler, jamais exposée au client.
 * Traite le lot suivant et se re-planifie tant qu'il reste des non-lues.
 */
export const continueMarkAllRead = internalMutation({
  args: {
    userId: v.id("users"),
  },

  handler: async (ctx, args): Promise<void> => {
    const BATCH = 500;

    const batch = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", args.userId).eq("read", false),
      )
      .take(BATCH);

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

    if (batch.length === BATCH) {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.continueMarkAllRead,
        { userId: args.userId },
      );
    }
  },
});

/**
 * Supprimer une notification.
 */
export const dismiss = mutation({
  args: {
    id: v.id("notifications"),
  },

  handler: async (ctx, args): Promise<void> => {
    const user = await requireUser(ctx);

    const notification = await ctx.db.get(args.id);

    if (!notification || notification.userId !== user._id) {
      return;
    }

    await ctx.db.delete(args.id);
  },
});

/**
 * Insérer une notification pour l'utilisateur connecté.
 *
 * Cette fonction conserve l'API historique :
 *   api.notifications.insert
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
 */
export const registerPush = mutation({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  },

  handler: async (ctx, args): Promise<void> => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();

    if (existing) {
      // Un endpoint appartient déjà à un utilisateur.
      // On ne permet pas à un autre compte de le modifier.
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

    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();

    if (!existing) {
      return;
    }

    // Ne jamais supprimer la souscription d'un autre utilisateur.
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
// `seedDemo` insérait 9 notifications fictives présentées comme réelles
// (faux paiement de 25 000 FCFA, faux RDV médical, faux colis en livraison,
// faux commentaire d'utilisateur…).
//
// Cette mutation violait la règle « zéro donnée fabriquée présentée comme
// réelle ». Elle a été supprimée ainsi que son appel automatique côté
// client (useNotificationsSeeder).
//
// Si un mode démonstration est nécessaire pour un test utilisateur,
// il devra être un bouton explicite dans les réglages dev, et construire
// un état observable dans une table dédiée (jamais dans `notifications`
// qui est la source de vérité de l'utilisateur).

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS SOCIALES INTERNES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Créer une notification sociale depuis une autre mutation :
 *
 * - like
 * - comment
 * - follow
 *
 * Cette fonction est interne.
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
    // Ne jamais créer de notification pour soi-même.
    if (args.toUserId === args.fromUserId) {
      return;
    }

    // Éviter les doublons immédiats (fenêtre d'une minute).
    const recent = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.toUserId))
      .order("desc")
      .take(10);

    const oneMinuteAgo = Date.now() - 60_000;

    const duplicate = recent.find(
      (notification) =>
        notification.fromUserId === args.fromUserId &&
        notification.type === args.type &&
        (args.publicationId
          ? notification.publicationId === args.publicationId
          : true) &&
        notification._creationTime > oneMinuteAgo,
    );

    if (duplicate) {
      return;
    }

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
 * Créer les notifications intelligentes :
 *
 * - danger du streak
 * - digest matinal
 *
 * IMPORTANT :
 * - Aucun contenu fabriqué (pas de greeting aléatoire).
 * - Aucune clé technique dans `body` (le `body` est lu par l'UI).
 * - La déduplication se fait via `actionPage`, qui contient la clé
 *   technique `streak-danger-YYYY-MM-DD` / `digest-YYYY-MM-DD`.
 */
export const sendSmartNotifs = mutation({
  args: {},

  handler: async (ctx): Promise<void> => {
    const user = await getAuthenticatedUser(ctx);

    if (!user) {
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    const hour = new Date().getUTCHours();

    // ───────────────────────────────────────────────────────────────────────
    // STREAK EN DANGER
    // ───────────────────────────────────────────────────────────────────────

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

            body: `Reviens aujourd'hui pour le conserver.`,

            read: false,

            pinned: true,

            priority: "high",

            actionPage: dedupKey,
          });
        }
      }
    }

    // ───────────────────────────────────────────────────────────────────────
    // DIGEST MATINAL
    // ───────────────────────────────────────────────────────────────────────

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

          title: `Ton résumé du jour est prêt`,

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
