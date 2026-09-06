/**
 * ============================================================
 * DÉBROUILLEPRO — HOME PRIORITIES
 * ============================================================
 *
 * Priorités dynamiques utilisées par :
 * - HomeRankingEngine
 * - HomeSectionEngine
 * - HomePersonalizationEngine
 *
 * ============================================================
 */

import type { ModuleId } from "@/config/modules/moduleRegistry";
import type { HomeSectionType } from "../types/home-section.types";

/**
 * ============================================================
 * MOMENTS DE LA JOURNÉE
 * ============================================================
 */

export type HomeTimePeriod = "morning" | "afternoon" | "evening" | "night";

/**
 * ============================================================
 * PRIORITÉS PAR MODULE
 * ============================================================
 *
 * Les priorités structurelles du registry restent la source
 * de vérité principale.
 *
 * Ces valeurs servent de fallback au moteur de ranking.
 *
 * ============================================================
 */

export const MODULE_DEFAULT_PRIORITIES: Partial<Record<ModuleId, number>> = {
  jobs: 100,
  annonces: 90,
  services: 85,
  boutique: 80,
  community: 75,
  network: 70,
  health: 65,
  city: 60,
  voyages: 55,
  education: 50,
  pay: 45,
  justice: 40,
  live: 35,
};

/**
 * ============================================================
 * AJUSTEMENTS DU RANKING
 * ============================================================
 */

export type RankingWeightKey =
  | "relevance"
  | "freshness"
  | "proximity"
  | "engagement"
  | "social"
  | "urgency"
  | "quality"
  | "promotion";

export const RANKING_WEIGHT_ADJUSTMENTS: Record<
  HomeTimePeriod,
  Partial<Record<RankingWeightKey, number>>
> = {
  morning: {
    relevance: 1.2,
    freshness: 1.1,
    urgency: 1.3,
  },

  afternoon: {
    relevance: 1.0,
    freshness: 1.0,
    proximity: 1.2,
  },

  evening: {
    social: 1.3,
    engagement: 1.2,
    freshness: 1.0,
  },

  night: {
    quality: 1.4,
    engagement: 1.1,
    social: 1.1,
  },
};

/**
 * ============================================================
 * SEUILS DES SECTIONS
 * ============================================================
 *
 * Une section n'est affichée que si elle dispose d'un nombre
 * suffisant d'éléments pertinents.
 *
 * ============================================================
 */

export const SECTION_THRESHOLDS: Partial<
  Record<HomeSectionType, { minItems: number }>
> = {
  opportunities: {
    minItems: 3,
  },

  nearby: {
    minItems: 2,
  },

  for_you: {
    minItems: 3,
  },

  trending: {
    minItems: 2,
  },

  recommendations: {
    minItems: 3,
  },

  continue: {
    minItems: 1,
  },
};

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

export function getModuleDefaultPriority(moduleId: ModuleId): number {
  return MODULE_DEFAULT_PRIORITIES[moduleId] ?? 0;
}

export function getRankingWeights(
  period: HomeTimePeriod,
): Partial<Record<RankingWeightKey, number>> {
  return RANKING_WEIGHT_ADJUSTMENTS[period];
}

export function getSectionThreshold(section: HomeSectionType): number {
  return SECTION_THRESHOLDS[section]?.minItems ?? 0;
}

export default {
  MODULE_DEFAULT_PRIORITIES,
  RANKING_WEIGHT_ADJUSTMENTS,
  SECTION_THRESHOLDS,
};
