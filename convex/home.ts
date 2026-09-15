// convex/home.ts

import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { getModule, getHomeModules } from "./moduleRegistry";
import { buildHomeData } from "./homeBuilder";
import { buildHomeIntelligence } from "./homeIntelligence";

// ============================================================
// TYPES
// ============================================================

const homePreferencesValidator = v.object({
  favoriteModules: v.array(v.string()),

  hiddenSections: v.array(v.string()),

  customSectionOrder: v.array(v.string()),

  notificationPreferences: v.object({
    newRecommendations: v.boolean(),
    nearbyAlerts: v.boolean(),
    opportunities: v.boolean(),
  }),
});

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

type HomeModule = {
  id: string;
  priority: number;
};

type HomeUser = {
  id: string;
  name?: string;
  email?: string;
};

type HomeFeed = {
  page: unknown[];
  isDone: boolean;
  continueCursor: string;
  preferredTypes: string[];
  favoriteModules: string[];
};

type HomeData = {
  user: HomeUser;

  preferences: HomePreferences;

  feed: HomeFeed;

  /**
   * Identifiants des modules uniquement.
   *
   * Le frontend enrichit ces IDs avec son propre
   * moduleRegistry.ts.
   */
  moduleIds: string[];

  /**
   * Ordre calculé par le backend.
   */
  moduleOrder: HomeModule[];

  context: {
    generatedAt: number;
  };
};

// ============================================================
// DEFAULT PREFERENCES
// ============================================================

function getDefaultHomePreferences(): HomePreferences {
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

// ============================================================
// USER
// ============================================================

/**
 * Récupère l'utilisateur actuellement connecté.
 *
 * Firebase Auth
 *      ↓
 * Convex Identity
 *      ↓
 * email
 *      ↓
 * users.by_email
 */
async function getCurrentUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity?.email) {
    return null;
  }

  return await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", identity.email))
    .first();
}

// ============================================================
// MODULE VALIDATION
// ============================================================

/**
 * Vérifie qu'un module :
 *
 * 1. existe dans le registry backend ;
 * 2. est activé ;
 * 3. est disponible dans Home.
 */
function isHomeModule(moduleId: string): boolean {
  const module = getModule(moduleId);

  return module !== null && module.enabled && module.home.enabled;
}

// ============================================================
// HOME MODULE ORDER
// ============================================================

/**
 * Construit l'ordre final des modules Home.
 *
 * Priorités :
 *
 * 1. modules personnalisés par l'utilisateur ;
 * 2. modules restants dans l'ordre du registry ;
 * 3. sections masquées exclues ;
 * 4. modules inconnus ignorés ;
 * 5. doublons supprimés.
 */
function buildHomeModuleOrder(preferences: HomePreferences): HomeModule[] {
  const availableModules = getHomeModules();

  const availableIds = new Set(availableModules.map((module) => module.id));

  const hidden = new Set(preferences.hiddenSections);

  const seen = new Set<string>();

  const ordered: HomeModule[] = [];

  // ==========================================================
  // 1. ORDRE PERSONNALISÉ
  // ==========================================================

  for (const moduleId of preferences.customSectionOrder) {
    if (
      !availableIds.has(moduleId) ||
      hidden.has(moduleId) ||
      seen.has(moduleId)
    ) {
      continue;
    }

    const module = getModule(moduleId);

    if (!module || !module.enabled || !module.home.enabled) {
      continue;
    }

    ordered.push({
      id: module.id,
      priority: module.home.priority,
    });

    seen.add(module.id);
  }

  // ==========================================================
  // 2. MODULES RESTANTS
  // ==========================================================

  for (const module of availableModules) {
    if (hidden.has(module.id) || seen.has(module.id)) {
      continue;
    }

    ordered.push({
      id: module.id,
      priority: module.home.priority,
    });

    seen.add(module.id);
  }

  return ordered;
}

// ============================================================
// QUERY — GET HOME DATA
// ============================================================

/**
 * Récupère les données principales nécessaires
 * au Shell Home.
 *
 * Cette query est conservée pour compatibilité avec
 * les autres usages du projet.
 *
 * La construction réelle est désormais centralisée
 * dans homeBuilder.ts.
 */
export const getHomeData = query({
  args: {},

  handler: async (ctx): Promise<HomeData | null> => {
    return await buildHomeData(ctx);
  },
});

