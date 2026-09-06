import {
  DefaultHomeEngine,
  type GenerateHomeOptions,
} from "../engine/HomeEngine";

import { HomeContextEngine } from "../engine/HomeContextEngine";

import { HomeRecommendationEngine } from "../engine/HomeRecommendationEngine";

import { HomePersonalizationEngine } from "../engine/HomePersonalizationEngine";

import { HomeAnalyticsService } from "./HomeAnalyticsService";

import type { HomeContext } from "../types/home-context.types";

import type { HomeState } from "../types/home.types";

import type { HomeSection, HomeSectionItem } from "../types/home-section.types";

import type { RecommendationItem } from "../types/home-recommendation.types";

import type { RankingInput } from "../types/home-ranking.types";

/**
 * ============================================================
 * DÉBROUILLEPRO — HomeService
 * ============================================================
 *
 * Façade principale du module Home.
 *
 * Architecture :
 *
 * UI / Hooks
 *      ↓
 * HomeService
 *      ↓
 * HomeEngine
 *      ├── Context
 *      ├── Personalization
 *      ├── Ranking
 *      ├── Recommendations
 *      ├── Sections
 *      └── Actions
 *
 * HomeService ne contient pas de logique de ranking.
 * Il orchestre les services et expose une API stable
 * pour les hooks et les composants.
 *
 * ============================================================
 */

export interface HomeServiceDependencies {
  homeEngine?: DefaultHomeEngine;

  contextEngine?: HomeContextEngine;

  recommendationEngine?: HomeRecommendationEngine;

  personalizationEngine?: HomePersonalizationEngine;

  analyticsService?: HomeAnalyticsService;
}

export interface HomeBuildOptions extends GenerateHomeOptions {
  /**
   * Active ou désactive le tracking de la vue Home.
   *
   * true  → tracking activé
   * false → tracking désactivé
   *
   * Par défaut : true
   */
  track?: boolean;
}

export class HomeService {
  /**
   * ==========================================================
   * DEPENDENCIES
   * ==========================================================
   */

  readonly homeEngine: DefaultHomeEngine;

  readonly contextEngine: HomeContextEngine;

  readonly recommendationEngine: HomeRecommendationEngine;

  readonly personalizationEngine: HomePersonalizationEngine;

  readonly analyticsService: HomeAnalyticsService;

  /**
   * ==========================================================
   * CONSTRUCTOR
   * ==========================================================
   */
  constructor(deps: HomeServiceDependencies = {}) {
    /**
     * --------------------------------------------------------
     * Context
     * --------------------------------------------------------
     */

    this.contextEngine = deps.contextEngine ?? new HomeContextEngine();

    /**
     * --------------------------------------------------------
     * Personalization
     * --------------------------------------------------------
     */

    this.personalizationEngine =
      deps.personalizationEngine ?? new HomePersonalizationEngine();

    /**
     * --------------------------------------------------------
     * Recommendation
     * --------------------------------------------------------
     *
     * Le même moteur de personnalisation est utilisé
     * par le moteur de recommandations.
     */

    this.recommendationEngine =
      deps.recommendationEngine ??
      new HomeRecommendationEngine({
        personalizationEngine: this.personalizationEngine,
      });

    /**
     * --------------------------------------------------------
     * Home Engine
     * --------------------------------------------------------
     *
     * On injecte les mêmes dépendances afin d'éviter
     * plusieurs instances indépendantes des moteurs.
     */

    this.homeEngine =
      deps.homeEngine ??
      new DefaultHomeEngine({
        contextEngine: this.contextEngine,
        recommendationEngine: this.recommendationEngine,
        personalizationEngine: this.personalizationEngine,
      });

    /**
     * --------------------------------------------------------
     * Analytics
     * --------------------------------------------------------
     */

    this.analyticsService = deps.analyticsService ?? new HomeAnalyticsService();
  }

