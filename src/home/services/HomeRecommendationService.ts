import { HomeRecommendationEngine } from "../engine/HomeRecommendationEngine";

import { HomeRankingEngine } from "../engine/HomeRankingEngine";

import type { HomeContext } from "../types/home-context.types";

import type { RecommendationItem } from "../types/home-recommendation.types";

import type { RankingInput } from "../types/home-ranking.types";

/**
 * ============================================================
 * DÉBROUILLEPRO — HomeRecommendationService
 * ============================================================
 *
 * Façade métier des recommandations Home.
 *
 * Architecture :
 *
 * Candidates
 *     ↓
 * HomeRecommendationService
 *     ↓
 * Ranking
 *     ↓
 * RecommendationEngine
 *     ↓
 * RecommendationItem[]
 *
 * IMPORTANT :
 * - aucune logique UI
 * - aucune dépendance directe à Convex
 * - le ranking reste délégué à HomeRankingEngine
 * - la transformation finale reste déléguée
 *   à HomeRecommendationEngine
 *
 * ============================================================
 */

/**
 * Dépendances injectables.
 */
export interface HomeRecommendationServiceDependencies {
  recommendationEngine?: HomeRecommendationEngine;

  rankingEngine?: HomeRankingEngine;
}

/**
 * Options de recommandations.
 */
export interface GetRecommendationsOptions {
  /**
   * Nombre maximum de recommandations.
   */
  limit?: number;

  /**
   * Active/désactive le ranking préalable.
   *
   * true par défaut.
   */
  rank?: boolean;
}

/**
 * ============================================================
 * SERVICE
 * ============================================================
 */

export class HomeRecommendationService {
  /**
   * Moteur de recommandations.
   */
  readonly recommendationEngine: HomeRecommendationEngine;

  /**
   * Moteur de ranking.
   */
  readonly rankingEngine: HomeRankingEngine;

  /**
   * ==========================================================
   * CONSTRUCTOR
   * ==========================================================
   */
  constructor(deps: HomeRecommendationServiceDependencies = {}) {
    this.rankingEngine = deps.rankingEngine ?? new HomeRankingEngine();

    this.recommendationEngine =
      deps.recommendationEngine ??
      new HomeRecommendationEngine({
        rankingEngine: this.rankingEngine,
      });
  }

  /**
   * ==========================================================
   * GET RECOMMENDATIONS
   * ==========================================================
   *
   * API principale.
   */
  async getRecommendations(
    items: RankingInput[] = [],
    context?: HomeContext,
    options: GetRecommendationsOptions = {},
  ): Promise<RecommendationItem[]> {
    const limit =
      options.limit !== undefined && options.limit > 0 ? options.limit : 20;

    /**
     * Ranking optionnel.
     */
    const ranked =
      options.rank === false
        ? items
        : this.rankingEngine.rankItems(items, context, {
            limit: Math.max(limit, items.length),
          });

    /**
     * Génération des recommandations.
     */
    return this.recommendationEngine.getRecommendations(
      ranked as RankingInput[],
      context,
      {
        limit,
      },
    );
  }

  /**
   * ==========================================================
   * GENERATE RECOMMENDATIONS
   * ==========================================================
   *
   * API historique conservée pour compatibilité.
   */
  async generateRecommendations(
    items: RankingInput[] = [],
    context?: HomeContext,
    options: GetRecommendationsOptions = {},
  ): Promise<RecommendationItem[]> {
    const limit =
      options.limit !== undefined && options.limit > 0 ? options.limit : 20;

    /**
     * Ranking optionnel.
     */
    const ranked =
      options.rank === false
        ? items
        : this.rankingEngine.rankItems(items, context, {
            limit: Math.max(limit, items.length),
          });

    /**
     * Utilise explicitement l'API historique
     * du RecommendationEngine.
     */
    return this.recommendationEngine.generateRecommendations(
      ranked as RankingInput[],
      context,
      {
        limit,
      },
    );
  }

  /**
   * ==========================================================
   * RANK CANDIDATES
   * ==========================================================
   *
   * Classe uniquement les candidats.
   */
  rankCandidates(
    items: RankingInput[] = [],
    context?: HomeContext,
    limit?: number,
  ) {
    const effectiveLimit =
      limit !== undefined && limit > 0 ? limit : items.length;

    return this.rankingEngine.rankItems(items, context, {
      limit: effectiveLimit,
    });
  }

  /**
   * ==========================================================
   * BATCH RANK CANDIDATES
   * ==========================================================
   */
  batchRankCandidates(
    items: RankingInput[] = [],
    context?: HomeContext,
    limit?: number,
  ) {
    const effectiveLimit =
      limit !== undefined && limit > 0 ? limit : items.length;

    return this.rankingEngine.batchRankItems(items, context, {
      limit: effectiveLimit,
    });
  }
}

/**
 * ============================================================
 * SINGLETON
 * ============================================================
 */

export const homeRecommendationService = new HomeRecommendationService();

/**
 * Export par défaut.
 */
export default HomeRecommendationService;
