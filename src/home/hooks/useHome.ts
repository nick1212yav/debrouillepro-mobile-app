import { useCallback, useMemo, useState } from "react";
import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";

import type { HomePreferences, HomeState } from "../types/home.types";
import type { HomeSection } from "../types/home-section.types";
import type { RecommendationItem } from "../types/home-recommendation.types";

import type { ModuleId } from "@/config/modules/module.types";
import { MODULE_REGISTRY } from "@/config/modules/moduleRegistry";

/**
 * ============================================================
 * DÉBROUILLEPRO — useHome
 * ============================================================
 *
 * Hook principal de la Home.
 *
 * Sources backend :
 *   convex/home.ts
 *   convex/homeIntelligence.ts
 *
 * Responsabilités :
 * - récupérer les données Home depuis Convex
 * - récupérer l'intelligence Home
 * - normaliser les préférences
 * - exposer le feed
 * - exposer les modules
 * - exposer les sections si elles existent
 * - exposer les recommandations si elles existent
 * - exposer l'intelligence Home
 * - exposer loading / error
 * - fournir un refresh logique
 *
 * IMPORTANT :
 * - aucune logique de ranking métier ici
 * - aucune logique de personnalisation ici
 *
 * Le ranking est géré par HomeRankingEngine.
 * La personnalisation est gérée par HomePersonalizationEngine.
 * ============================================================
 */

/**
 * ============================================================
 * DEFAULTS
 * ============================================================
 */

const DEFAULT_NOTIFICATION_PREFERENCES = {
  newRecommendations: true,
  nearbyAlerts: true,
  opportunities: true,
};

const DEFAULT_PREFERENCES: HomePreferences = {
  favoriteModules: [],
  hiddenSections: [],
  customSectionOrder: [],
  categories: [],
  interests: [],
  notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
};

/**
 * ============================================================
 * HOME INTELLIGENCE TYPES
 * ============================================================
 *
 * Le backend expose déjà cette structure via
 * api.homeIntelligence.getHomeIntelligence.
 *
 * On garde volontairement les sous-objets souples ici :
 * les composants spécialisés pourront ensuite préciser
 * leurs propres props sans coupler useHome à leur implémentation.
 * ============================================================
 */

export interface HomeIntelligence {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    language?: string;
    timezone?: string;
  };

  preferences?: {
    favoriteModules?: string[];
    hiddenSections?: string[];
    customSectionOrder?: string[];
    notifications?: unknown;
  };

  smartContextSuggestions: unknown[];

  opportunityRadar: {
    items: unknown[];
    count: number;
    top?: unknown | null;
  };

  nearbyNow: {
    items: unknown[];
    count: number;
    top?: unknown | null;
  };

  dailyBrief: unknown | null;

  commandCenter: {
    actions: unknown[];
    primary?: unknown | null;
  };

  personalization: {
    score: number;
    favoriteModules: string[];
    hiddenSections: string[];
    availableModules: unknown[];
  };

  activityPulse: {
    items: unknown[];
    count: number;
    latest?: unknown | null;
  };

  metrics: Record<string, unknown>;

  meta: {
    moduleCount: number;
    feedCount: number;
    activityCount: number;
    intelligenceLevel: "high" | "medium" | "starter" | string;
  };
}

/**
 * ============================================================
 * LOCAL TYPES
 * ============================================================
 */

interface HomeDataShape {
  user?: unknown;

  preferences?: unknown;

  feed?: {
    page?: unknown[];
    isDone?: boolean;
    continueCursor?: string;
    preferredTypes?: string[];
    favoriteModules?: string[];
  };

  modules?: Array<{
    id?: string;
    label?: string;
    shortLabel?: string;
    icon?: string;
    route?: string;
    priority?: number;
  }>;

  sections?: unknown;

  recommendations?: unknown;

  context?: {
    generatedAt?: number;
  };
}

/**
 * ============================================================
 * NORMALIZE PREFERENCES
 * ============================================================
 */

