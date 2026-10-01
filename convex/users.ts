// convex/users.ts

import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { buildUserSearchText } from "./lib/userSearch";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

// ──────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────────────────────────────────

const MIN_LATITUDE = -90;
const MAX_LATITUDE = 90;

const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Normalise une chaîne destinée à devenir un slug public.
 */
function normalizeSlugPart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Génère un slug stable.
 *
 * Le suffixe basé sur le UID permet d'éviter les collisions
 * sans nécessiter de compteur global.
 */
function buildStableSlug(name: string, uid: string): string {
  const base = normalizeSlugPart(name) || "utilisateur";
  const suffix = normalizeSlugPart(uid).slice(-10);

  return suffix ? `${base}-${suffix}`.slice(0, 80) : base;
}

/**
 * Construit le texte utilisé par l'index de recherche.
 */
function buildSearchTextForUser(
  user: Pick<
    Doc<"users">,
    "name" | "bio" | "city" | "country" | "profession" | "interests" | "roles"
  >,
): string {
  return buildUserSearchText({
    name: user.name,
    bio: user.bio,
    city: user.city,
    country: user.country,
    profession: user.profession,
    interests: user.interests,
    roles: user.roles,
  });
}

/**
 * Valide une latitude.
 */
function validateLatitude(latitude: number): void {
  if (!Number.isFinite(latitude)) {
    throw new ConvexError({
      code: "INVALID_LATITUDE",
      message: "La latitude doit être un nombre fini.",
    });
  }

  if (latitude < MIN_LATITUDE || latitude > MAX_LATITUDE) {
    throw new ConvexError({
      code: "INVALID_LATITUDE",
      message: "La latitude doit être comprise entre -90 et 90.",
    });
  }
}

/**
 * Valide une longitude.
 */
function validateLongitude(longitude: number): void {
  if (!Number.isFinite(longitude)) {
    throw new ConvexError({
      code: "INVALID_LONGITUDE",
      message: "La longitude doit être un nombre fini.",
    });
  }

  if (longitude < MIN_LONGITUDE || longitude > MAX_LONGITUDE) {
    throw new ConvexError({
      code: "INVALID_LONGITUDE",
      message: "La longitude doit être comprise entre -180 et 180.",
    });
  }
}

/**
 * Valide une paire de coordonnées.
 *
 * Une position géographique exploitable doit toujours contenir
 * latitude ET longitude.
 */
function validateCoordinates(latitude: number, longitude: number): void {
  validateLatitude(latitude);
  validateLongitude(longitude);
}

/**
 * Résout l'utilisateur authentifié.
 *
 * Source canonique :
 *   tokenIdentifier de l'identité Convex.
 *
 * Fallback legacy :
 *   email uniquement pour permettre la migration d'anciens comptes.
 *
 * L'email n'est jamais utilisé comme mécanisme permanent d'autorisation.
 */
async function resolveCurrentUser(
  ctx: MutationCtx,
  providedEmail?: string,
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  const byToken = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (byToken) {
    return byToken;
  }

  const identityEmail = identity.email?.trim().toLowerCase();

  if (!identityEmail || !providedEmail) {
    return null;
  }

  const normalizedProvidedEmail = providedEmail.trim().toLowerCase();

  if (identityEmail !== normalizedProvidedEmail) {
    return null;
  }

  const byEmail = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", providedEmail))
    .unique();

  if (!byEmail) {
    return null;
  }

  await ctx.db.patch(byEmail._id, {
    tokenIdentifier: identity.tokenIdentifier,
  });

  return await ctx.db.get(byEmail._id);
}

// ──────────────────────────────────────────────────────────────────────────────
// QUERIES — CURRENT USER
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Retourne l'utilisateur actuellement authentifié.
 *
 * Cette query est privée : elle ne doit être utilisée que pour
 * l'espace personnel de l'utilisateur.
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

/**
 * Retourne uniquement la localisation du compte courant.
 *
 * Cette API est privée et ne publie jamais les coordonnées
 * d'un autre utilisateur.
 */
