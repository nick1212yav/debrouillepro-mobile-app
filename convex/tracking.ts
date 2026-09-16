// convex/tracking.ts

import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const MAX_NAME_LENGTH = 80;
const MAX_TRACKING_ID_LENGTH = 120;
const MAX_STATUS_LENGTH = 80;
const MAX_LOCATION_LENGTH = 200;
const MAX_NOTES_LENGTH = 1000;

const MIN_PROGRESS = 0;
const MAX_PROGRESS = 100;

const TRACKING_TYPES = ["colis", "vehicule", "appareil", "autre"] as const;

type TrackingType = (typeof TRACKING_TYPES)[number];

function fail(
  message: string,
  code:
    | "UNAUTHENTICATED"
    | "NOT_FOUND"
    | "FORBIDDEN"
    | "BAD_REQUEST"
    | "CONFLICT",
): never {
  throw new ConvexError({
    message,
    code,
  });
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function validateLength(
  value: string,
  field: string,
  maxLength: number,
): string {
  const normalized = normalizeText(value);

  if (!normalized) {
    fail(`${field} est requis`, "BAD_REQUEST");
  }

  if (normalized.length > maxLength) {
    fail(
      `${field} ne peut pas dépasser ${maxLength} caractères`,
      "BAD_REQUEST",
    );
  }

  return normalized;
}

function validateOptionalText(
  value: string | undefined,
  field: string,
  maxLength: number,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = normalizeText(value);

  if (!normalized) {
    return undefined;
  }

  if (normalized.length > maxLength) {
    fail(
      `${field} ne peut pas dépasser ${maxLength} caractères`,
      "BAD_REQUEST",
    );
  }

  return normalized;
}

function validateProgress(progress: number): number {
  if (!Number.isFinite(progress)) {
    fail("La progression doit être un nombre valide", "BAD_REQUEST");
  }

  if (progress < MIN_PROGRESS || progress > MAX_PROGRESS) {
    fail(
      `La progression doit être comprise entre ${MIN_PROGRESS} et ${MAX_PROGRESS}`,
      "BAD_REQUEST",
    );
  }

  return Math.round(progress);
}

function validateTrackingType(type: TrackingType): TrackingType {
  if (!TRACKING_TYPES.includes(type)) {
    fail("Type de suivi invalide", "BAD_REQUEST");
  }

  return type;
}

/**
 * Source de vérité d'authentification.
 *
 * Toutes les mutations sensibles passent par cette fonction.
 */
async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    fail("Non authentifié", "UNAUTHENTICATED");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    fail("Utilisateur introuvable", "NOT_FOUND");
  }

  return user;
}

/**
 * Vérifie que l'élément appartient réellement
 * à l'utilisateur connecté.
 *
 * IMPORTANT :
 * On utilise ici des IDs fortement typés afin que
 * ctx.db.get() soit spécialisé sur `trackingItems`.
 *
 * Cela évite que `item` soit inféré comme un union
 * de plusieurs documents Convex ne possédant pas tous
 * un champ `userId`.
 */
async function requireOwnedTrackingItem(
  ctx: MutationCtx,
  itemId: Id<"trackingItems">,
  userId: Id<"users">,
) {
  const item = await ctx.db.get(itemId);

  if (!item) {
    fail("Suivi introuvable", "NOT_FOUND");
  }

  if (item.userId !== userId) {
    fail("Accès interdit à ce suivi", "FORBIDDEN");
  }

  return item;
}

/**
 * Liste uniquement les suivis appartenant
 * à l'utilisateur authentifié.
 *
 * Aucun utilisateur ne peut demander les suivis
 * d'un autre compte.
 */
export const listMyTrackedItems = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("trackingItems")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

/**
 * Ajoute un nouveau suivi.
 *
 * IMPORTANT :
 * Le client ne décide plus :
 * - du statut initial ;
 * - de la progression initiale ;
 * - d'un faux identifiant.
 *
 * Le serveur initialise systématiquement :
 * status = "En attente"
 * progress = 0
 *
 * Le trackingId doit venir d'une vraie source :
 * transporteur, service de livraison, véhicule,
 * appareil ou système de suivi.
 */
export const addTrackingItem = mutation({
  args: {
    name: v.string(),

    type: v.union(
      v.literal("colis"),
      v.literal("vehicule"),
      v.literal("appareil"),
      v.literal("autre"),
    ),

    trackingId: v.string(),

    notes: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const name = validateLength(args.name, "Le nom", MAX_NAME_LENGTH);

    const trackingId = validateLength(
      args.trackingId,
      "L'identifiant de suivi",
      MAX_TRACKING_ID_LENGTH,
    );

    const type = validateTrackingType(args.type);

    const notes = validateOptionalText(
      args.notes,
      "Les notes",
      MAX_NOTES_LENGTH,
    );

    /**
     * Protection contre les doublons pour le même
     * utilisateur.
     *
     * On utilise l'index utilisateur disponible dans
     * le schéma actuel afin de ne pas supposer un index
     * supplémentaire qui n'existe peut-être pas encore.
     */
    const existingItems = await ctx.db
      .query("trackingItems")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const duplicate = existingItems.find(
      (item) => item.trackingId.toLowerCase() === trackingId.toLowerCase(),
    );

    if (duplicate) {
      fail(
        "Ce numéro de suivi est déjà enregistré dans ton espace",
        "CONFLICT",
      );
    }

    const now = new Date().toISOString();

    const itemId = await ctx.db.insert("trackingItems", {
      userId: user._id,
      name,
      type,
      trackingId,

      /**
       * Etat initial décidé par le serveur.
       * Le client ne peut pas déclarer lui-même
       * un colis livré.
       */
      status: "En attente",
      progress: 0,

      ...(notes !== undefined ? { notes } : {}),

      createdAt: now,
      updatedAt: now,
    });

    return itemId;
  },
});

