// convex/globalContext.ts

import { ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";

/**
 * ============================================================================
 * GLOBAL CONTEXT ENGINE
 * ============================================================================
 *
 * Source unique du contexte global utilisateur.
 *
 * Utilisé par :
 * - Home
 * - Smart Search
 * - Feed personnalisé
 * - IA
 * - recommandations
 * - modules géolocalisés
 *
 * IMPORTANT :
 * Ce moteur ne fabrique aucune information métier.
 *
 * Il expose uniquement les données réellement présentes dans `users`
 * et `homePreferences`.
 *
 * Les informations non présentes dans le schéma ne sont PAS inventées :
 * - timezone
 * - currency
 * - latitude
 * - longitude
 * ============================================================================
 */

/* ============================================================================
 * TYPES
 * ========================================================================== */

type UserDoc = Doc<"users">;

type HomePreferences = {
  favoriteModules: string[];
  hiddenSections: string[];
  customSectionOrder: string[];
  notificationPreferences: {
    newRecommendations: boolean;
    nearbyAlerts: boolean;
    opportunities: boolean;
  };
};

export interface GlobalContext {
  userId: string;

  identity: {
    name: string;
    email?: string;
    avatar?: string;
  };

  location: {
    city?: string;
    country?: string;
  };

  language?: string;

  profile: {
    profession?: string;
    interests: string[];
    reputationScore: number;
    roles: string[];
  };

  home: HomePreferences;

  onboardingCompleted: boolean;

  generatedAt: number;
}

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const MAX_CITY_LENGTH = 120;
const MAX_COUNTRY_LENGTH = 120;
const MAX_LANGUAGE_LENGTH = 20;

const MAX_HOME_MODULES = 50;
const MAX_HIDDEN_SECTIONS = 100;
const MAX_SECTION_ORDER = 100;

const DEFAULT_NOTIFICATION_PREFERENCES: HomePreferences["notificationPreferences"] =
  {
    newRecommendations: true,
    nearbyAlerts: true,
    opportunities: true,
  };

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function normalizeOptionalString(
  value: unknown,
  maxLength: number,
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();

  if (!normalized) {
    return undefined;
  }

  return normalized.slice(0, maxLength);
}

function normalizeStringArray(
  value: unknown,
  maxItems: number,
  maxItemLength = 100,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.slice(0, maxItemLength))
    .slice(0, maxItems);
}

function normalizeNotificationPreferences(
  value: unknown,
): HomePreferences["notificationPreferences"] {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  const preferences = value as Partial<
    HomePreferences["notificationPreferences"]
  >;

  return {
    newRecommendations:
      typeof preferences.newRecommendations === "boolean"
        ? preferences.newRecommendations
        : DEFAULT_NOTIFICATION_PREFERENCES.newRecommendations,

    nearbyAlerts:
      typeof preferences.nearbyAlerts === "boolean"
        ? preferences.nearbyAlerts
        : DEFAULT_NOTIFICATION_PREFERENCES.nearbyAlerts,

    opportunities:
      typeof preferences.opportunities === "boolean"
        ? preferences.opportunities
        : DEFAULT_NOTIFICATION_PREFERENCES.opportunities,
  };
}

function normalizeHomePreferences(user: UserDoc): HomePreferences {
  const raw = user.homePreferences;

  if (!raw || typeof raw !== "object") {
    return {
      favoriteModules: [],
      hiddenSections: [],
      customSectionOrder: [],
      notificationPreferences: {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
      },
    };
  }

  return {
    favoriteModules: normalizeStringArray(
      raw.favoriteModules,
      MAX_HOME_MODULES,
    ),

    hiddenSections: normalizeStringArray(
      raw.hiddenSections,
      MAX_HIDDEN_SECTIONS,
    ),

    customSectionOrder: normalizeStringArray(
      raw.customSectionOrder,
      MAX_SECTION_ORDER,
    ),

    notificationPreferences: normalizeNotificationPreferences(
      raw.notificationPreferences,
    ),
  };
}

/* ============================================================================
 * CURRENT USER
 * ========================================================================== */

/**
 * Résout l'utilisateur authentifié.
 *
 * Ordre :
 * 1. tokenIdentifier
 * 2. email
 *
 * Le fallback email est conservé pour la compatibilité avec
 * l'intégration Firebase + Convex existante.
 */
async function getCurrentUser(
  ctx: QueryCtx | MutationCtx,
): Promise<UserDoc | null> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  if (identity.tokenIdentifier) {
    const userByToken = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (userByToken) {
      return userByToken;
    }
  }

  if (identity.email) {
    const userByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();

    if (userByEmail) {
      return userByEmail;
    }
  }

  return null;
}

function requireCurrentUser(user: UserDoc | null): UserDoc {
  if (!user) {
    throw new ConvexError("Utilisateur non authentifié.");
  }

  return user;
}

/* ============================================================================
 * BUILD GLOBAL CONTEXT
 * ========================================================================== */