export const getMyLocation = query({
  args: {},

  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return null;
    }

    return {
      city: user.location?.city ?? user.city,
      country: user.location?.country ?? user.country,
      province: user.location?.province,
      area: user.location?.area,
      latitude: user.location?.latitude,
      longitude: user.location?.longitude,
    };
  },
});

/**
 * Alias historique conservé temporairement pour compatibilité.
 *
 * Il sera supprimé après migration des consommateurs.
 */
export const getMyProfile = getCurrentUser;

// ──────────────────────────────────────────────────────────────────────────────
// MESSAGING — BOUNDED USER LIST
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Retourne une liste bornée d'utilisateurs pour le sélecteur
 * de destinataires Messages.
 *
 * Cette API n'est pas l'API de recherche Messages.
 * Elle est volontairement limitée afin d'éviter un collect()
 * illimité sur toute la table users.
 */
export const listForMessaging = query({
  args: {
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
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

    const requestedLimit = args.limit ?? 50;
    const limit = Math.max(1, Math.min(Math.floor(requestedLimit), 100));

    const users = await ctx.db
      .query("users")
      .order("desc")
      .take(limit + 1);

    return users
      .filter((user) => user._id !== currentUser._id)
      .filter((user) => !user.isBanned)
      .slice(0, limit)
      .map((user) => ({
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
      }));
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// STORAGE — AVATAR
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Génère une URL d'upload Convex Storage pour l'avatar.
 *
 * Authentification obligatoire.
 */
export const generateUserAvatarUploadUrl = mutation({
  args: {},

  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Authentification requise",
      });
    }

    return await ctx.storage.generateUploadUrl();
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// STORAGE — COVER
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Génère une URL d'upload Convex Storage pour la couverture du profil.
 *
 * Authentification obligatoire.
 */
export const generateUserCoverUploadUrl = mutation({
  args: {},

  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Authentification requise",
      });
    }

    return await ctx.storage.generateUploadUrl();
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// CREATE / UPDATE USER — AUTH SYNC
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Synchronise le compte Firebase/Convex.
 *
 * Règles de sécurité :
 * - identity.tokenIdentifier est toujours fourni par Convex ;
 * - uid doit correspondre à identity.subject ;
 * - permissions client ignorées ;
 * - roles existants conservés ;
 * - nouveau compte = rôle public de base "particulier" ;
 * - slug généré côté serveur ;
 * - aucune donnée privilégiée n'est contrôlée par le client.
 */
export const createOrUpdateUser = mutation({
  args: {
    uid: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    name: v.string(),
    avatar: v.optional(v.string()),

    // Conservés dans le contrat pour compatibilité avec les consommateurs
    // existants, mais non utilisés pour accorder des privilèges.
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
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Authentification requise",
      });
    }

    if (identity.subject !== args.uid) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "L'identité utilisateur ne correspond pas au compte.",
      });
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

    if (user) {
      const nextName = args.name.trim() || user.name;

      const nextCity = args.city ?? user.city;
      const nextCountry = args.country ?? user.country;
      const nextProfession = args.profession ?? user.profession;
      const nextInterests = args.interests ?? user.interests;

      const searchText = buildSearchTextForUser({
        name: nextName,
        bio: user.bio,
        city: nextCity,
        country: nextCountry,
        profession: nextProfession,
        interests: nextInterests,
        roles: user.roles,
      });

      await ctx.db.patch(user._id, {
        uid: args.uid,
        tokenIdentifier,
        email: args.email ?? user.email,
        phone: args.phone ?? user.phone,
        name: nextName,
        avatar: args.avatar ?? user.avatar,
        emailVerified: args.emailVerified,
        city: nextCity,
        country: nextCountry,
        language: args.language ?? user.language,
        profession: nextProfession,
        interests: nextInterests,
        searchText,
        slug: user.slug ?? buildStableSlug(nextName, args.uid),
      });

      return user._id;
    }

    const roles = ["particulier"];
    const permissions: string[] = [];

    const name = args.name.trim() || "Utilisateur";

    const searchText = buildSearchTextForUser({
      name,
      bio: undefined,
      city: args.city,
      country: args.country,
      profession: args.profession,
      interests: args.interests,
      roles,
    });

    return await ctx.db.insert("users", {
      uid: args.uid,
      tokenIdentifier,
      email: args.email,
      phone: args.phone,
      name,
      avatar: args.avatar,
      roles,
      permissions,
      emailVerified: args.emailVerified,
      onboardingCompleted: false,
      reputationScore: 0,
      city: args.city,
      country: args.country,
      language: args.language,
      profession: args.profession,
      interests: args.interests,
      slug: buildStableSlug(name, args.uid),
      searchText,
    });
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// UPDATE PROFILE
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Met à jour les données éditables du profil.
 *
 * IMPORTANT :
 * - aucun email dans ce contrat ;
 * - l'identité est déterminée automatiquement par le token ;
 * - les Storage IDs sont fortement typés ;
 * - coverImage est stocké comme Storage ID ;
 * - latitude/longitude sont validées côté serveur ;
 * - les rôles et permissions ne peuvent pas être modifiés ici.
 */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),

    avatar: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),

    coverImage: v.optional(v.id("_storage")),

    city: v.optional(v.string()),
    country: v.optional(v.string()),
    province: v.optional(v.string()),
    area: v.optional(v.string()),

    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),

    language: v.optional(v.string()),
    profession: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
  },

  handler: async (ctx, args) => {
    const user = await resolveCurrentUser(ctx);

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Utilisateur introuvable",
      });
    }

    const nextName =
      args.name !== undefined ? args.name.trim() || user.name : user.name;

    const nextBio = args.bio ?? user.bio;
    const nextCity = args.city ?? user.city;
    const nextCountry = args.country ?? user.country;
    const nextProfession = args.profession ?? user.profession;
    const nextInterests = args.interests ?? user.interests;

    // ────────────────────────────────────────────────────────────────────────
    // COORDINATES
    // ────────────────────────────────────────────────────────────────────────

    const currentLatitude = user.location?.latitude;
    const currentLongitude = user.location?.longitude;

    const nextLatitude = args.latitude ?? currentLatitude;
    const nextLongitude = args.longitude ?? currentLongitude;

    const latitudeProvided = args.latitude !== undefined;
    const longitudeProvided = args.longitude !== undefined;

    if (latitudeProvided !== longitudeProvided) {
      throw new ConvexError({
        code: "INCOMPLETE_COORDINATES",
        message: "La latitude et la longitude doivent être fournies ensemble.",
      });
    }

    if (latitudeProvided && longitudeProvided) {
      validateCoordinates(args.latitude as number, args.longitude as number);
    }

    // ────────────────────────────────────────────────────────────────────────
    // AVATAR
    // ────────────────────────────────────────────────────────────────────────

    let nextAvatar = user.avatar;

    if (args.avatarStorageId) {
      const publicUrl = await ctx.storage.getUrl(args.avatarStorageId);

      if (!publicUrl) {
        throw new ConvexError({
          code: "INVALID_STORAGE_FILE",
          message: "Le fichier avatar est introuvable.",
        });
      }

      nextAvatar = publicUrl;
    } else if (args.avatar !== undefined) {
      nextAvatar = args.avatar;
    }

    // ────────────────────────────────────────────────────────────────────────
    // SEARCH INDEX
    // ────────────────────────────────────────────────────────────────────────

    const searchText = buildSearchTextForUser({
      name: nextName,
      bio: nextBio,
      city: nextCity,
      country: nextCountry,
      profession: nextProfession,
      interests: nextInterests,
      roles: user.roles,
    });

    // ────────────────────────────────────────────────────────────────────────
    // LOCATION
    // ────────────────────────────────────────────────────────────────────────

    const nextLocation = {
      ...(user.location ?? {}),
      ...(args.city !== undefined ? { city: args.city } : {}),
      ...(args.country !== undefined ? { country: args.country } : {}),
      ...(args.province !== undefined ? { province: args.province } : {}),
      ...(args.area !== undefined ? { area: args.area } : {}),
      ...(latitudeProvided && longitudeProvided
        ? {
            latitude: nextLatitude,
            longitude: nextLongitude,
          }
        : {}),
    };

    await ctx.db.patch(user._id, {
      name: nextName,
      bio: nextBio,
      avatar: nextAvatar,

      ...(args.coverImage !== undefined ? { coverImage: args.coverImage } : {}),

      ...(args.city !== undefined ? { city: args.city } : {}),

      ...(args.country !== undefined ? { country: args.country } : {}),

      ...(args.language !== undefined ? { language: args.language } : {}),

      ...(args.profession !== undefined ? { profession: args.profession } : {}),

      ...(args.interests !== undefined ? { interests: args.interests } : {}),

      location: nextLocation,

      searchText,
    });

    return user._id;
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// COORDINATES — DEDICATED API
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Met à jour exclusivement les coordonnées géographiques
 * de l'utilisateur authentifié.
 *
 * Cette API constitue le contrat canonique pour les écrans
 * qui ne souhaitent modifier aucune autre donnée du profil.
 */
