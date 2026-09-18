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
// - les types et composants portant le même nom sont
//   explicitement différenciés
// ============================================================

// ============================================================
// COMPONENTS
// ============================================================

export { default as HomeFeed } from "./components/HomeFeed";

export { default as HomeSection } from "./components/HomeSection";

export { default as RecommendationCard } from "./components/RecommendationCard";

export { default as OpportunityCard } from "./components/OpportunityCard";

export { default as NearbyCard } from "./components/NearbyCard";

export { default as ContinueCard } from "./components/ContinueCard";

export { default as ModuleSuggestionCard } from "./components/ModuleSuggestionCard";

// ============================================================
// HOOKS
// ============================================================

export { default as useHomeFeed } from "./hooks/useHomeFeed";

// ============================================================
// TYPES
// ============================================================

export type {
  HomeState,
  HomePreferences,
  HomeNotificationPreferences,
} from "./types/home.types";

export type { HomeContext } from "./types/home-context.types";

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
