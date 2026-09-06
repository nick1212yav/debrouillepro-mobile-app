import type { HomeContext } from "../types/home-context.types";

import type {
  HomeSection,
  HomeSectionType,
  HomeSectionItem,
} from "../types/home-section.types";

import type { RecommendationItem } from "../types/home-recommendation.types";

import { SECTION_THRESHOLDS } from "../config/home-priorities.config";

import { cleanHomeFeed } from "../utils/home-card-normalizer";

/**
 * ============================================================
 * DÉBROUILLEPRO
 * HomeSectionEngine
 * ============================================================
 */

export interface HomeSectionEngineOptions {
  includeEmpty?: boolean;
}

type ItemRecord = Record<string, unknown>;

function toRecord(value: unknown): ItemRecord {
  if (value !== null && typeof value === "object") {
    return value as ItemRecord;
  }

  return {};
}

function getModuleId(item: unknown): string | undefined {
  const value = toRecord(item).moduleId;

  return typeof value === "string" ? value : undefined;
}

function itemMatchesModule(item: unknown, modules: string[]): boolean {
  const moduleId = getModuleId(item);

  return Boolean(moduleId && modules.includes(moduleId));
}

function toSectionItem(item: unknown): HomeSectionItem {
  return item as HomeSectionItem;
}

export class HomeSectionEngine {
  /**
   * Assemble toutes les sections.
   */
  generateHomeSections(
    items: HomeSectionItem[] = [],
    recommendations: RecommendationItem[] = [],
    context?: HomeContext,
    options: HomeSectionEngineOptions = {},
  ): HomeSection[] {
    /**
     * ==========================================================
     * NETTOYAGE À LA SOURCE
     * ==========================================================
     *
     * On ne laisse entrer dans le moteur que les vraies cartes
     * possédant :
     *
     * - title
     * - description
     * - image
     * - route
     * - moduleId
     *
     * Les cartes génériques du type :
     *
     *   transport
     *   Contenu
     *
     * sont éliminées ici.
     */
    const allItems = cleanHomeFeed(items.map(toSectionItem));

    const recommendationItems = recommendations.map(toSectionItem);

    const sections: HomeSection[] = [];

    /**
     * ==========================================================
     * FOR YOU
     * ==========================================================
     */
    const cleanForYouItems = cleanHomeFeed(allItems);

    this.addSection(
      sections,
      "for_you",
      cleanForYouItems,
      options,
      recommendationItems,
    );

    /**
     * ==========================================================
     * OPPORTUNITIES
     * ==========================================================
     */
    const opportunities = allItems.filter((item) => this.isOpportunity(item));

    const cleanOpportunityItems = cleanHomeFeed(opportunities);

    this.addSection(sections, "opportunities", cleanOpportunityItems, options);

    /**
     * ==========================================================
     * NEARBY
     * ==========================================================
     */
    const nearbyItems = allItems.filter((item) => this.isNearby(item));

    const cleanNearbyItems = cleanHomeFeed(nearbyItems);

    this.addSection(sections, "nearby", cleanNearbyItems, options);

    /**
     * ==========================================================
     * TRENDING
     * ==========================================================
     */
    const trendingItems = [...allItems].sort(
      (a, b) => this.engagementScore(b) - this.engagementScore(a),
    );

    const cleanTrendingItems = cleanHomeFeed(trendingItems);

    this.addSection(sections, "trending", cleanTrendingItems, options);

    /**
     * ==========================================================
     * RECOMMENDATIONS
     * ==========================================================
     */
    this.addSection(sections, "recommendations", recommendationItems, options);

    /**
     * ==========================================================
     * CONTINUE
     * ==========================================================
     */
    const continueItems = allItems.filter((item) => this.isContinueItem(item));

    this.addSection(sections, "continue", continueItems, options);

    return sections;
  }

  /**
   * Alias attendu par certains services.
   */
  generateSections(
    items: HomeSectionItem[] = [],
    recommendations: RecommendationItem[] = [],
    context?: HomeContext,
    options: HomeSectionEngineOptions = {},
  ): HomeSection[] {
    return this.generateHomeSections(items, recommendations, context, options);
  }

  /**
   * Ajoute une section uniquement si
   * le seuil est respecté.
   */
  private addSection(
    sections: HomeSection[],
    type: HomeSectionType,
    items: HomeSectionItem[],
    options: HomeSectionEngineOptions,
    fallbackItems?: HomeSectionItem[],
  ): void {
    const threshold = SECTION_THRESHOLDS[type]?.minItems ?? 0;

    const source = items.length > 0 ? items : (fallbackItems ?? []);

    if (!options.includeEmpty && source.length < threshold) {
      return;
    }

    sections.push({
      id: `home-${type}`,

      type,

      title: this.getSectionTitle(type),

      subtitle: this.getSectionSubtitle(type),

      data: {
        type,

        items: source,

        isLoading: false,

        error: null,
      },
    } as HomeSection);
  }

  private getSectionTitle(type: HomeSectionType): string {
    const titles: Partial<Record<HomeSectionType, string>> = {
      for_you: "Pour vous",
      opportunities: "Opportunités",
      nearby: "Près de vous",
      trending: "Tendances",
      recommendations: "Recommandations",
      continue: "Continuer",
      stories: "Stories",
    };

    return titles[type] ?? "Découvrir";
  }

  private getSectionSubtitle(type: HomeSectionType): string | undefined {
    const subtitles: Partial<Record<HomeSectionType, string>> = {
      for_you: "Sélection personnalisée",
      opportunities: "Ce qui peut vous intéresser",
      nearby: "À proximité",
      trending: "Les contenus populaires",
      recommendations: "Sélectionnée pour vous",
      continue: "Reprendre votre activité",
    };

    return subtitles[type];
  }

  private isOpportunity(item: HomeSectionItem): boolean {
    const value = toRecord(item);

    const type = String(value.type ?? "");

    return (
      type === "job" ||
      type === "property" ||
      type === "service" ||
      type === "product"
    );
  }

  private isNearby(item: HomeSectionItem): boolean {
    const value = toRecord(item);

    return (
      value.nearby === true ||
      value.isNearby === true ||
      typeof value.distance === "number"
    );
  }

  private isContinueItem(item: HomeSectionItem): boolean {
    const value = toRecord(item);

    return (
      value.continue === true ||
      value.continueWatching === true ||
      value.progress !== undefined
    );
  }

  private engagementScore(item: HomeSectionItem): number {
    const value = toRecord(item);

    const likes = typeof value.likes === "number" ? value.likes : 0;

    const comments = typeof value.comments === "number" ? value.comments : 0;

    const shares = typeof value.shares === "number" ? value.shares : 0;

    return likes + comments * 2 + shares * 3;
  }
}

export default HomeSectionEngine;