function normalizePreferences(value: unknown): HomePreferences {
  if (!value || typeof value !== "object") {
    return DEFAULT_PREFERENCES;
  }

  const source = value as Partial<HomePreferences>;

  const notificationPreferences =
    source.notificationPreferences &&
    typeof source.notificationPreferences === "object"
      ? {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          ...source.notificationPreferences,
        }
      : DEFAULT_NOTIFICATION_PREFERENCES;

  return {
    favoriteModules: Array.isArray(source.favoriteModules)
      ? source.favoriteModules
      : [],

    hiddenSections: Array.isArray(source.hiddenSections)
      ? source.hiddenSections
      : [],

    customSectionOrder: Array.isArray(source.customSectionOrder)
      ? source.customSectionOrder
      : [],

    categories: Array.isArray(source.categories) ? source.categories : [],

    interests: Array.isArray(source.interests) ? source.interests : [],

    notificationPreferences,
  };
}

/**
 * ============================================================
 * READ HOME DATA
 * ============================================================
 */

function asHomeData(value: unknown): HomeDataShape | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as HomeDataShape;
}

/**
 * ============================================================
 * EXTRACT FEED
 * ============================================================
 */

function extractFeed(data: unknown): unknown[] {
  const home = asHomeData(data);

  if (!home?.feed || !Array.isArray(home.feed.page)) {
    return [];
  }

  return home.feed.page;
}

/**
 * ============================================================
 * EXTRACT SECTIONS
 * ============================================================
 *
 * Le backend actuel ne fournit pas encore directement
 * "sections".
 *
 * Cette fonction reste donc compatible avec une future
 * évolution du backend sans inventer de données.
 * ============================================================
 */

function extractSections(data: unknown): HomeSection[] {
  const home = asHomeData(data);

  if (!Array.isArray(home?.sections)) {
    return [];
  }

  return home.sections as HomeSection[];
}

/**
 * ============================================================
 * EXTRACT RECOMMENDATIONS
 * ============================================================
 *
 * Le backend actuel ne fournit pas encore directement
 * "recommendations".
 *
 * Les recommandations seront produites par le moteur dédié.
 * ============================================================
 */

function extractRecommendations(data: unknown): RecommendationItem[] {
  const home = asHomeData(data);

  if (!Array.isArray(home?.recommendations)) {
    return [];
  }

  return home.recommendations as RecommendationItem[];
}

/**
 * ============================================================
 * EXTRACT MODULE IDS
 * ============================================================
 *
 * Priorité :
 *
 * 1. modules réellement renvoyés par Convex
 * 2. registry frontend en fallback
 *
 * Cela évite que la Home affiche des modules désactivés
 * par le backend.
 * ============================================================
 */

function extractModules(data: unknown): ModuleId[] {
  const home = asHomeData(data);

  if (Array.isArray(home?.modules)) {
    const backendModules = home.modules
      .map((module) => module?.id)
      .filter(
        (id): id is ModuleId => typeof id === "string" && id in MODULE_REGISTRY,
      );

    if (backendModules.length > 0) {
      return backendModules;
    }
  }

  return Object.values(MODULE_REGISTRY)
    .filter((module) => module.enabled && module.home.enabled)
    .map((module) => module.id as ModuleId);
}

/**
 * ============================================================
 * EXTRACT PREFERENCES
 * ============================================================
 */

function extractPreferences(data: unknown): unknown {
  const home = asHomeData(data);

  return home?.preferences;
}

/**
 * ============================================================
 * EXTRACT LAST UPDATED
 * ============================================================
 */

function extractLastUpdated(data: unknown): Date {
  const home = asHomeData(data);

  const generatedAt = home?.context?.generatedAt;

  if (typeof generatedAt === "number" && Number.isFinite(generatedAt)) {
    return new Date(generatedAt);
  }

  return new Date();
}

