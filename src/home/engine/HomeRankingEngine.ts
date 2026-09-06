import type { HomeContext } from "../types/home-context.types";

import type {
  RankingInput,
  RankingResult,
  RankedItem,
} from "../types/home-ranking.types";

import type { ModuleId } from "@/config/modules/module.types";
import { isModuleId, MODULE_REGISTRY } from "@/config/modules/moduleRegistry";

import {
  RANKING_WEIGHT_ADJUSTMENTS,
  MODULE_DEFAULT_PRIORITIES,
} from "../config/home-priorities.config";

import { isRealContentCard } from "../utils/home-card-normalizer";

/**
 * ============================================================
 * DÉBROUILLEPRO
 * HomeRankingEngine
 * ============================================================
 *
 * Moteur de classement de la Home.
 *
 * Responsabilités :
 * - validation des vraies cartes
 * - calcul du score global
 * - prise en compte des facteurs de ranking
 * - priorité des modules
 * - fraîcheur du contenu
 * - classement décroissant
 * - limitation des résultats
 * - construction du résultat global
 *
 * Facteurs :
 * - relevance
 * - freshness
 * - proximity
 * - engagement
 * - social
 * - urgency
 * - quality
 * - promotion
 *
 * ============================================================
 */

export interface RankingOptions {
  /**
   * Nombre maximum de résultats.
   */
  limit?: number;

  /**
   * Timestamp utilisé pour le calcul de fraîcheur.
   */
  now?: number;
}

/**
 * ============================================================
 * RANKED HOME ITEM
 * ============================================================
 *
 * Représentation interne d'un élément classé par Home.
 *
 * IMPORTANT :
 * RankedHomeItem != RankingResult
 *
 * RankingResult représente le résultat GLOBAL.
 */
export interface RankedHomeItem extends Record<string, unknown> {
  id: string;

  moduleId?: ModuleId;

  type?: string;

  title?: string;

  description?: string;

  image?: string;

  route?: string;

  category?: string;

  relevance?: number;

  score: number;

  originalIndex: number;
}

/**
 * Record générique sécurisé.
 */
type RankingRecord = Record<string, unknown>;

/**
 * Facteurs utilisés par le moteur.
 */
type RankingFactorName =
  | "relevance"
  | "freshness"
  | "proximity"
  | "engagement"
  | "social"
  | "urgency"
  | "quality"
  | "promotion";

/**
 * Poids neutres par défaut.
 */
const DEFAULT_WEIGHTS: Record<RankingFactorName, number> = {
  relevance: 1,
  freshness: 1,
  proximity: 1,
  engagement: 1,
  social: 1,
  urgency: 1,
  quality: 1,
  promotion: 1,
};

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function record(value: unknown): RankingRecord {
  if (value !== null && typeof value === "object") {
    return value as RankingRecord;
  }

  return {};
}

