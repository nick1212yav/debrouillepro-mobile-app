import type { HomeContext } from "../types/home-context.types";

import type { HomePreferences, HomeState } from "../types/home.types";

import type { HomeSection, HomeSectionItem } from "../types/home-section.types";

import type { RecommendationItem } from "../types/home-recommendation.types";

import type { RankingInput } from "../types/home-ranking.types";

import { HomeContextEngine } from "./HomeContextEngine";

import { HomeRankingEngine } from "./HomeRankingEngine";

import { HomeRecommendationEngine } from "./HomeRecommendationEngine";

import { HomeSectionEngine } from "./HomeSectionEngine";

import { HomePersonalizationEngine } from "./HomePersonalizationEngine";

import { HomeActionEngine } from "./HomeActionEngine";

/**
 * ============================================================
 * DÉBROUILLEPRO
 * HomeEngine
 * ============================================================
 *
 * Orchestrateur global :
 *
 * Context
 *    ↓
 * Personalization
 *    ↓
 * Ranking
 *    ↓
 * Recommendations
 *    ↓
 * Sections
 *    ↓
 * Actions
 *
 * ============================================================
 */

export interface HomeEngineDependencies {
  contextEngine?: HomeContextEngine;

  rankingEngine?: HomeRankingEngine;

  recommendationEngine?: HomeRecommendationEngine;

  sectionEngine?: HomeSectionEngine;

  personalizationEngine?: HomePersonalizationEngine;

  actionEngine?: HomeActionEngine;
}

export interface GenerateHomeOptions {
  userId?: string;

  preferences?: HomePreferences;

  context?: HomeContext;

  items?: HomeSectionItem[];

  recommendations?: RecommendationItem[];

  rankingItems?: RankingInput[];

  limit?: number;
}

export class HomeEngine {
  readonly contextEngine: HomeContextEngine;

  readonly rankingEngine: HomeRankingEngine;

  readonly recommendationEngine: HomeRecommendationEngine;

  readonly sectionEngine: HomeSectionEngine;

  readonly personalizationEngine: HomePersonalizationEngine;

  readonly actionEngine: HomeActionEngine;

  constructor(deps: HomeEngineDependencies = {}) {
    this.contextEngine = deps.contextEngine ?? new HomeContextEngine();

    this.rankingEngine = deps.rankingEngine ?? new HomeRankingEngine();

    this.personalizationEngine =
      deps.personalizationEngine ?? new HomePersonalizationEngine();

    this.recommendationEngine =
      deps.recommendationEngine ??
      new HomeRecommendationEngine({
        rankingEngine: this.rankingEngine,

        personalizationEngine: this.personalizationEngine,
      });

    this.sectionEngine = deps.sectionEngine ?? new HomeSectionEngine();

    this.actionEngine = deps.actionEngine ?? new HomeActionEngine();
  }

  /**
   * Génération complète de la Home.
   */
  async generateHome(options: GenerateHomeOptions = {}): Promise<HomeState> {
    const context =
      options.context ??
      this.contextEngine.buildContext({
        userId: options.userId,
      });

    /**
     * 1. Sources
     */
    const sourceItems = options.items ?? [];

    const rankingItems =
      options.rankingItems ?? (sourceItems as unknown as RankingInput[]);

    /**
     * 2. Ranking
     */
    const ranked = this.rankingEngine.rankItems(rankingItems, context, {
      limit: options.limit,
    });

    /**
     * 3. Recommandations
     */
    const recommendations =
      options.recommendations ??
      (await this.recommendationEngine.getRecommendations(
        ranked as unknown as RankingInput[],
        context,
        {
          limit: options.limit,
        },
      ));

    /**
     * 4. Sections
     */
    const sections = this.generateHomeSections(
      sourceItems,
      recommendations,
      context,
    );

    return {
      sections,

      isLoading: false,

      error: null,

      lastUpdated: new Date(),

      preferences: options.preferences ?? this.createDefaultPreferences(),
    } as HomeState;
  }

  /**
   * Méthode explicitement attendue
   * par HomeService.
   */
  generateHomeSections(
    items: HomeSectionItem[] = [],
    recommendations: RecommendationItem[] = [],
    context?: HomeContext,
  ): HomeSection[] {
    return this.sectionEngine.generateHomeSections(
      items,
      recommendations,
      context,
    );
  }

  /**
   * Construit le contexte.
   */
  buildContext(
    input: Parameters<HomeContextEngine["buildContext"]>[0] = {},
  ): HomeContext {
    return this.contextEngine.buildContext(input);
  }

  /**
   * Ranking public.
   */
  rankItems(items: RankingInput[], context?: HomeContext) {
    return this.rankingEngine.rankItems(items, context);
  }

  /**
   * Recommandations publiques.
   */
  async getRecommendations(
    items: RankingInput[],
    context?: HomeContext,
    limit?: number,
  ) {
    return this.recommendationEngine.getRecommendations(items, context, {
      limit,
    });
  }

  /**
   * Actions.
   */
  async executeAction(
    action: Parameters<HomeActionEngine["execute"]>[0],
  ): Promise<void> {
    await this.actionEngine.execute(action);
  }

  /**
   * Préférences neutres.
   */
  private createDefaultPreferences(): HomePreferences {
    return {
      favoriteModules: [],
      hiddenSections: [],
      customSectionOrder: [],
      categories: [],
      interests: [],
      notificationPreferences: {
        newRecommendations: true,
        nearbyAlerts: true,
        opportunities: true,
      },
    };
  }
}

/**
 * Alias utilisé par les services
 * existants.
 */
export class DefaultHomeEngine extends HomeEngine {}

export default HomeEngine;