function buildGlobalContext(user: UserDoc): GlobalContext {
  const homePreferences = normalizeHomePreferences(user);

  const name =
    normalizeOptionalString(user.name, 200) ??
    normalizeOptionalString(user.email, 320) ??
    "Utilisateur";

  const email = normalizeOptionalString(user.email, 320);
  const avatar = normalizeOptionalString(user.avatar, 2048);

  const city = normalizeOptionalString(user.city, MAX_CITY_LENGTH);
  const country = normalizeOptionalString(user.country, MAX_COUNTRY_LENGTH);

  const language = normalizeOptionalString(user.language, MAX_LANGUAGE_LENGTH);

  const profession = normalizeOptionalString(user.profession, 160);

  const interests = normalizeStringArray(user.interests, 100, 100);

  const roles = normalizeStringArray(user.roles, 50, 100);

  const reputationScore =
    typeof user.reputationScore === "number" &&
    Number.isFinite(user.reputationScore)
      ? user.reputationScore
      : 0;

  return {
    userId: String(user._id),

    identity: {
      name,
      ...(email !== undefined ? { email } : {}),
      ...(avatar !== undefined ? { avatar } : {}),
    },

    location: {
      ...(city !== undefined ? { city } : {}),
      ...(country !== undefined ? { country } : {}),
    },

    ...(language !== undefined ? { language } : {}),

    profile: {
      ...(profession !== undefined ? { profession } : {}),
      interests,
      reputationScore,
      roles,
    },

    home: homePreferences,

    onboardingCompleted: user.onboardingCompleted === true,

    generatedAt: Date.now(),
  };
}

/* ============================================================================
 * GET MY GLOBAL CONTEXT
 * ========================================================================== */

export const getMyContext = query({
  args: {},

  handler: async (ctx): Promise<GlobalContext | null> => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      return null;
    }

    return buildGlobalContext(user);
  },
});

/* ============================================================================
 * GET MY LOCATION
 * ========================================================================== */

/**
 * Version légère du contexte.
 *
 * IMPORTANT :
 * Aucune latitude/longitude n'est inventée.
 */
export const getMyLocation = query({
  args: {},

  handler: async (
    ctx,
  ): Promise<{
    city: string | null;
    country: string | null;
  } | null> => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      return null;
    }

    return {
      city: normalizeOptionalString(user.city, MAX_CITY_LENGTH) ?? null,

      country:
        normalizeOptionalString(user.country, MAX_COUNTRY_LENGTH) ?? null,
    };
  },
});

/* ============================================================================
 * GET MY LANGUAGE
 * ========================================================================== */

export const getMyLanguage = query({
  args: {},

  handler: async (ctx): Promise<string | null> => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      return null;
    }

    return normalizeOptionalString(user.language, MAX_LANGUAGE_LENGTH) ?? null;
  },
});

/* ============================================================================
 * UPDATE LOCATION
 * ========================================================================== */

export const updateMyLocation = mutation({
  args: {
    city: v.optional(v.string()),
    country: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = requireCurrentUser(await getCurrentUser(ctx));

    const city =
      args.city !== undefined
        ? normalizeOptionalString(args.city, MAX_CITY_LENGTH)
        : undefined;

    const country =
      args.country !== undefined
        ? normalizeOptionalString(args.country, MAX_COUNTRY_LENGTH)
        : undefined;

    const patch: {
      city?: string;
      country?: string;
    } = {};

    if (args.city !== undefined) {
      if (!city) {
        throw new ConvexError("La ville fournie est invalide.");
      }

      patch.city = city;
    }

    if (args.country !== undefined) {
      if (!country) {
        throw new ConvexError("Le pays fourni est invalide.");
      }

      patch.country = country;
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(user._id, patch);
    }

    return {
      success: true,
      city: patch.city ?? user.city ?? null,
      country: patch.country ?? user.country ?? null,
    };
  },
});

/* ============================================================================
 * UPDATE LANGUAGE
 * ========================================================================== */

export const updateMyLanguage = mutation({
  args: {
    language: v.string(),
  },

  handler: async (ctx, args) => {
    const user = requireCurrentUser(await getCurrentUser(ctx));

    const language = normalizeOptionalString(
      args.language,
      MAX_LANGUAGE_LENGTH,
    );

    if (!language) {
      throw new ConvexError("La langue fournie est invalide.");
    }

    await ctx.db.patch(user._id, {
      language,
    });

    return {
      success: true,
      language,
    };
  },
});

/* ============================================================================
 * UPDATE GLOBAL LOCATION + LANGUAGE
 * ========================================================================== */

export const updateMyContext = mutation({
  args: {
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    language: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = requireCurrentUser(await getCurrentUser(ctx));

    const patch: {
      city?: string;
      country?: string;
      language?: string;
    } = {};

    if (args.city !== undefined) {
      const city = normalizeOptionalString(args.city, MAX_CITY_LENGTH);

      if (!city) {
        throw new ConvexError("La ville fournie est invalide.");
      }

      patch.city = city;
    }

    if (args.country !== undefined) {
      const country = normalizeOptionalString(args.country, MAX_COUNTRY_LENGTH);

      if (!country) {
        throw new ConvexError("Le pays fourni est invalide.");
      }

      patch.country = country;
    }

    if (args.language !== undefined) {
      const language = normalizeOptionalString(
        args.language,
        MAX_LANGUAGE_LENGTH,
      );

      if (!language) {
        throw new ConvexError("La langue fournie est invalide.");
      }

      patch.language = language;
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(user._id, patch);
    }

    const updatedUser: UserDoc = {
      ...user,
      ...patch,
    };

    return {
      success: true,
      context: buildGlobalContext(updatedUser),
    };
  },
});
