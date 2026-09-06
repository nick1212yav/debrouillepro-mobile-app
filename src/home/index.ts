// ============================================================
// DÉBROUILLEPRO — HOME
// PUBLIC API
// ============================================================
//
// Point d'entrée public du module Home.
//
// IMPORTANT :
// - aucun code métier ici
// - uniquement des exports
// - aucun export en double
// - les types et composants portant le même nom sont
//   explicitement différenciés
// ============================================================

// ============================================================
// COMPONENTS
// ============================================================

export { default as HomeFeed } from "./components/HomeFeed";

export { default as HomeSection } from "./components/HomeSection";

export { default as SmartSection } from "./components/SmartSection";

export { default as RecommendationCard } from "./components/RecommendationCard";

export { default as OpportunityCard } from "./components/OpportunityCard";

export { default as NearbyCard } from "./components/NearbyCard";

export { default as ContinueCard } from "./components/ContinueCard";

export { default as ModuleSuggestionCard } from "./components/ModuleSuggestionCard";

// ============================================================
// CONFIG
// ============================================================

export * from "./config/home.config";

export * from "./config/home-modules.config";

export * from "./config/home-priorities.config";

export * from "./config/home-sections.config";

// ============================================================
// ENGINES
// ============================================================

export { HomeActionEngine } from "./engine/HomeActionEngine";

export { HomeContextEngine } from "./engine/HomeContextEngine";

export { HomeEngine } from "./engine/HomeEngine";

export { HomePersonalizationEngine } from "./engine/HomePersonalizationEngine";

export { HomeRankingEngine } from "./engine/HomeRankingEngine";

export { HomeRecommendationEngine } from "./engine/HomeRecommendationEngine";

export { HomeSectionEngine } from "./engine/HomeSectionEngine";

// ============================================================
// HOOKS
// ============================================================

export { default as useHome } from "./hooks/useHome";

export { default as useHomeContext } from "./hooks/useHomeContext";

export { default as useHomeSections } from "./hooks/useHomeSections";

export { default as useHomeRecommendations } from "./hooks/useHomeRecommendations";

export { default as useHomeFeed } from "./hooks/useHomeFeed";

export { default as useHomeModules } from "./hooks/useHomeModules";

export { default as useHomeActions } from "./hooks/useHomeActions";

export { default as useHomeRealtime } from "./hooks/useHomeRealtime";

// ============================================================
// SERVICES
// ============================================================

export { HomeService } from "./services/HomeService";

export { HomeRecommendationService } from "./services/HomeRecommendationService";

export { HomePersonalizationService } from "./services/HomePersonalizationService";

export { HomeAnalyticsService } from "./services/HomeAnalyticsService";

// ============================================================
// TYPES
// ============================================================

export type {
  HomeState,
  HomePreferences,
  HomeNotificationPreferences,
} from "./types/home.types";

export type { HomeContext } from "./types/home-context.types";

export type {
  RankingInput,
  RankingResult,
  RankedItem,
  RankingStrategy,
  RankingOptions,
  RankingContext,
  RankingWeights,
  RankingConfidence,
  BatchRankingInput,
  BatchRankingResult,
} from "./types/home-ranking.types";

export type { RecommendationItem } from "./types/home-recommendation.types";

export type {
  HomeAction,
  ModuleCardItem,
  HomeSectionItem,
  FeedItem,
} from "./types/home-section.types";

// ============================================================
// IMPORTANT
// ============================================================
//
// `HomeSection` existe à la fois comme composant React et
// comme type TypeScript.
//
// Le composant est exporté sous :
//
//   HomeSection
//
// Le type est volontairement exporté sous :
//
//   HomeSectionType
//
// afin d'éviter tout conflit dans les imports publics.
// ============================================================

export type { HomeSection as HomeSectionType } from "./types/home-section.types";