export const updateCoordinates = mutation({
  args: {
    latitude: v.number(),
    longitude: v.number(),
  },

  handler: async (ctx, args) => {
    const user = await resolveCurrentUser(ctx);

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Utilisateur introuvable",
      });
    }

    validateCoordinates(args.latitude, args.longitude);

    const currentLocation = user.location ?? {};

    await ctx.db.patch(user._id, {
      location: {
        ...currentLocation,
        latitude: args.latitude,
        longitude: args.longitude,
      },
    });

    return {
      userId: user._id,
      location: {
        city: currentLocation.city,
        country: currentLocation.country,
        province: currentLocation.province,
        area: currentLocation.area,
        latitude: args.latitude,
        longitude: args.longitude,
      },
    };
  },
});

/**
 * Supprime exclusivement les coordonnées géographiques
 * de l'utilisateur authentifié.
 *
 * Les informations administratives de localisation
 * (ville, pays, province, zone) sont conservées.
 */
export const removeCoordinates = mutation({
  args: {},

  handler: async (ctx) => {
    const user = await resolveCurrentUser(ctx);

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Utilisateur introuvable",
      });
    }

    const currentLocation = user.location;

    if (!currentLocation) {
      return user._id;
    }

    const {
      latitude: _latitude,
      longitude: _longitude,
      ...locationWithoutCoordinates
    } = currentLocation;

    await ctx.db.patch(user._id, {
      location:
        Object.keys(locationWithoutCoordinates).length > 0
          ? locationWithoutCoordinates
          : undefined,
    });

    return user._id;
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// AVATAR / COVER DIRECT UPDATES
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Définit directement un avatar depuis un Storage ID.
 *
 * Utilisable après un upload Convex Storage.
 */