  /**
   * ==========================================================
   * GET HOME
   * ==========================================================
   *
   * Génère la Home complète.
   *
   * Pipeline :
   *
   * Context
   *   ↓
   * Ranking
   *   ↓
   * Recommendations
   *   ↓
   * Sections
   *   ↓
   * HomeState
   */
  async getHome(options: HomeBuildOptions = {}): Promise<HomeState> {
    const state = await this.homeEngine.generateHome(options);

    /**
     * Tracking de la vue Home.
     *
     * Le tracking peut être désactivé avec :
     *
     * track: false
     */
    if (options.track !== false) {
      this.analyticsService.trackHomeView({
        userId: options.userId,
        sectionCount: state.sections.length,
      });
    }

    return state;
  }

  /**
   * ==========================================================
   * BUILD HOME
   * ==========================================================
   *
   * Alias explicite de getHome().
   */
  async buildHome(options: HomeBuildOptions = {}): Promise<HomeState> {
    return this.getHome(options);
  }

  /**
   * ==========================================================
   * BUILD CONTEXT
   * ==========================================================
   *
   * Construit le contexte utilisateur.
   */
  buildContext(
    input: Parameters<HomeContextEngine["buildContext"]>[0] = {},
  ): HomeContext {
    return this.contextEngine.buildContext(input);
  }

  /**
   * ==========================================================
   * GENERATE HOME SECTIONS
   * ==========================================================
   *
   * Génère uniquement les sections.
   */
  generateHomeSections(
    items: HomeSectionItem[] = [],
    recommendations: RecommendationItem[] = [],
    context?: HomeContext,
  ): HomeSection[] {
    return this.homeEngine.generateHomeSections(
      items,
      recommendations,
      context,
    );
  }

  /**
   * ==========================================================
   * GET RECOMMENDATIONS
   * ==========================================================
   *
   * Génère les recommandations personnalisées.
   */
  async getRecommendations(
    items: RankingInput[] = [],
    context?: HomeContext,
    limit = 20,
  ): Promise<RecommendationItem[]> {
    return this.recommendationEngine.getRecommendations(items, context, {
      limit,
    });
  }

  /**
   * ==========================================================
   * GENERATE RECOMMENDATIONS
   * ==========================================================
   *
   * Alias historique conservé pour compatibilité.
   */
  async generateRecommendations(
    items: RankingInput[] = [],
    context?: HomeContext,
    limit = 20,
  ): Promise<RecommendationItem[]> {
    return this.recommendationEngine.generateRecommendations(items, context, {
      limit,
    });
  }

  /**
   * ==========================================================
   * RANK ITEMS
   * ==========================================================
   *
   * Classe les éléments.
   */
  rankItems(items: RankingInput[] = [], context?: HomeContext, limit?: number) {
    const ranked = this.homeEngine.rankItems(items, context);

    if (limit !== undefined && Number.isFinite(limit) && limit > 0) {
      return ranked.slice(0, limit);
    }

    return ranked;
  }

  /**
   * ==========================================================
   * PERSONALIZE
   * ==========================================================
   *
   * Applique la personnalisation Home.
   */
  personalize<T>(items: T[], context?: HomeContext): T[] {
    return this.personalizationEngine.personalizeItems(items, context);
  }

  /**
   * ==========================================================
   * EXECUTE ACTION
   * ==========================================================
   *
   * Exécute une action Home.
   */
  async executeAction(
    action: Parameters<DefaultHomeEngine["executeAction"]>[0],
  ): Promise<void> {
    await this.homeEngine.executeAction(action);
  }

  /**
   * ==========================================================
   * REFRESH
   * ==========================================================
   *
   * Rafraîchit la Home sans créer un événement
   * analytics supplémentaire.
   */
  async refresh(options: HomeBuildOptions = {}): Promise<HomeState> {
    return this.getHome({
      ...options,
      track: false,
    });
  }
}

/**
 * ============================================================
 * SINGLETON
 * ============================================================
 *
 * Instance globale pratique pour les hooks/services.
 */
export const homeService = new HomeService();

export default HomeService;