/**
 * ============================================================
 * NORMALIZE INTELLIGENCE
 * ============================================================
 *
 * Le backend est la source de vérité.
 *
 * On protège néanmoins le frontend contre une réponse
 * partiellement vide afin qu'une section intelligente
 * n'empêche jamais la Home de s'afficher.
 * ============================================================
 */

function normalizeIntelligence(value: unknown): HomeIntelligence | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Partial<HomeIntelligence>;

  const opportunityRadar =
    source.opportunityRadar && typeof source.opportunityRadar === "object"
      ? source.opportunityRadar
      : {
          items: [],
          count: 0,
          top: null,
        };

  const nearbyNow =
    source.nearbyNow && typeof source.nearbyNow === "object"
      ? source.nearbyNow
      : {
          items: [],
          count: 0,
          top: null,
        };

  const commandCenter =
    source.commandCenter && typeof source.commandCenter === "object"
      ? source.commandCenter
      : {
          actions: [],
          primary: null,
        };

  const personalization =
    source.personalization && typeof source.personalization === "object"
      ? source.personalization
      : {
          score: 0,
          favoriteModules: [],
          hiddenSections: [],
          availableModules: [],
        };

  const activityPulse =
    source.activityPulse && typeof source.activityPulse === "object"
      ? source.activityPulse
      : {
          items: [],
          count: 0,
          latest: null,
        };

  const meta =
    source.meta && typeof source.meta === "object"
      ? source.meta
      : {
          moduleCount: 0,
          feedCount: 0,
          activityCount: 0,
          intelligenceLevel: "starter",
        };

  return {
    user: source.user,

    preferences: source.preferences,

    smartContextSuggestions: Array.isArray(source.smartContextSuggestions)
      ? source.smartContextSuggestions
      : [],

    opportunityRadar: {
      items: Array.isArray(opportunityRadar.items)
        ? opportunityRadar.items
        : [],
      count:
        typeof opportunityRadar.count === "number" ? opportunityRadar.count : 0,
      top: opportunityRadar.top ?? null,
    },

    nearbyNow: {
      items: Array.isArray(nearbyNow.items) ? nearbyNow.items : [],
      count: typeof nearbyNow.count === "number" ? nearbyNow.count : 0,
      top: nearbyNow.top ?? null,
    },

    dailyBrief: source.dailyBrief ?? null,

    commandCenter: {
      actions: Array.isArray(commandCenter.actions)
        ? commandCenter.actions
        : [],
      primary: commandCenter.primary ?? null,
    },

    personalization: {
      score:
        typeof personalization.score === "number" ? personalization.score : 0,

      favoriteModules: Array.isArray(personalization.favoriteModules)
        ? personalization.favoriteModules
        : [],

      hiddenSections: Array.isArray(personalization.hiddenSections)
        ? personalization.hiddenSections
        : [],

      availableModules: Array.isArray(personalization.availableModules)
        ? personalization.availableModules
        : [],
    },

    activityPulse: {
      items: Array.isArray(activityPulse.items) ? activityPulse.items : [],

      count: typeof activityPulse.count === "number" ? activityPulse.count : 0,

      latest: activityPulse.latest ?? null,
    },

    metrics:
      source.metrics && typeof source.metrics === "object"
        ? source.metrics
        : {},

    meta: {
      moduleCount: typeof meta.moduleCount === "number" ? meta.moduleCount : 0,

      feedCount: typeof meta.feedCount === "number" ? meta.feedCount : 0,

      activityCount:
        typeof meta.activityCount === "number" ? meta.activityCount : 0,

      intelligenceLevel:
        typeof meta.intelligenceLevel === "string"
          ? meta.intelligenceLevel
          : "starter",
    },
  };
}

/**
 * ============================================================
 * HOME HOOK
 * ============================================================
 */