export const updateAvatar = mutation({
  args: {
    storageId: v.id("_storage"),
  },

  handler: async (ctx, args) => {
    const user = await resolveCurrentUser(ctx);

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Utilisateur introuvable",
      });
    }

    const publicUrl = await ctx.storage.getUrl(args.storageId);

    if (!publicUrl) {
      throw new ConvexError({
        code: "INVALID_STORAGE_FILE",
        message: "Le fichier avatar est introuvable.",
      });
    }

    await ctx.db.patch(user._id, {
      avatar: publicUrl,
    });

    return {
      userId: user._id,
      avatar: publicUrl,
    };
  },
});

/**
 * Définit directement la couverture depuis un Storage ID.
 */
export const updateCover = mutation({
  args: {
    storageId: v.id("_storage"),
  },

  handler: async (ctx, args) => {
    const user = await resolveCurrentUser(ctx);

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Utilisateur introuvable",
      });
    }

    const publicUrl = await ctx.storage.getUrl(args.storageId);

    if (!publicUrl) {
      throw new ConvexError({
        code: "INVALID_STORAGE_FILE",
        message: "Le fichier de couverture est introuvable.",
      });
    }

    await ctx.db.patch(user._id, {
      coverImage: args.storageId,
    });

    return {
      userId: user._id,
      coverUrl: publicUrl,
    };
  },
});

