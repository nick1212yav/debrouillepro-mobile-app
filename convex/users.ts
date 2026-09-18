// convex/users.ts

import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { buildUserSearchText } from "./lib/userSearch";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

// ──────────────────────────────────────────────────────────────────────────────
// HELPER — résolution hybride token / email
// ──────────────────────────────────────────────────────────────────────────────
//
// Ordre de résolution :
//
//   1. tokenIdentifier  (source canonique)
//   2. email            (fallback legacy, seulement si l'identité Convex
//                       porte le même email que celui fourni)
//
// Sur résolution par email, on auto-migre le token sur le document trouvé.
// Les appels suivants seront résolus directement par token.
//
// Ce helper est volontairement typé MutationCtx car il effectue une écriture
// lorsqu'une résolution legacy par email est nécessaire.
// ──────────────────────────────────────────────────────────────────────────────

async function resolveCurrentUser(ctx: MutationCtx, providedEmail?: string) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  // ─── 1. Résolution canonique par token ─────────────────────────────────────

  const byToken = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (byToken) {
    return byToken;
  }

  // ─── 2. Fallback legacy par email vérifié ─────────────────────────────────

  const identityEmail = identity.email ?? null;

  if (identityEmail && providedEmail && identityEmail === providedEmail) {
    const byEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", providedEmail))
      .unique();

    if (byEmail) {
      // Auto-migration du token.
      await ctx.db.patch(byEmail._id, {
        tokenIdentifier: identity.tokenIdentifier,
      });

      // Relit le document après migration afin de retourner
      // l'état effectivement persisté.
      return await ctx.db.get(byEmail._id);
    }
  }

  return null;
}

// ──────────────────────────────────────────────────────────────────────────────
// QUERIES
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Récupère l'utilisateur connecté à partir de l'identité Convex.
 *
 * Retourne null si l'utilisateur n'est pas authentifié ou introuvable.
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

export const getMyProfile = getCurrentUser;

/**
 * Retourne les utilisateurs disponibles pour démarrer une conversation.
 *
 * L'utilisateur courant est toujours exclu.
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
 * Génère une URL d'upload Convex Storage pour l'avatar.
 */
