// convex/globalContext.ts

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * ============================================================================
 * GLOBAL CONTEXT ENGINE
 * ============================================================================
 *
 * Source unique du contexte global de l'utilisateur.
 *
 * Utilisé notamment par :
 * - GlobalContextBar
 * - Home
 * - SmartSearch
 * - Feed personnalisé
 * - IA
 * - recommandations
 * - modules géolocalisés
 *
 * IMPORTANT :
 * Cette version utilise UNIQUEMENT les champs réellement présents
 * dans convex/schema.ts.
 *
 * Aucun champ fictif :
 * ❌ timezone
 * ❌ currency
 * ❌ latitude
 * ❌ longitude
 *
 * Ces informations pourront être ajoutées plus tard dans un modèle
 * de contexte dédié si nécessaire.
 * ============================================================================
 */

/* ============================================================================
 * TYPES
 * ========================================================================== */

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

  home: {
    favoriteModules: string[];
    hiddenSections: string[];
    customSectionOrder: string[];
    notificationPreferences: {
      newRecommendations: boolean;
      nearbyAlerts: boolean;
      opportunities: boolean;
    };
  };

  onboardingCompleted: boolean;

  generatedAt: number;
}

/* ============================================================================
 * DEFAULT HOME PREFERENCES
 * ========================================================================== */

function getDefaultHomePreferences() {
  return {
    favoriteModules: [],
    hiddenSections: [],
    customSectionOrder: [],

    notificationPreferences: {
      newRecommendations: true,
      nearbyAlerts: true,
      opportunities: true,
    },
  };
}

/* ============================================================================
 * CURRENT USER
 * ========================================================================== */

/**
 * Résout l'utilisateur connecté.
 *
 * Stratégie :
 * 1. tokenIdentifier Convex
 * 2. email Firebase/Convex en fallback
 *
 * Cela rend le moteur compatible avec ton intégration Firebase + Convex.
 */
async function getCurrentUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  /* ------------------------------------------------------------------------
   * 1. Token Convex
   * ---------------------------------------------------------------------- */

  if (identity.tokenIdentifier) {
    const userByToken = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (userByToken) {
      return userByToken;
    }
  }

  /* ------------------------------------------------------------------------
   * 2. Email fallback
   * ---------------------------------------------------------------------- */

  if (identity.email) {
    const userByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", identity.email))
      .first();

    if (userByEmail) {
      return userByEmail;
    }
  }

  return null;
}

/* ============================================================================
 * BUILD GLOBAL CONTEXT
 * ========================================================================== */

function buildGlobalContext(user: any): GlobalContext {
  const homePreferences = user.homePreferences ?? getDefaultHomePreferences();

  return {
    userId: String(user._id),

    identity: {
      name: user.name,
      email: user.email ?? undefined,
      avatar: user.avatar ?? undefined,
    },

    location: {
      city: user.city ?? undefined,
      country: user.country ?? undefined,
    },

    language: user.language ?? undefined,

    profile: {
      profession: user.profession ?? undefined,

      interests: Array.isArray(user.interests) ? user.interests : [],

      reputationScore:
        typeof user.reputationScore === "number" ? user.reputationScore : 0,

      roles: Array.isArray(user.roles) ? user.roles : [],
    },

    home: {
      favoriteModules: Array.isArray(homePreferences.favoriteModules)
        ? homePreferences.favoriteModules
        : [],

      hiddenSections: Array.isArray(homePreferences.hiddenSections)
        ? homePreferences.hiddenSections
        : [],

      customSectionOrder: Array.isArray(homePreferences.customSectionOrder)
        ? homePreferences.customSectionOrder
        : [],

      notificationPreferences: homePreferences.notificationPreferences,
    },

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
 * GET MY LOCATION CONTEXT
 * ========================================================================== */

/**
 * Version légère pour les composants qui ont uniquement besoin
 * du contexte géographique.
 */
export const getMyLocation = query({
  args: {},

  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      return null;
    }

    return {
      city: user.city ?? null,
      country: user.country ?? null,
    };
  },
});

/* ============================================================================
 * GET MY LANGUAGE
 * ========================================================================== */

export const getMyLanguage = query({
  args: {},

  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      return null;
    }

    return user.language ?? null;
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
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new Error("Utilisateur non authentifié");
    }

    const patch: {
      city?: string;
      country?: string;
    } = {};

    if (args.city !== undefined) {
      patch.city = args.city;
    }

    if (args.country !== undefined) {
      patch.country = args.country;
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(user._id, patch);
    }

    return {
      success: true,
      city: args.city ?? user.city ?? null,
      country: args.country ?? user.country ?? null,
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
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new Error("Utilisateur non authentifié");
    }

    await ctx.db.patch(user._id, {
      language: args.language,
    });

    return {
      success: true,
      language: args.language,
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
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new Error("Utilisateur non authentifié");
    }

    const patch: {
      city?: string;
      country?: string;
      language?: string;
    } = {};

    if (args.city !== undefined) {
      patch.city = args.city;
    }

    if (args.country !== undefined) {
      patch.country = args.country;
    }

    if (args.language !== undefined) {
      patch.language = args.language;
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(user._id, patch);
    }

    const updatedUser = {
      ...user,
      ...patch,
    };

    return {
      success: true,
      context: buildGlobalContext(updatedUser),
    };
  },
});
