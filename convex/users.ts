// convex/users.ts

import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ──────────────────────────────────────────────────────────────────────────────
// QUERIES
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Récupère l'utilisateur connecté à partir de l'identité Convex.
 *
 * - Retourne null si l'utilisateur n'est pas authentifié.
 * - Ne nécessite aucun argument.
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
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
  },
});

// Alias pour la compatibilité avec l'existant.
export const getMyProfile = getCurrentUser;

/**
 * Retourne les utilisateurs disponibles pour démarrer une conversation.
 *
 * Sécurité :
 * - nécessite une identité authentifiée ;
 * - ne retourne jamais l'utilisateur courant ;
 * - ne retourne que les informations nécessaires à l'UI de messagerie.
 *
 * Cette query évite d'exposer inutilement les champs privés du document users.
 */
export const listForMessaging = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!currentUser) {
      return [];
    }

    const users = await ctx.db.query("users").collect();

    return users
      .filter((user) => user._id !== currentUser._id)
      .map((user) => ({
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
      }));
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// MUTATIONS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Génère une URL temporaire sécurisée pour téléverser
 * un fichier vers le stockage Convex.
 */
export const generateUserAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Crée ou met à jour un utilisateur à partir des données Firebase/Convex.
 *
 * Le tokenIdentifier est récupéré automatiquement depuis l'identité Convex.
 *
 * Si l'identité Convex n'est pas encore disponible, la mutation retourne null
 * afin d'éviter un écran noir lors de la phase de connexion.
 */
export const createOrUpdateUser = mutation({
  args: {
    uid: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    name: v.string(),
    avatar: v.optional(v.string()),
    roles: v.array(v.string()),
    permissions: v.optional(v.array(v.string())),
    emailVerified: v.boolean(),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    language: v.optional(v.string()),
    profession: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      console.warn(
        "createOrUpdateUser: identité Convex absente – appel ignoré",
      );

      return null;
    }

    const tokenIdentifier = identity.tokenIdentifier;

    // --------------------------------------------------------------------------
    // 1. Recherche par UID Firebase
    // --------------------------------------------------------------------------

    let user = await ctx.db
      .query("users")
      .withIndex("by_uid", (q) => q.eq("uid", args.uid))
      .unique();

    // --------------------------------------------------------------------------
    // 2. Fallback par tokenIdentifier
    // --------------------------------------------------------------------------

    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
        .unique();
    }

    // --------------------------------------------------------------------------
    // 3. Mise à jour de l'utilisateur existant
    // --------------------------------------------------------------------------

    if (user) {
      // On conserve le uid existant et on met toujours à jour
      // le tokenIdentifier avec celui de l'identité courante.
      const { uid, ...patch } = args;

      await ctx.db.patch(user._id, {
        ...patch,
        tokenIdentifier,
      });

      return user._id;
    }

    // --------------------------------------------------------------------------
    // 4. Création du nouvel utilisateur
    // --------------------------------------------------------------------------

    return await ctx.db.insert("users", {
      ...args,
      tokenIdentifier,
      onboardingCompleted: false,
      reputationScore: 0,
    });
  },
});

/**
 * Met à jour le profil utilisateur.
 *
 * Gère également les avatars stockés dans Convex File Storage.
 */
export const updateProfile = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatar: v.optional(v.string()),
    storageId: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Utilisateur introuvable",
      });
    }

    const patch: {
      name?: string;
      bio?: string;
      avatar?: string;
    } = {};

    if (args.name !== undefined) {
      patch.name = args.name;
    }

    if (args.bio !== undefined) {
      patch.bio = args.bio;
    }

    // --------------------------------------------------------------------------
    // Avatar depuis Convex Storage
    // --------------------------------------------------------------------------

    if (args.storageId) {
      const publicUrl = await ctx.storage.getUrl(args.storageId);

      if (publicUrl) {
        patch.avatar = publicUrl;
      }
    } else if (args.avatar !== undefined) {
      patch.avatar = args.avatar;
    }

    await ctx.db.patch(user._id, patch);
  },
});

/**
 * Finalise l'onboarding utilisateur.
 */
export const completeOnboarding = mutation({
  args: {
    email: v.string(),
    city: v.string(),
    country: v.string(),
    roles: v.array(v.string()),
    interests: v.array(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Utilisateur introuvable",
      });
    }

    await ctx.db.patch(user._id, {
      city: args.city,
      country: args.country,
      roles: args.roles,
      interests: args.interests,
      onboardingCompleted: true,
    });
  },
});

/**
 * ⚠️ DÉPRÉCIÉ
 *
 * Conservé pour rétrocompatibilité.
 * Préférer createOrUpdateUser().
 */
export const updateCurrentUser = mutation({
  args: {
    email: v.string(),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Non authentifié",
      });
    }

    // --------------------------------------------------------------------------
    // Recherche par email
    // --------------------------------------------------------------------------

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    // --------------------------------------------------------------------------
    // Mise à jour
    // --------------------------------------------------------------------------

    if (existing) {
      await ctx.db.patch(existing._id, {
        tokenIdentifier: identity.tokenIdentifier,
        uid: identity.subject,
      });

      return existing._id;
    }

    // --------------------------------------------------------------------------
    // Création
    // --------------------------------------------------------------------------

    return await ctx.db.insert("users", {
      email: args.email,
      name: identity.name ?? "Utilisateur",
      avatar: identity.pictureUrl,
      uid: identity.subject,
      tokenIdentifier: identity.tokenIdentifier,
      roles: ["particulier"],
      permissions: [],
      emailVerified: false,
      onboardingCompleted: false,
      reputationScore: 0,
    });
  },
});