// ============================================================
// QUERY — GET HOME SCREEN DATA
// ============================================================

/**
 * Agrège les données principales du Home et son intelligence
 * dans une seule requête Convex.
 *
 * Architecture :
 *
 * getHomeScreenData
 *      ↓
 * buildHomeData()
 *      ↓
 * buildHomeIntelligence(ctx, data)
 *
 * L'intelligence réutilise les données Home déjà construites
 * et ne relance donc pas getHomeData via ctx.runQuery().
 *
 * Cela évite une double souscription côté frontend et réduit
 * le travail/payload du chargement initial du Home.
 */
export const getHomeScreenData = query({
  args: {},

  handler: async (
    ctx,
  ): Promise<{
    data: HomeData;
    intelligence: any;
  } | null> => {
    const data = await buildHomeData(ctx);

    if (!data) {
      return null;
    }

    const intelligence = await buildHomeIntelligence(ctx, data);

    return {
      data,
      intelligence,
    };
  },
});

// ============================================================
// QUERY — GET HOME PREFERENCES
// ============================================================

export const getHomePreferences = query({
  args: {},

  handler: async (ctx): Promise<HomePreferences | null> => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      return null;
    }

    return user.homePreferences ?? getDefaultHomePreferences();
  },
});

// ============================================================
// MUTATION — UPDATE HOME PREFERENCES
// ============================================================

export const updateHomePreferences = mutation({
  args: {
    preferences: homePreferencesValidator,
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new Error("Not authenticated");
    }

    const preferences = sanitizeHomePreferences(args.preferences);

    await ctx.db.patch(user._id, {
      homePreferences: preferences,
    });

    return {
      success: true,
      preferences,
    };
  },
});

// ============================================================
// MUTATION — ADD FAVORITE MODULE
// ============================================================

export const addFavoriteModule = mutation({
  args: {
    moduleId: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new Error("Not authenticated");
    }

    if (!isHomeModule(args.moduleId)) {
      throw new Error(`Unknown or unavailable Home module: ${args.moduleId}`);
    }

    const prefs = user.homePreferences ?? getDefaultHomePreferences();

    const favoriteModules = [...prefs.favoriteModules];

    if (!favoriteModules.includes(args.moduleId)) {
      favoriteModules.push(args.moduleId);
    }

    await ctx.db.patch(user._id, {
      homePreferences: {
        ...prefs,
        favoriteModules,
      },
    });

    return {
      success: true,
      favoriteModules,
    };
  },
});

// ============================================================
// MUTATION — REMOVE FAVORITE MODULE
// ============================================================

export const removeFavoriteModule = mutation({
  args: {
    moduleId: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new Error("Not authenticated");
    }

    const prefs = user.homePreferences ?? getDefaultHomePreferences();

    const favoriteModules = prefs.favoriteModules.filter(
      (id: string) => id !== args.moduleId,
    );

    await ctx.db.patch(user._id, {
      homePreferences: {
        ...prefs,
        favoriteModules,
      },
    });

    return {
      success: true,
      favoriteModules,
    };
  },
});

// ============================================================
// MUTATION — HIDE SECTION
// ============================================================

export const hideSection = mutation({
  args: {
    sectionId: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new Error("Not authenticated");
    }

    if (!isHomeModule(args.sectionId)) {
      throw new Error(`Unknown or unavailable Home module: ${args.sectionId}`);
    }

    const prefs = user.homePreferences ?? getDefaultHomePreferences();

    const hiddenSections = [...prefs.hiddenSections];

    if (!hiddenSections.includes(args.sectionId)) {
      hiddenSections.push(args.sectionId);
    }

    await ctx.db.patch(user._id, {
      homePreferences: {
        ...prefs,
        hiddenSections,
      },
    });

    return {
      success: true,
      hiddenSections,
    };
  },
});

// ============================================================
// MUTATION — UNHIDE SECTION
// ============================================================

export const unhideSection = mutation({
  args: {
    sectionId: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new Error("Not authenticated");
    }

    const prefs = user.homePreferences ?? getDefaultHomePreferences();

    const hiddenSections = prefs.hiddenSections.filter(
      (id: string) => id !== args.sectionId,
    );

    await ctx.db.patch(user._id, {
      homePreferences: {
        ...prefs,
        hiddenSections,
      },
    });

    return {
      success: true,
      hiddenSections,
    };
  },
});