/**
 * Supprime l'avatar du profil.
 */
export const removeAvatar = mutation({
  args: {},

  handler: async (ctx) => {
    const user = await resolveCurrentUser(ctx);

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Utilisateur introuvable",
      });
    }

    await ctx.db.patch(user._id, {
      avatar: undefined,
    });

    return user._id;
  },
});

/**
 * Supprime la couverture du profil.
 */
export const removeCover = mutation({
  args: {},

  handler: async (ctx) => {
    const user = await resolveCurrentUser(ctx);

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Utilisateur introuvable",
      });
    }

    await ctx.db.patch(user._id, {
      coverImage: undefined,
    });

    return user._id;
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// COMPLETE ONBOARDING
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Termine l'onboarding du compte.
 *
 * L'email n'est pas modifiable ici.
 *
 * Les rôles reçus ici correspondent aux rôles fonctionnels sélectionnés
 * pendant l'onboarding. Les permissions système restent hors de cette API.
 */
export const completeOnboarding = mutation({
  args: {
    city: v.string(),
    country: v.string(),
    roles: v.array(v.string()),
    interests: v.array(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await resolveCurrentUser(ctx);

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Utilisateur introuvable",
      });
    }

    const searchText = buildSearchTextForUser({
      name: user.name,
      bio: user.bio,
      city: args.city,
      country: args.country,
      profession: user.profession,
      interests: args.interests,
      roles: args.roles,
    });

    await ctx.db.patch(user._id, {
      city: args.city,
      country: args.country,
      roles: args.roles,
      interests: args.interests,
      onboardingCompleted: true,
      searchText,
      location: {
        ...(user.location ?? {}),
        city: args.city,
        country: args.country,
      },
    });

    return user._id;
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// UPDATE CURRENT USER — LEGACY AUTH SYNC
// ──────────────────────────────────────────────────────────────────────────────

/**
 * API legacy conservée uniquement pour les consommateurs existants.
 *
 * Elle ne permet pas d'éditer le profil.
 * Elle synchronise uniquement l'identité authentifiée.
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

    const byToken = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (byToken) {
      const searchText = buildSearchTextForUser(byToken);

      await ctx.db.patch(byToken._id, {
        uid: identity.subject,
        searchText,
      });

      return byToken._id;
    }

    const identityEmail = identity.email?.trim().toLowerCase();

    if (identityEmail && args.email) {
      const providedEmail = args.email.trim().toLowerCase();

      if (identityEmail === providedEmail) {
        const byEmail = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", args.email))
          .unique();

        if (byEmail) {
          const searchText = buildSearchTextForUser(byEmail);

          await ctx.db.patch(byEmail._id, {
            tokenIdentifier: identity.tokenIdentifier,
            uid: identity.subject,
            searchText,
          });

          return byEmail._id;
        }
      }
    }

    const roles = ["particulier"];
    const name = identity.name?.trim() || "Utilisateur";

    const searchText = buildSearchTextForUser({
      name,
      bio: undefined,
      city: undefined,
      country: undefined,
      profession: undefined,
      interests: undefined,
      roles,
    });

    return await ctx.db.insert("users", {
      email: identity.email ?? args.email,
      name,
      avatar: identity.pictureUrl,
      uid: identity.subject,
      tokenIdentifier: identity.tokenIdentifier,
      roles,
      permissions: [],
      emailVerified: false,
      onboardingCompleted: false,
      reputationScore: 0,
      slug: buildStableSlug(name, identity.subject),
      searchText,
    });
  },
});
