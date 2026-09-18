import type { ModuleId } from "@/config/modules/moduleRegistry";
import type {
  HomeContext,
  HomeLocationContext,
  HomeWeatherContext,
  HomeDeviceContext,
  HomeSessionContext,
} from "./home-context.types";
import type {
  HomeSection,
  HomeSectionData,
  HomeSectionType,
  HomeSectionItem,
} from "./home-section.types";
import type { RecommendationItem } from "./home-recommendation.types";

/**
 * ============================================================
 * HOME — CORE TYPES
 * ============================================================
 */

export type HomeStatus = "idle" | "loading" | "ready" | "refreshing" | "error";

export type HomeViewMode = "default" | "compact" | "expanded" | "personalized";

/**
 * Préférences utilisateur utilisées par Home.
 */
export interface HomePreferences {
  /**
   * Modules favoris / prioritaires.
   */
  favoriteModules: ModuleId[];

  /**
   * Modules que l'utilisateur souhaite masquer.
   */
  hiddenModules?: ModuleId[];

  /**
   * Sections Home masquées.
   */
  hiddenSections: HomeSectionType[];

  /**
   * Ordre personnalisé des sections.
   */
  customSectionOrder: HomeSectionType[];

  /**
   * Catégories suivies.
   */
  categories: string[];

  /**
   * Centres d'intérêt.
   */
  interests: string[];

  /**
   * Ancienne représentation éventuellement utilisée
   * par certains adapters.
   *
   * Conservée pour compatibilité.
   */
  modules?: ModuleId[];

  /**
   * Préférences de notifications liées à Home.
   */
  notificationPreferences: HomeNotificationPreferences;
}

export interface HomeNotificationPreferences {
  newRecommendations: boolean;
  nearbyAlerts: boolean;
  opportunities: boolean;
}

/**
 * État global de Home.
 */
export interface HomeState {
  status?: HomeStatus;

  sections: HomeSection[];

  isLoading: boolean;

  isRefreshing?: boolean;

  error: string | null;

  lastUpdated: Date | null;

  preferences: HomePreferences;

  context?: HomeContext;
}

/**
 * Résultat principal retourné par le moteur Home.
 */
export interface HomeData {
  sections: HomeSection[];

  preferences: HomePreferences;

  context?: HomeContext;

  recommendations?: RecommendationItem[];

  feed?: HomeSectionItem[];

  generatedAt: Date;
}

/**
 * Options de chargement de Home.
 */
export interface HomeLoadOptions {
  forceRefresh?: boolean;

  sectionTypes?: HomeSectionType[];

  modules?: ModuleId[];

  limit?: number;

  includeRecommendations?: boolean;

  includeFeed?: boolean;

  includeNearby?: boolean;
}

/**
 * Résultat d'une section individuelle.
 */
export interface HomeSectionResult {
  type: HomeSectionType;

  data: HomeSectionData;

  isLoading: boolean;

  error?: string | null;

  reason?: string;
}

/**
 * Résultat de génération de sections.
 */
export interface HomeSectionsResult {
  sections: HomeSection[];

  generatedAt: Date;

  context?: HomeContext;
}

/**
 * Configuration générale de Home.
 */
export interface HomeConfig {
  enabled: boolean;

  defaultSectionTypes: HomeSectionType[];

  defaultModules: ModuleId[];

  maxSections: number;

  maxItemsPerSection: number;

  enablePersonalization: boolean;

  enableRecommendations: boolean;

  enableRanking: boolean;

  enableNearby: boolean;

  enableRealtime: boolean;
}

/**
 * Données utilisées par les moteurs de personnalisation.
 */
export interface HomePersonalizationInput {
  context: HomeContext;

  preferences: HomePreferences;

  recentItems?: HomeSectionItem[];

  recentActivity?: HomeActivityItem[];

  recommendations?: RecommendationItem[];
}

/**
 * Activité récente utilisée côté frontend.
 */
export interface HomeActivityItem {
  id: string;

  type:
    | "search"
    | "view"
    | "view_module"
    | "view_publication"
    | "create_publication"
    | "click"
    | "like"
    | "save"
    | "share";

  target?: string;

  label?: string;

  moduleId?: ModuleId;

  timestamp: number | Date;

  metadata?: Record<string, unknown>;
}

/**
 * Données d'analyse Home.
 */
export interface HomeAnalyticsEvent {
  eventType:
    | "section_impression"
    | "item_impression"
    | "click"
    | "like"
    | "save"
    | "share"
    | "comment"
    | "scroll"
    | "time_spent"
    | "search"
    | "dismiss"
    | "refresh";

  sessionId?: string;

  sectionId?: string;

  itemId?: string;

  itemType?: string;

  moduleId?: ModuleId;

  position?: number;

  source?: string;

  timestamp: number;

  metadata?: Record<string, unknown>;
}

/**
 * Re-export centralisé pour éviter les imports fragmentés.
 */
export type {
  HomeContext,
  HomeLocationContext,
  HomeWeatherContext,
  HomeDeviceContext,
  HomeSessionContext,
  HomeSection,
  HomeSectionData,
  HomeSectionType,
  HomeSectionItem,
  RecommendationItem,
};