// ============================================================
// MUTATION — REORDER SECTIONS
// ============================================================

export const reorderSections = mutation({
  args: {
    sectionOrder: v.array(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      throw new Error("Not authenticated");
    }

    // --------------------------------------------------------
    // Seuls les modules Home valides
    // sont conservés.
    // --------------------------------------------------------

    const cleanedOrder: string[] = [];

    const seen = new Set<string>();

    for (const moduleId of args.sectionOrder) {
      if (!isHomeModule(moduleId)) {
        continue;
      }

      if (seen.has(moduleId)) {
        continue;
      }

      seen.add(moduleId);

      cleanedOrder.push(moduleId);
    }

    const prefs = user.homePreferences ?? getDefaultHomePreferences();

    await ctx.db.patch(user._id, {
      homePreferences: {
        ...prefs,
        customSectionOrder: cleanedOrder,
      },
    });

    return {
      success: true,
      customSectionOrder: cleanedOrder,
    };
  },
});

// ============================================================
// ACTION — HOME DATA WITH CONTEXT
// ============================================================

export const getHomeDataWithContext = action({
  args: {},

  handler: async (ctx): Promise<HomeData | null> => {
    return await ctx.runQuery(api.home.getHomeData, {});
  },
});

// ============================================================
// MUTATION — TRACK HOME INTERACTION
// ============================================================

export const trackHomeInteraction = mutation({
  args: {
    itemId: v.string(),

    action: v.string(),

    sectionId: v.optional(v.string()),

    metadata: v.optional(
      v.object({
        position: v.optional(v.number()),

        source: v.optional(v.string()),
      }),
    ),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // --------------------------------------------------------
    // Utilisateur anonyme
    // --------------------------------------------------------

    if (!user) {
      return {
        success: false,
        reason: "unauthenticated",
      };
    }

    // --------------------------------------------------------
    // Mapping des interactions
    // --------------------------------------------------------

    const actionMap: Record<
      string,
      "click" | "like" | "save" | "share" | "comment" | "dismiss" | "refresh"
    > = {
      click: "click",
      like: "like",
      save: "save",
      share: "share",
      comment: "comment",
      dismiss: "dismiss",
      refresh: "refresh",
    };

    const eventType = actionMap[args.action];

    if (!eventType) {
      return {
        success: false,
        reason: "unsupported_action",
      };
    }

    // --------------------------------------------------------
    // Analytics centralisé
    // --------------------------------------------------------

    await ctx.runMutation(api.homeAnalytics.trackEvent, {
      event: {
        eventType,

        itemId: args.itemId,

        sectionId: args.sectionId,

        source: args.metadata?.source,

        position: args.metadata?.position,
      },
    });

    return {
      success: true,
    };
  },
});

// ============================================================
// HELPERS — SANITIZE PREFERENCES
// ============================================================

function sanitizeHomePreferences(
  preferences: HomePreferences,
): HomePreferences {
  const availableModules = getHomeModules();

  const availableIds = new Set(availableModules.map((module) => module.id));

  const favoriteModules = uniqueValidModules(
    preferences.favoriteModules,
    availableIds,
  );

  const hiddenSections = uniqueValidModules(
    preferences.hiddenSections,
    availableIds,
  );

  const customSectionOrder = uniqueValidModules(
    preferences.customSectionOrder,
    availableIds,
  );

  return {
    favoriteModules,

    hiddenSections,

    customSectionOrder,

    notificationPreferences: {
      newRecommendations:
        preferences.notificationPreferences.newRecommendations,

      nearbyAlerts: preferences.notificationPreferences.nearbyAlerts,

      opportunities: preferences.notificationPreferences.opportunities,
    },
  };
}

// ============================================================
// HELPERS — UNIQUE VALID MODULES
// ============================================================

function uniqueValidModules(
  values: string[],
  availableIds: Set<string>,
): string[] {
  const result: string[] = [];

  const seen = new Set<string>();

  for (const value of values) {
    if (!availableIds.has(value)) {
      continue;
    }

    if (seen.has(value)) {
      continue;
    }

    seen.add(value);

    result.push(value);
  }

  return result;
}