export function useHome() {
  /**
   * ----------------------------------------------------------
   * REFRESH KEY
   * ----------------------------------------------------------
   */

  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * ----------------------------------------------------------
   * CONVEX — HOME DATA
   * ----------------------------------------------------------
   *
   * Convex est réactif :
   * les changements backend provoquent automatiquement
   * une nouvelle valeur de homeData.
   */

  const homeData = useQuery(api.home.getHomeData, {});

  /**
   * ----------------------------------------------------------
   * CONVEX — HOME INTELLIGENCE
   * ----------------------------------------------------------
   *
   * Agrégateur central de l'intelligence Home.
   *
   * Il fournit notamment :
   * - SmartContextSuggestions
   * - OpportunityRadar
   * - NearbyNow
   * - DailyBrief
   * - HomeCommandCenter
   * - HomePersonalization
   * - HomeActivityPulse
   * - metrics
   * - meta
   */

  const rawIntelligence = useQuery(
    api.homeIntelligence.getHomeIntelligence,
    {},
  );

  /**
   * ----------------------------------------------------------
   * LOADING
   * ----------------------------------------------------------
   */

  const isLoading = homeData === undefined || rawIntelligence === undefined;

  /**
   * ----------------------------------------------------------
   * FEED
   * ----------------------------------------------------------
   */

  const feed = useMemo(() => extractFeed(homeData), [homeData]);

  /**
   * ----------------------------------------------------------
   * SECTIONS
   * ----------------------------------------------------------
   */

  const sections = useMemo(() => extractSections(homeData), [homeData]);

  /**
   * ----------------------------------------------------------
   * RECOMMENDATIONS
   * ----------------------------------------------------------
   */

  const recommendations = useMemo(
    () => extractRecommendations(homeData),
    [homeData],
  );

  /**
   * ----------------------------------------------------------
   * PREFERENCES
   * ----------------------------------------------------------
   */

  const preferences = useMemo(
    () => normalizePreferences(extractPreferences(homeData)),
    [homeData],
  );

  /**
   * ----------------------------------------------------------
   * MODULES
   * ----------------------------------------------------------
   */

  const modules = useMemo<ModuleId[]>(
    () => extractModules(homeData),
    [homeData],
  );

  /**
   * ----------------------------------------------------------
   * INTELLIGENCE
   * ----------------------------------------------------------
   */

  const intelligence = useMemo(
    () => normalizeIntelligence(rawIntelligence),
    [rawIntelligence],
  );

  /**
   * ----------------------------------------------------------
   * HOME STATE
   * ----------------------------------------------------------
   */

  const state = useMemo<HomeState>(
    () => ({
      sections,

      isLoading,

      error: null,

      lastUpdated: extractLastUpdated(homeData),

      preferences,
    }),
    [homeData, sections, isLoading, preferences],
  );

  /**
   * ----------------------------------------------------------
   * REFRESH
   * ----------------------------------------------------------
   *
   * Le refresh est volontairement logique.
   *
   * Convex reste la source réactive.
   */

  const refresh = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  /**
   * ----------------------------------------------------------
   * RETURN
   * ----------------------------------------------------------
   */

  return {
    /**
     * Données brutes provenant de Convex.
     */
    data: homeData,

    /**
     * Intelligence Home provenant de Convex.
     */
    intelligence,

    /**
     * Données brutes de l'intelligence.
     *
     * Utile ponctuellement pour debug / inspection.
     */
    rawIntelligence,

    /**
     * État normalisé de la Home.
     */
    state,

    /**
     * Feed brut de la Home.
     */
    feed,

    /**
     * Alias pratique.
     */
    items: feed,

    /**
     * Sections.
     */
    sections,

    /**
     * Recommandations.
     */
    recommendations,

    /**
     * Modules réellement disponibles sur Home.
     */
    modules,

    /**
     * Préférences utilisateur.
     */
    preferences,

    /**
     * Loading.
     */
    isLoading,

    /**
     * Alias de compatibilité.
     */
    loading: isLoading,

    /**
     * Erreur.
     *
     * useQuery ne fournit pas ici une erreur explicite
     * dans notre contrat actuel.
     */
    error: null,

    /**
     * Refresh logique.
     */
    refresh,

    /**
     * Compteur de refresh.
     */
    refreshKey,
  };
}

export default useHome;
