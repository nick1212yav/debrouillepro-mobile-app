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
 * Les notifications sont retournées de la plus récente
 * à la plus ancienne.
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
      .collect();

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
 */
export const markAllRead = mutation({
  args: {},

  handler: async (ctx): Promise<void> => {
    const user = await requireUser(ctx);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", user._id).eq("read", false),
      )
      .collect();

    await Promise.all(
      unread.map((notification) =>
        ctx.db.patch(notification._id, {
          read: true,
        }),
      ),
    );
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
// SEED DEMO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Insérer des notifications de démonstration
 * pour un nouvel utilisateur.
 */
export const seedDemo = mutation({
  args: {},

  handler: async (ctx): Promise<void> => {
    const user = await getAuthenticatedUser(ctx);

    if (!user) {
      return;
    }

    const existing = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(1);

    if (existing.length > 0) {
      return;
    }

    const demos = [
      {
        userId: user._id,
        type: "payment" as const,
        module: "Paiement",
        title: "Paiement reçu",
        body: "Vous avez reçu 25 000 FCFA de Aminata Diallo via Mobile Money.",
        read: false,
        pinned: true,
        priority: "high" as const,
        initials: "AD",
        actionPage: "paiement",
        amount: "+25 000 FCFA",
        actionButtons: [
          {
            label: "Voir le reçu",
            variant: "primary" as const,
          },
        ],
      },

      {
        userId: user._id,
        type: "message" as const,
        module: "Messages",
        title: "Moussa Konaté",
        body: '"Bonjour, est-ce que l\'appartement du Plateau est encore disponible ?"',

        read: false,
        pinned: false,
        priority: "high" as const,
        initials: "MK",
        actionPage: "messages",

        actionButtons: [
          {
            label: "Répondre",
            variant: "primary" as const,
          },
          {
            label: "Ignorer",
            variant: "danger" as const,
          },
        ],
      },

      {
        userId: user._id,
        type: "sante" as const,
        module: "Santé",
        title: "RDV demain à 10h00",
        body: "Dr. Aissatou Fall — Centre Médical Gombe. N'oubliez pas votre carnet de santé.",

        read: false,
        pinned: true,
        priority: "high" as const,
        initials: "SF",
        actionPage: "sante",

        actionButtons: [
          {
            label: "Confirmer",
            variant: "primary" as const,
          },
          {
            label: "Annuler RDV",
            variant: "danger" as const,
          },
        ],
      },

      {
        userId: user._id,
        type: "delivery" as const,
        module: "Livraison",
        title: "Colis en route",
        body: "Votre colis DBP-2024-4821 est en route. Arrivée estimée : 14 min.",

        read: false,
        pinned: false,
        priority: "normal" as const,
        initials: "LV",
        actionPage: "livraison",

        actionButtons: [
          {
            label: "Suivre en live",
            variant: "primary" as const,
          },
        ],
      },

      {
        userId: user._id,
        type: "job" as const,
        module: "Jobs",
        title: "Candidature vue",
        body: "Talents Pro a consulté votre profil pour le poste de Développeur React Senior.",

        read: false,
        pinned: false,
        priority: "normal" as const,
        initials: "TP",
        actionPage: "jobs",
      },

      {
        userId: user._id,
        type: "agri" as const,
        module: "Agri",
        title: "Alerte météo agricole",
        body: "Risque de sécheresse détecté — moins de 5mm prévus cette semaine. Irrigation conseillée.",

        read: true,
        pinned: false,
        priority: "high" as const,
        initials: "AG",
        actionPage: "agri",
      },

      {
        userId: user._id,
        type: "transport" as const,
        module: "Transport",
        title: "Chauffeur confirmé",
        body: "Patrick K. a accepté votre course. Il arrive dans 3 min. Plaque : KIN-7845-A",

        read: true,
        pinned: false,
        priority: "normal" as const,
        initials: "TR",
        actionPage: "transport",
      },

      {
        userId: user._id,
        type: "community" as const,
        module: "Communauté",
        title: "Nouvelle réponse",
        body: 'Emile B. a commenté votre post : "Bonne initiative ! Je serais partant pour le covoiturage"',

        read: true,
        pinned: false,
        priority: "low" as const,
        initials: "CM",
        actionPage: "community",
      },

      {
        userId: user._id,
        type: "system" as const,
        module: "Système",
        title: "Bienvenue sur Débrouille Pro !",
        body: "Votre compte est prêt. Explorez les modules disponibles et commencez votre expérience.",

        read: false,
        pinned: false,
        priority: "normal" as const,
        initials: "DB",
        actionPage: "explorer",
      },
    ];

    for (const demo of demos) {
      await ctx.db.insert("notifications", demo);
    }
  },
});

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

    // Éviter les doublons immédiats.
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
        const duplicateKey = `streak-danger-${today}`;

        const existingDanger = await ctx.db
          .query("notifications")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .filter((q) => q.eq(q.field("body"), duplicateKey))
          .first();

        if (!existingDanger) {
          await ctx.db.insert("notifications", {
            userId: user._id,

            type: "streak",

            module: "Streak",

            title: `🔥 Ton streak de ${streak.currentStreak} jours est en danger !`,

            body: duplicateKey,

            read: false,

            pinned: true,

            priority: "high",

            actionPage: "home",
          });
        }
      }
    }

    // ───────────────────────────────────────────────────────────────────────
    // DIGEST MATINAL
    // ───────────────────────────────────────────────────────────────────────

    if (hour >= 6 && hour < 10) {
      const duplicateKey = `digest-${today}`;

      const existingDigest = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("body"), duplicateKey))
        .first();

      if (!existingDigest) {
        const greetings = [
          "Prêt à conquérir ta journée ? ⚡",
          "Ta communauté t'attend ! 👥",
          "Explore de nouvelles opportunités. 🌍",
          "Une action suffit pour tout changer. 💪",
        ];

        const message = greetings[Math.floor(Math.random() * greetings.length)];

        await ctx.db.insert("notifications", {
          userId: user._id,

          type: "digest",

          module: "Débrouille Pro",

          title: `Bonjour ! ${message}`,

          body: duplicateKey,

          read: false,

          pinned: false,

          priority: "normal",

          actionPage: "dashboard",
        });
      }
    }
  },
});