/**
 * Mise à jour contrôlée d'un suivi appartenant
 * à l'utilisateur.
 *
 * Cette mutation est volontairement conservatrice :
 * elle ne permet pas de modifier trackingId,
 * userId, type ou createdAt.
 *
 * Pour un vrai tracking transporteur, les changements
 * de statut/progression/localisation devront idéalement
 * venir d'une mutation/action interne alimentée par
 * un provider vérifié, et non d'un appel client direct.
 */
export const updateTrackingItem = mutation({
  args: {
    itemId: v.id("trackingItems"),

    status: v.optional(v.string()),

    location: v.optional(v.string()),

    progress: v.optional(v.number()),

    notes: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const item = await requireOwnedTrackingItem(ctx, args.itemId, user._id);

    const updates: {
      status?: string;
      location?: string;
      progress?: number;
      notes?: string;
      updatedAt: string;
    } = {
      updatedAt: new Date().toISOString(),
    };

    if (args.status !== undefined) {
      updates.status = validateLength(
        args.status,
        "Le statut",
        MAX_STATUS_LENGTH,
      );
    }

    if (args.location !== undefined) {
      const location = validateOptionalText(
        args.location,
        "La localisation",
        MAX_LOCATION_LENGTH,
      );

      if (location === undefined) {
        /**
         * Le schéma actuel accepte un champ
         * optionnel. On ne force pas ici une valeur
         * vide comme localisation réelle.
         */
        updates.location = "";
      } else {
        updates.location = location;
      }
    }

    if (args.progress !== undefined) {
      updates.progress = validateProgress(args.progress);
    }

    if (args.notes !== undefined) {
      const notes = validateOptionalText(
        args.notes,
        "Les notes",
        MAX_NOTES_LENGTH,
      );

      if (notes === undefined) {
        updates.notes = "";
      } else {
        updates.notes = notes;
      }
    }

    /**
     * Evite une écriture inutile lorsque rien
     * n'a réellement été demandé.
     */
    const hasChanges =
      updates.status !== undefined ||
      updates.location !== undefined ||
      updates.progress !== undefined ||
      updates.notes !== undefined;

    if (!hasChanges) {
      return item._id;
    }

    await ctx.db.patch(item._id, updates);

    return item._id;
  },
});

/**
 * Mutation interne réservée aux traitements backend.
 *
 * Cette porte est prévue pour la future connexion
 * transporteur/provider.
 *
 * Le client mobile ne doit pas appeler cette mutation
 * directement.
 *
 * Elle permet de centraliser la logique de mise à jour
 * provenant d'une source backend de confiance.
 */
export const updateTrackingFromSource = internalMutation({
  args: {
    itemId: v.id("trackingItems"),

    status: v.optional(v.string()),

    location: v.optional(v.string()),

    progress: v.optional(v.number()),

    notes: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);

    if (!item) {
      fail("Suivi introuvable", "NOT_FOUND");
    }

    const updates: {
      status?: string;
      location?: string;
      progress?: number;
      notes?: string;
      updatedAt: string;
    } = {
      updatedAt: new Date().toISOString(),
    };

    if (args.status !== undefined) {
      updates.status = validateLength(
        args.status,
        "Le statut",
        MAX_STATUS_LENGTH,
      );
    }

    if (args.location !== undefined) {
      const location = validateOptionalText(
        args.location,
        "La localisation",
        MAX_LOCATION_LENGTH,
      );

      if (location !== undefined) {
        updates.location = location;
      }
    }

    if (args.progress !== undefined) {
      updates.progress = validateProgress(args.progress);
    }

    if (args.notes !== undefined) {
      const notes = validateOptionalText(
        args.notes,
        "Les notes",
        MAX_NOTES_LENGTH,
      );

      if (notes !== undefined) {
        updates.notes = notes;
      }
    }

    const hasChanges =
      updates.status !== undefined ||
      updates.location !== undefined ||
      updates.progress !== undefined ||
      updates.notes !== undefined;

    if (!hasChanges) {
      return item._id;
    }

    await ctx.db.patch(item._id, updates);

    return item._id;
  },
});

/**
 * Suppression sécurisée.
 *
 * Impossible de supprimer le suivi d'un autre
 * utilisateur.
 */
export const deleteTrackingItem = mutation({
  args: {
    itemId: v.id("trackingItems"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const item = await requireOwnedTrackingItem(ctx, args.itemId, user._id);

    await ctx.db.delete(item._id);

    return {
      success: true,
      itemId: item._id,
    };
  },
});