export const generateUserAvatarUploadUrl = mutation({
  args: {},

  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// CREATE / UPDATE USER
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Crée ou met à jour un utilisateur à partir des données Firebase/Convex.
 *
 * Le tokenIdentifier est toujours récupéré depuis l'identité Convex.
 *
 * searchText est reconstruit à partir des champs publics du profil afin que
 * le Search Index utilisateur reste synchronisé.
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

    let user = await ctx.db
      .query("users")
      .withIndex("by_uid", (q) => q.eq("uid", args.uid))
      .unique();

    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
        .unique();
    }

    // ─── Données destinées à la recherche ───────────────────────────────────

    const searchText = buildUserSearchText({
      name: args.name,
      bio: user?.bio,
      city: args.city,
      country: args.country,
      profession: args.profession,
      interests: args.interests,
      roles: args.roles,
    });

    // ─── Utilisateur existant ───────────────────────────────────────────────

    if (user) {
      const { uid: _uid, ...patch } = args;

      await ctx.db.patch(user._id, {
        ...patch,
        tokenIdentifier,
        searchText,
      });

      return user._id;
    }

    // ─── Nouvel utilisateur ─────────────────────────────────────────────────

    return await ctx.db.insert("users", {
      ...args,
      tokenIdentifier,
      onboardingCompleted: false,
      reputationScore: 0,
      searchText,
    });
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// UPDATE PROFILE
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Met à jour le profil utilisateur.
 *
 * Résolution :
 *   1. tokenIdentifier
 *   2. fallback email vérifié
 *
 * `email` reste accepté pour compatibilité avec les appels existants.
 *
 * IMPORTANT :
 * searchText est reconstruit à partir des nouvelles valeurs + des valeurs
 * existantes afin qu'une modification partielle du profil ne fasse pas
 * disparaître les autres données du profil de l'index.
 */
export const updateProfile = mutation({
  args: {
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatar: v.optional(v.string()),
    storageId: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await resolveCurrentUser(ctx, args.email);

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Utilisateur introuvable",
      });
    }

    const nextName = args.name ?? user.name;
    const nextBio = args.bio ?? user.bio;

    let nextAvatar = user.avatar;

    if (args.storageId) {
      const storageId = args.storageId as Id<"_storage">;
      const publicUrl = await ctx.storage.getUrl(storageId);

      if (publicUrl) {
        nextAvatar = publicUrl;
      }
    } else if (args.avatar !== undefined) {
      nextAvatar = args.avatar;
    }

    const searchText = buildUserSearchText({
      name: nextName,
      bio: nextBio,
      city: user.city,
      country: user.country,
      profession: user.profession,
      interests: user.interests,
      roles: user.roles,
    });

    await ctx.db.patch(user._id, {
      ...(args.email !== undefined ? { email: args.email } : {}),
      name: nextName,
      bio: nextBio,
      avatar: nextAvatar,
      searchText,
    });

    return user._id;
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// COMPLETE ONBOARDING
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Finalise l'onboarding utilisateur.
 *
 * Les données utilisées pour le profil de recherche sont immédiatement
 * synchronisées avec le Search Index.
 */
export const completeOnboarding = mutation({
  args: {
    email: v.optional(v.string()),
    city: v.string(),
    country: v.string(),
    roles: v.array(v.string()),
    interests: v.array(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await resolveCurrentUser(ctx, args.email);

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Utilisateur introuvable",
      });
    }

    const searchText = buildUserSearchText({
      name: user.name,
      bio: user.bio,
      city: args.city,
      country: args.country,
      profession: user.profession,
      interests: args.interests,
      roles: args.roles,
    });

    await ctx.db.patch(user._id, {
      ...(args.email !== undefined ? { email: args.email } : {}),
      city: args.city,
      country: args.country,
      roles: args.roles,
      interests: args.interests,
      onboardingCompleted: true,
      searchText,
    });

    return user._id;
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// UPDATE CURRENT USER — LEGACY
// ──────────────────────────────────────────────────────────────────────────────

/**
 * ⚠️ DÉPRÉCIÉ — conservé pour rétrocompatibilité.
 *
 * Préférer createOrUpdateUser().
 *
 * `email` reste optionnel et sert uniquement au fallback legacy.
 */
export const updateCurrentUser = mutation({
  args: {
    email: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Non authentifié",
      });
    }

    // ─── 1. Résolution canonique par token ──────────────────────────────────

    const byToken = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (byToken) {
      const searchText = buildUserSearchText({
        name: byToken.name,
        bio: byToken.bio,
        city: byToken.city,
        country: byToken.country,
        profession: byToken.profession,
        interests: byToken.interests,
        roles: byToken.roles,
      });

      await ctx.db.patch(byToken._id, {
        uid: identity.subject,
        searchText,
      });

      return byToken._id;
    }

    // ─── 2. Fallback email vérifié ──────────────────────────────────────────

    const identityEmail = identity.email ?? null;

    if (identityEmail && args.email && identityEmail === args.email) {
      const byEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .unique();

      if (byEmail) {
        const searchText = buildUserSearchText({
          name: byEmail.name,
          bio: byEmail.bio,
          city: byEmail.city,
          country: byEmail.country,
          profession: byEmail.profession,
          interests: byEmail.interests,
          roles: byEmail.roles,
        });

        await ctx.db.patch(byEmail._id, {
          tokenIdentifier: identity.tokenIdentifier,
          uid: identity.subject,
          searchText,
        });

        return byEmail._id;
      }
    }

    // ─── 3. Création legacy ─────────────────────────────────────────────────

    const roles = ["particulier"];
    const name = identity.name ?? "Utilisateur";

    const searchText = buildUserSearchText({
      name,
      roles,
    });

    return await ctx.db.insert("users", {
      email: args.email,
      name,
      avatar: identity.pictureUrl,
      uid: identity.subject,
      tokenIdentifier: identity.tokenIdentifier,
      roles,
      permissions: [],
      emailVerified: false,
      onboardingCompleted: false,
      reputationScore: 0,
      searchText,
    });
  },
});