function numberValue(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Normalise une valeur de score vers une échelle 0 → 1.
 *
 * - 0 → 1 : conservé
 * - 0 → 100 : converti
 */
function normalizeScore(value: unknown): number {
  const score = numberValue(value, 0);

  if (score <= 1) {
    return Math.max(0, score);
  }

  return Math.min(1, score / 100);
}

/**
 * ============================================================
 * ENGINE
 * ============================================================
 */

export class HomeRankingEngine {
  /**
   * ==========================================================
   * CALCULATE SCORE
   * ==========================================================
   */
  calculateScore(
    input: RankingInput,
    context?: HomeContext,
    now = Date.now(),
  ): number {
    const item = record(input);
    const contextRecord = record(context);

    const timeOfDay = String(contextRecord.timeOfDay ?? "afternoon") as
      | "morning"
      | "afternoon"
      | "evening"
      | "night";

    /**
     * --------------------------------------------------------
     * AJUSTEMENTS TEMPORELS
     * --------------------------------------------------------
     */

    const adjustments = RANKING_WEIGHT_ADJUSTMENTS[timeOfDay] ?? {};

    const weights: Record<RankingFactorName, number> = {
      ...DEFAULT_WEIGHTS,
      ...(adjustments as Partial<Record<RankingFactorName, number>>),
    };

    /**
     * --------------------------------------------------------
     * FACTEURS
     * --------------------------------------------------------
     */

    const factors: Record<RankingFactorName, number> = {
      relevance: normalizeScore(item.relevanceScore ?? item.relevance),

      freshness: normalizeScore(item.freshnessScore ?? item.freshness),

      proximity: normalizeScore(item.proximityScore ?? item.proximity),

      engagement: normalizeScore(item.engagementScore ?? item.engagement),

      social: normalizeScore(item.socialScore ?? item.social),

      urgency: normalizeScore(item.urgencyScore ?? item.urgency),

      quality: normalizeScore(item.qualityScore ?? item.quality),

      promotion: normalizeScore(item.promotionScore ?? item.promotion),
    };

    /**
     * --------------------------------------------------------
     * SCORE PONDÉRÉ
     * --------------------------------------------------------
     */

    const weightedTotal = (Object.keys(factors) as RankingFactorName[]).reduce(
      (total, factor) => {
        return total + factors[factor] * weights[factor];
      },
      0,
    );

    const totalWeight = Object.values(weights).reduce(
      (total, value) => total + value,
      0,
    );

    let score = totalWeight > 0 ? weightedTotal / totalWeight : 0;

    /**
     * --------------------------------------------------------
     * PRIORITÉ DU MODULE
     * --------------------------------------------------------
     */

    const rawModuleId = item.moduleId;

    if (typeof rawModuleId === "string" && isModuleId(rawModuleId)) {
      const moduleId: ModuleId = rawModuleId;

      const moduleDefinition = MODULE_REGISTRY[moduleId];

      if (moduleDefinition) {
        const priority = numberValue(
          moduleDefinition.home.priority,
          MODULE_DEFAULT_PRIORITIES[moduleId] ?? 0,
        );

        score += Math.min(0.15, priority / 1000);
      }
    }

    /**
     * --------------------------------------------------------
     * FRAÎCHEUR
     * --------------------------------------------------------
     */

    const timestamp = numberValue(item.timestamp ?? item.createdAt, 0);

    if (timestamp > 0) {
      const age = Math.max(0, now - timestamp);

      const days = age / (1000 * 60 * 60 * 24);

      score *= Math.max(0.75, 1 - days / 30);
    }

    /**
     * --------------------------------------------------------
     * CLAMP FINAL
     * --------------------------------------------------------
     */

    return Math.max(0, Math.min(1.25, score));
  }

  /**
   * ==========================================================
   * RANK ITEMS
   * ==========================================================
   *
   * Classe les éléments individuellement.
   *
   * IMPORTANT :
   *
   * Les cartes génériques / incomplètes sont éliminées
   * AVANT le calcul du score.
   *
   * Ainsi :
   *
   * {
   *   moduleId: "transport",
   *   title: "transport",
   *   description: "Contenu"
   * }
   *
   * ne rentre jamais dans le ranking.
   */
  rankItems(
    items: RankingInput[],
    context?: HomeContext,
    options: RankingOptions = {},
  ): RankedHomeItem[] {
    const now = options.now ?? Date.now();

    /**
     * ========================================================
     * VALIDATION À LA SOURCE
     * ========================================================
     *
     * Aucun calcul de score ne doit être effectué sur une
     * carte qui n'est pas une vraie carte de contenu.
     */
    const validItems = items.filter(isRealContentCard);

    /**
     * ========================================================
     * RANKING
     * ========================================================
     *
     * Le ranking travaille UNIQUEMENT sur les cartes valides.
     */
    const ranked = validItems
      .map((item, index) => {
        const source = record(item);

        const score = this.calculateScore(item, context, now);

        /**
         * ID stable.
         */
        const id = typeof source.id === "string" ? source.id : String(index);

        /**
         * Module validé.
         */
        const moduleId =
          typeof source.moduleId === "string" && isModuleId(source.moduleId)
            ? source.moduleId
            : undefined;

        return {
          ...source,

          id,

          ...(moduleId ? { moduleId } : {}),

          score,

          originalIndex: index,
        };
      })
      .sort((a, b) => {
        /**
         * ------------------------------------------------------
         * TRI
         * ------------------------------------------------------
         *
         * Meilleur score en premier.
         *
         * En cas d'égalité, on conserve
         * l'ordre original.
         */
        const scoreDifference = numberValue(b.score) - numberValue(a.score);

        if (scoreDifference !== 0) {
          return scoreDifference;
        }

        return a.originalIndex - b.originalIndex;
      });

    /**
     * ========================================================
     * LIMIT
     * ========================================================
     */

    if (options.limit !== undefined && options.limit > 0) {
      return ranked.slice(0, options.limit);
    }

    return ranked;
  }

  /**
   * ==========================================================
   * RANK
   * ==========================================================
   *
   * Alias historique.
   */
  rank(
    items: RankingInput[],
    context?: HomeContext,
    options: RankingOptions = {},
  ): RankedHomeItem[] {
    return this.rankItems(items, context, options);
  }

  /**
   * ==========================================================
   * BATCH RANK ITEMS
   * ==========================================================
   */
  batchRankItems(
    items: RankingInput[],
    context?: HomeContext,
    options: RankingOptions = {},
  ): RankedHomeItem[] {
    return this.rankItems(items, context, options);
  }

  /**
   * ==========================================================
   * BUILD RESULT
   * ==========================================================
   *
   * Construit le résultat GLOBAL attendu par RankingResult.
   *
   * rankItems() retourne RankedHomeItem[].
   *
   * RankingResult attend RankedItem[].
   *
   * Conversion explicite ici.
   */
  buildResult(
    items: RankingInput[],
    context?: HomeContext,
    options: RankingOptions = {},
  ): RankingResult {
    /**
     * rankItems() filtre déjà les cartes invalides.
     */
    const rankedItems = this.rankItems(items, context, options);

    /**
     * Conversion vers le contrat public RankedItem.
     *
     * rank commence à 1.
     *
     * rankingScore reprend le score
     * calculé par le moteur.
     */
    const resultItems: RankedItem[] = rankedItems.map((item, index) => ({
      ...item,

      rank: index + 1,

      rankingScore: item.score,
    }));

    /**
     * IMPORTANT :
     * generatedAt est un Date car RankingResult
     * le définit comme Date.
     */
    return {
      items: resultItems,

      strategy: "home",

      generatedAt: new Date(),

      /**
       * On compte uniquement les candidats
       * réellement acceptés par le ranking.
       */
      totalCandidates: rankedItems.length,
    };
  }
}

export default HomeRankingEngine;
