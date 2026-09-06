import type { HomeConfig, HomePreferences } from "../types/home.types";
import type { HomeSectionType } from "../types/home-section.types";
import type { ModuleId } from "@/config/modules/moduleRegistry";

/**
 * ============================================================
 * DÉBROUILLEPRO — HOME CONFIGURATION
 * ============================================================
 *
 * Configuration centrale du module Home.
 *
 * Cette configuration ne contient aucune logique métier.
 * Elle définit uniquement les règles globales utilisées par :
 *
 * - HomeEngine
 * - HomeSectionEngine
 * - HomeRecommendationEngine
 * - HomeRankingEngine
 * - HomePersonalizationEngine
 * - HomeService
 * ============================================================
 */

export const HOME_DEFAULT_SECTION_TYPES: HomeSectionType[] = [
  "for_you",
  "opportunities",
  "nearby",
  "trending",
  "stories",
  "continue",
  "recommendations",
];

export const HOME_DEFAULT_MODULES: ModuleId[] = [
  "community",
  "network",
  "boutique",
  "services",
  "jobs",
  "health",
  "justice",
  "city",
  "voyages",
  "annonces",
  "pay",
  "education",
  "live",
];

export const HOME_CONFIG: HomeConfig = {
  enabled: true,

  defaultSectionTypes: HOME_DEFAULT_SECTION_TYPES,

  defaultModules: HOME_DEFAULT_MODULES,

  /**
   * Nombre maximum de sections affichées simultanément.
   */
  maxSections: 7,

  /**
   * Nombre maximum d'éléments par section.
   */
  maxItemsPerSection: 10,

  /**
   * Active la personnalisation basée sur :
   * - profil
   * - préférences
   * - activité
   * - contexte
   */
  enablePersonalization: true,

  /**
   * Active le moteur de recommandations.
   */
  enableRecommendations: true,

  /**
   * Active le moteur de ranking.
   */
  enableRanking: true,

  /**
   * Active les fonctionnalités géolocalisées.
   */
  enableNearby: true,

  /**
   * Active les mises à jour temps réel.
   */
  enableRealtime: true,
};

/**
 * Préférences Home par défaut.
 *
 * Elles servent lorsqu'un utilisateur n'a pas encore
 * de préférences personnalisées.
 */
export const HOME_DEFAULT_PREFERENCES: HomePreferences = {
  favoriteModules: [],

  hiddenModules: [],

  hiddenSections: [],

  customSectionOrder: HOME_DEFAULT_SECTION_TYPES,

  categories: [],

  interests: [],

  /**
   * Alias historique / compatibilité.
   */
  modules: [],

  notificationPreferences: {
    newRecommendations: true,

    nearbyAlerts: true,

    opportunities: true,
  },
};

/**
 * Limites utilisées par les différentes couches Home.
 */
export const HOME_LIMITS = {
  sections: {
    min: 1,

    max: HOME_CONFIG.maxSections,

    default: HOME_CONFIG.maxSections,
  },

  items: {
    min: 1,

    max: HOME_CONFIG.maxItemsPerSection,

    default: HOME_CONFIG.maxItemsPerSection,
  },

  recommendations: {
    min: 1,

    max: 20,

    default: 6,
  },

  nearby: {
    defaultRadiusKm: 25,

    maxRadiusKm: 100,
  },

  feed: {
    defaultLimit: 20,

    maxLimit: 50,
  },
} as const;

/**
 * Paramètres de cache Home.
 */
export const HOME_CACHE_CONFIG = {
  enabled: true,

  /**
   * Cache client court.
   */
  clientTtlMs: 30_000,

  /**
   * Cache recommandations.
   */
  recommendationsTtlMs: 60_000,

  /**
   * Cache contexte.
   */
  contextTtlMs: 5 * 60_000,

  /**
   * Cache sections.
   */
  sectionsTtlMs: 60_000,
} as const;

/**
 * Paramètres de rafraîchissement.
 */
export const HOME_REFRESH_CONFIG = {
  /**
   * Rafraîchissement automatique autorisé.
   */
  enabled: true,

  /**
   * Intervalle minimum entre deux refresh.
   */
  minimumIntervalMs: 30_000,

  /**
   * Refresh lors du retour au premier plan.
   */
  refreshOnFocus: true,

  /**
   * Refresh après changement de localisation.
   */
  refreshOnLocationChange: true,

  /**
   * Refresh après modification des préférences.
   */
  refreshOnPreferencesChange: true,
} as const;

/**
 * Configuration de personnalisation.
 */
export const HOME_PERSONALIZATION_CONFIG = {
  enabled: HOME_CONFIG.enablePersonalization,

  /**
   * Poids général de la personnalisation.
   */
  weight: 1,

  /**
   * Nombre d'activités récentes prises en compte.
   */
  recentActivityLimit: 20,

  /**
   * Nombre de modules favoris pris en compte.
   */
  favoriteModulesLimit: 10,

  /**
   * Nombre de catégories prises en compte.
   */
  categoriesLimit: 10,

  /**
   * Nombre de centres d'intérêt pris en compte.
   */
  interestsLimit: 20,
} as const;

/**
 * Configuration de sécurité / fallback.
 */
export const HOME_FALLBACK_CONFIG = {
  /**
   * Si la personnalisation échoue, Home continue
   * avec la configuration par défaut.
   */
  useDefaultSectionsOnError: true,

  /**
   * Si le ranking échoue, conserver l'ordre original.
   */
  keepOriginalOrderOnRankingError: true,

  /**
   * Si les recommandations échouent, ne pas bloquer Home.
   */
  ignoreRecommendationErrors: true,

  /**
   * Si la localisation n'est pas disponible,
   * la section nearby peut être ignorée.
   */
  skipNearbyWithoutLocation: true,
} as const;

/**
 * Configuration finale exportée.
 *
 * Utilisable directement par HomeEngine.
 */
export const HOME_SETTINGS = {
  config: HOME_CONFIG,

  defaultPreferences: HOME_DEFAULT_PREFERENCES,

  limits: HOME_LIMITS,

  cache: HOME_CACHE_CONFIG,

  refresh: HOME_REFRESH_CONFIG,

  personalization: HOME_PERSONALIZATION_CONFIG,

  fallback: HOME_FALLBACK_CONFIG,
} as const;

export default HOME_CONFIG;
