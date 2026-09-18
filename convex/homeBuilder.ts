// convex/homeBuilder.ts

import { getModule, getHomeModules } from "./moduleRegistry";
import { buildPersonalizedFeed } from "./feed";

// ============================================================
// TYPES
// ============================================================

export type HomePreferences = {
  favoriteModules: string[];

  hiddenSections: string[];

  customSectionOrder: string[];

  notificationPreferences: {
    newRecommendations: boolean;
    nearbyAlerts: boolean;
    opportunities: boolean;
  };
};

export type HomeModule = {
  id: string;
  priority: number;
};

export type HomeUser = {
  id: string;
  name?: string;
  email?: string;
};

export type HomeFeed = {
  page: unknown[];
  isDone: boolean;
  continueCursor: string;
  preferredTypes: string[];
  favoriteModules: string[];
};

export type HomeData = {
  user: HomeUser;

  preferences: HomePreferences;

  feed: HomeFeed;

  /**
   * Identifiants des modules uniquement.
   *
   * Le frontend peut utiliser son propre registry
   * pour enrichir les métadonnées UI.
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

export function getDefaultHomePreferences(): HomePreferences {
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
 * tokenIdentifier (source canonique)
 *      ↓
 * users.by_token
 *
 * Fallback email :
 *   utilisé UNIQUEMENT si l'identité Convex ne porte pas
 *   de tokenIdentifier — cas historique, jamais attendu
 *   en production, mais on reste tolérant.
 */
export async function getCurrentHomeUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  // 1. Résolution canonique par token
  if (identity.tokenIdentifier) {
    const byToken = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (byToken) {
      return byToken;
    }
  }

  // 2. Fallback email vérifié — uniquement si présent dans l'identité
  const identityEmail = identity.email ?? null;

  if (identityEmail) {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", identityEmail))
      .unique();
  }

  return null;
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
export function buildHomeModuleOrder(
  preferences: HomePreferences,
): HomeModule[] {
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

    if (!module.enabled || !module.home.enabled) {
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
// HOME DATA BUILDER
// ============================================================

/**
 * Construit toutes les données principales nécessaires
 * au Shell Home.
 *
 * IMPORTANT :
 *
 * Cette fonction contient la construction commune de Home.
 *
 * Elle NE doit PAS être une query Convex.
 *
 * Elle est appelée directement par :
 *
 * - convex/home.ts
 *
 * Cela évite la chaîne :
 *
 * Home query
 *    ↓
 * ctx.runQuery(...)
 *    ↓
 * getHomeData
 *    ↓
 * buildPersonalizedFeed
 *
 * et permet de réutiliser directement la construction
 * commune dans le contexte Convex appelant.
 */
export async function buildHomeData(ctx: any): Promise<HomeData | null> {
  // ----------------------------------------------------------
  // 1. UTILISATEUR
  // ----------------------------------------------------------

  const user = await getCurrentHomeUser(ctx);

  if (!user) {
    return null;
  }

  // ----------------------------------------------------------
  // 2. PRÉFÉRENCES
  // ----------------------------------------------------------

  const homePreferences: HomePreferences =
    user.homePreferences ?? getDefaultHomePreferences();

  // ----------------------------------------------------------
  // 3. FEED PERSONNALISÉ
  // ----------------------------------------------------------
  //
  // IMPORTANT :
  //
  // On appelle directement le moteur partagé du feed.
  //
  // Il n'y a aucun ctx.runQuery() ici.
  //
  // La limite de 10 est volontaire :
  //
  // - Android doit rester léger ;
  // - le feed complet reste disponible via pagination ;
  // - le premier chargement Home doit rester raisonnable.
  //
  // `buildPersonalizedFeed()` applique lui-même
  // la limite finale demandée après fusion et déduplication.
  //

  const feedItems = await buildPersonalizedFeed(ctx, {
    paginationOpts: {
      numItems: 10,
      cursor: null,
    },
  });

  // ----------------------------------------------------------
  // 4. MODULES HOME
  // ----------------------------------------------------------

  const moduleOrder = buildHomeModuleOrder(homePreferences);

  const moduleIds = moduleOrder.map((module) => module.id);

  // ----------------------------------------------------------
  // 5. RÉSULTAT
  // ----------------------------------------------------------

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },

    preferences: homePreferences,

    feed: feedItems,

    moduleIds,

    moduleOrder,

    context: {
      generatedAt: Date.now(),
    },
  };
}
