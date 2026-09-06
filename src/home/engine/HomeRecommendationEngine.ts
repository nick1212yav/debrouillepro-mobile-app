import type { HomeContext } from "../types/home-context.types";

import type { RecommendationItem } from "../types/home-recommendation.types";

import type { RankingInput, RankingResult } from "../types/home-ranking.types";

import { HomeRankingEngine } from "./HomeRankingEngine";

import { HomePersonalizationEngine } from "./HomePersonalizationEngine";

/**
 * ============================================================
 * DÉBROUILLEPRO
 * HomeRecommendationEngine
 * ============================================================
 */

export interface HomeRecommendationEngineDependencies {
  rankingEngine?: HomeRankingEngine;

  personalizationEngine?: HomePersonalizationEngine;
}

export interface RecommendationOptions {
  limit?: number;
}

type RecordValue = Record<string, unknown>;

function toRecord(value: unknown): RecordValue {
  if (value !== null && typeof value === "object") {
    return value as RecordValue;
  }

  return {};
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export class HomeRecommendationEngine {
  private readonly rankingEngine: HomeRankingEngine;

  private readonly personalizationEngine: HomePersonalizationEngine;

  constructor(deps: HomeRecommendationEngineDependencies = {}) {
    this.rankingEngine = deps.rankingEngine ?? new HomeRankingEngine();

    this.personalizationEngine =
      deps.personalizationEngine ?? new HomePersonalizationEngine();
  }

  /**
   * Génère les recommandations.
   */
  async getRecommendations(
    items: RankingInput[] = [],
    context?: HomeContext,
    options: RecommendationOptions = {},
  ): Promise<RecommendationItem[]> {
    const ranked = this.rankingEngine.rankItems(items, context, {
      limit: Math.max(options.limit ?? 20, 20),
    });

    const personalized = this.personalizationEngine.personalizeItems(
      ranked,
      context,
      undefined,
    );

    const results = personalized.map((item) => this.toRecommendationItem(item));

    return results.slice(0, options.limit ?? 20);
  }

  /**
   * Nom historique conservé pour
   * compatibilité avec les services.
   */
  async generateRecommendations(
    items: RankingInput[] = [],
    context?: HomeContext,
    options: RecommendationOptions = {},
  ): Promise<RecommendationItem[]> {
    return this.getRecommendations(items, context, options);
  }

  /**
   * Convertit un résultat de ranking
   * en RecommendationItem.
   *
   * IMPORTANT :
   * RecommendationItem possède son propre
   * type métier : "recommendation".
   */
  private toRecommendationItem(
    value: RankingResult | RankingInput,
  ): RecommendationItem {
    const item = toRecord(value);

    const id = stringValue(item.id, cryptoSafeId());

    const moduleId =
      typeof item.moduleId === "string"
        ? (item.moduleId as RecommendationItem["moduleId"])
        : undefined;

    const title = stringValue(item.title, "Recommandation");

    const description =
      typeof item.description === "string" ? item.description : undefined;

    const image = typeof item.image === "string" ? item.image : undefined;

    const imageUrl =
      typeof item.imageUrl === "string" ? item.imageUrl : undefined;

    const route = stringValue(
      item.route,
      moduleId ? `/${String(moduleId)}/${id}` : `/${id}`,
    );

    const relevance =
      item.relevance === "very_high" ||
      item.relevance === "high" ||
      item.relevance === "medium" ||
      item.relevance === "low"
        ? item.relevance
        : "medium";

    return {
      id,

      type: "recommendation",

      moduleId,

      title,

      description,

      image,

      imageUrl,

      route,

      score: typeof item.score === "number" ? item.score : 0,

      relevance,

      reason:
        typeof item.reason === "string"
          ? (item.reason as RecommendationItem["reason"])
          : undefined,

      reasonLabel:
        typeof item.reasonLabel === "string" ? item.reasonLabel : undefined,

      category: typeof item.category === "string" ? item.category : undefined,

      authorId: typeof item.authorId === "string" ? item.authorId : undefined,

      authorName:
        typeof item.authorName === "string" ? item.authorName : undefined,

      authorAvatar:
        typeof item.authorAvatar === "string" ? item.authorAvatar : undefined,

      createdAt:
        typeof item.createdAt === "number" || item.createdAt instanceof Date
          ? item.createdAt
          : undefined,

      updatedAt:
        typeof item.updatedAt === "number" || item.updatedAt instanceof Date
          ? item.updatedAt
          : undefined,

      distanceKm:
        typeof item.distanceKm === "number" ? item.distanceKm : undefined,

      position: typeof item.position === "number" ? item.position : undefined,

      interacted:
        typeof item.interacted === "boolean" ? item.interacted : undefined,

      isNew: typeof item.isNew === "boolean" ? item.isNew : undefined,

      isSponsored:
        typeof item.isSponsored === "boolean" ? item.isSponsored : undefined,

      metadata:
        item.metadata !== null && typeof item.metadata === "object"
          ? (item.metadata as Record<string, unknown>)
          : undefined,
    };
  }
}

/**
 * Génère un identifiant local sans
 * dépendance supplémentaire.
 */
function cryptoSafeId(): string {
  return `home-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default HomeRecommendationEngine;
