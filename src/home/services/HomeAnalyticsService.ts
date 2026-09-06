/**
 * ============================================================
 * DÉBROUILLEPRO — HomeAnalyticsService
 * ============================================================
 *
 * Service d'analytics métier de la Home.
 *
 * Responsabilités :
 * - collecter les événements Home
 * - conserver temporairement les événements en mémoire
 * - permettre l'injection d'un sink backend
 * - supporter l'envoi individuel
 * - supporter l'envoi par batch
 * - exposer les événements pour tests/debug
 *
 * IMPORTANT :
 * - aucune dépendance directe à Convex
 * - aucune dépendance directe à Firebase
 * - le backend est injecté via HomeAnalyticsSink
 *
 * Architecture :
 *
 * Home UI
 *   ↓
 * HomeAnalyticsService
 *   ↓
 * HomeAnalyticsSink
 *   ↓
 * Backend / Convex / Analytics
 *
 * ============================================================
 */

/**
 * ============================================================
 * EVENT NAMES
 * ============================================================
 */

export type HomeAnalyticsEventName =
  | "home_view"
  | "section_view"
  | "item_view"
  | "item_click"
  | "recommendation_impression"
  | "recommendation_click"
  | "recommendation_dismiss"
  | "module_click"
  | "action_click"
  | "refresh"
  | "search"
  | "personalization_applied";

/**
 * ============================================================
 * EVENT
 * ============================================================
 */

export interface HomeAnalyticsEvent {
  name: HomeAnalyticsEventName;

  userId?: string;

  sessionId?: string;

  sectionId?: string;

  sectionType?: string;

  itemId?: string;

  moduleId?: string;

  timestamp: number;

  metadata?: Record<string, unknown>;
}

/**
 * ============================================================
 * ANALYTICS SINK
 * ============================================================
 *
 * Adaptateur injectable.
 *
 * Exemple futur :
 *
 * const convexSink: HomeAnalyticsSink = {
 *   track: async (event) => {
 *     // Convex mutation
 *   },
 * };
 *
 * ============================================================
 */

export interface HomeAnalyticsSink {
  track?: (event: HomeAnalyticsEvent) => void | Promise<void>;

  trackBatch?: (events: HomeAnalyticsEvent[]) => void | Promise<void>;
}

/**
 * ============================================================
 * INPUTS
 * ============================================================
 */

export interface TrackHomeViewInput {
  userId?: string;

  sessionId?: string;

  sectionCount?: number;

  metadata?: Record<string, unknown>;
}

export interface TrackSectionViewInput {
  userId?: string;

  sessionId?: string;

  sectionId: string;

  sectionType?: string;

  metadata?: Record<string, unknown>;
}

export interface TrackItemInput {
  userId?: string;

  sessionId?: string;

  sectionId?: string;

  sectionType?: string;

  itemId: string;

  moduleId?: string;

  metadata?: Record<string, unknown>;
}

export interface TrackRecommendationInput extends TrackItemInput {
  recommendationScore?: number;

  reason?: string;
}

/**
 * ============================================================
 * DEPENDENCIES
 * ============================================================
 */

export interface HomeAnalyticsServiceDependencies {
  sink?: HomeAnalyticsSink;

  now?: () => number;
}

/**
 * ============================================================
 * SERVICE
 * ============================================================
 */

export class HomeAnalyticsService {
  /**
   * Backend/adaptateur optionnel.
   */
  private readonly sink?: HomeAnalyticsSink;

  /**
   * Fournisseur de timestamp injectable.
   */
  private readonly now: () => number;

  /**
   * Buffer local des événements.
   */
  private readonly events: HomeAnalyticsEvent[] = [];

  /**
   * ==========================================================
   * CONSTRUCTOR
   * ==========================================================
   */

  constructor(deps: HomeAnalyticsServiceDependencies = {}) {
    this.sink = deps.sink;

    this.now = deps.now ?? (() => Date.now());
  }

  /**
   * ==========================================================
   * TRACK
   * ==========================================================
   *
   * Événement générique.
   */
  async track(event: Omit<HomeAnalyticsEvent, "timestamp">): Promise<void> {
    const normalized: HomeAnalyticsEvent = {
      ...event,
      timestamp: this.now(),
    };

    this.events.push(normalized);

    await this.sink?.track?.(normalized);
  }

  /**
   * ==========================================================
   * HOME VIEW
   * ==========================================================
   */

  async trackHomeView(input: TrackHomeViewInput = {}): Promise<void> {
    await this.track({
      name: "home_view",

      userId: input.userId,

      sessionId: input.sessionId,

      metadata: {
        ...input.metadata,

        ...(input.sectionCount !== undefined
          ? {
              sectionCount: input.sectionCount,
            }
          : {}),
      },
    });
  }

  /**
   * ==========================================================
   * SECTION VIEW
   * ==========================================================
   */

  async trackSectionView(input: TrackSectionViewInput): Promise<void> {
    await this.track({
      name: "section_view",

      userId: input.userId,

      sessionId: input.sessionId,

      sectionId: input.sectionId,

      sectionType: input.sectionType,

      metadata: input.metadata,
    });
  }

  /**
   * ==========================================================
   * ITEM VIEW
   * ==========================================================
   */

  async trackItemView(input: TrackItemInput): Promise<void> {
    await this.track({
      name: "item_view",

      userId: input.userId,

      sessionId: input.sessionId,

      sectionId: input.sectionId,

      sectionType: input.sectionType,

      itemId: input.itemId,

      moduleId: input.moduleId,

      metadata: input.metadata,
    });
  }

  /**
   * ==========================================================
   * ITEM CLICK
   * ==========================================================
   */

  async trackItemClick(input: TrackItemInput): Promise<void> {
    await this.track({
      name: "item_click",

      userId: input.userId,

      sessionId: input.sessionId,

      sectionId: input.sectionId,

      sectionType: input.sectionType,

      itemId: input.itemId,

      moduleId: input.moduleId,

      metadata: input.metadata,
    });
  }

  /**
   * ==========================================================
   * RECOMMENDATION IMPRESSION
   * ==========================================================
   */

  async trackRecommendationImpression(
    input: TrackRecommendationInput,
  ): Promise<void> {
    await this.trackRecommendationEvent("recommendation_impression", input);
  }

  /**
   * ==========================================================
   * RECOMMENDATION CLICK
   * ==========================================================
   */

  async trackRecommendationClick(
    input: TrackRecommendationInput,
  ): Promise<void> {
    await this.trackRecommendationEvent("recommendation_click", input);
  }

  /**
   * ==========================================================
   * RECOMMENDATION DISMISS
   * ==========================================================
   */

  async trackRecommendationDismiss(
    input: TrackRecommendationInput,
  ): Promise<void> {
    await this.trackRecommendationEvent("recommendation_dismiss", input);
  }

  /**
   * ==========================================================
   * RECOMMENDATION EVENT
   * ==========================================================
   */

  private async trackRecommendationEvent(
    name:
      | "recommendation_impression"
      | "recommendation_click"
      | "recommendation_dismiss",
    input: TrackRecommendationInput,
  ): Promise<void> {
    await this.track({
      name,

      userId: input.userId,

      sessionId: input.sessionId,

      sectionId: input.sectionId,

      sectionType: input.sectionType,

      itemId: input.itemId,

      moduleId: input.moduleId,

      metadata: {
        ...input.metadata,

        ...(input.recommendationScore !== undefined
          ? {
              recommendationScore: input.recommendationScore,
            }
          : {}),

        ...(input.reason !== undefined
          ? {
              reason: input.reason,
            }
          : {}),
      },
    });
  }

  /**
   * ==========================================================
   * MODULE CLICK
   * ==========================================================
   */

  async trackModuleClick(
    input: Omit<TrackItemInput, "itemId"> & {
      itemId?: string;

      moduleId: string;
    },
  ): Promise<void> {
    await this.track({
      name: "module_click",

      userId: input.userId,

      sessionId: input.sessionId,

      sectionId: input.sectionId,

      sectionType: input.sectionType,

      itemId: input.itemId,

      moduleId: input.moduleId,

      metadata: input.metadata,
    });
  }

  /**
   * ==========================================================
   * ACTION CLICK
   * ==========================================================
   */

  async trackActionClick(input: {
    userId?: string;

    sessionId?: string;

    sectionId?: string;

    actionId: string;

    moduleId?: string;

    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.track({
      name: "action_click",

      userId: input.userId,

      sessionId: input.sessionId,

      sectionId: input.sectionId,

      moduleId: input.moduleId,

      metadata: {
        ...input.metadata,

        actionId: input.actionId,
      },
    });
  }

  /**
   * ==========================================================
   * SEARCH
   * ==========================================================
   */

  async trackSearch(input: {
    userId?: string;

    sessionId?: string;

    query: string;

    resultCount?: number;
  }): Promise<void> {
    await this.track({
      name: "search",

      userId: input.userId,

      sessionId: input.sessionId,

      metadata: {
        query: input.query,

        ...(input.resultCount !== undefined
          ? {
              resultCount: input.resultCount,
            }
          : {}),
      },
    });
  }

  /**
   * ==========================================================
   * REFRESH
   * ==========================================================
   */

  async trackRefresh(userId?: string, sessionId?: string): Promise<void> {
    await this.track({
      name: "refresh",

      userId,

      sessionId,
    });
  }

  /**
   * ==========================================================
   * PERSONALIZATION
   * ==========================================================
   */

  async trackPersonalizationApplied(input: {
    userId?: string;

    sessionId?: string;

    moduleCount?: number;

    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.track({
      name: "personalization_applied",

      userId: input.userId,

      sessionId: input.sessionId,

      metadata: {
        ...input.metadata,

        ...(input.moduleCount !== undefined
          ? {
              moduleCount: input.moduleCount,
            }
          : {}),
      },
    });
  }

  /**
   * ==========================================================
   * GET EVENTS
   * ==========================================================
   *
   * Retourne une copie du buffer.
   */
  getEvents(): HomeAnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * ==========================================================
   * CLEAR
   * ==========================================================
   */

  clear(): void {
    this.events.length = 0;
  }

  /**
   * ==========================================================
   * FLUSH
   * ==========================================================
   *
   * Envoie tous les événements actuellement en mémoire.
   *
   * Le buffer est vidé uniquement après succès de l'envoi.
   */
  async flush(): Promise<void> {
    if (this.events.length === 0) {
      return;
    }

    const events = [...this.events];

    if (this.sink?.trackBatch) {
      await this.sink.trackBatch(events);
    } else if (this.sink?.track) {
      for (const event of events) {
        await this.sink.track(event);
      }
    }

    this.events.splice(0, events.length);
  }
}

/**
 * ============================================================
 * SINGLETON
 * ============================================================
 */

export const homeAnalyticsService = new HomeAnalyticsService();

/**
 * Export par défaut.
 */
export default HomeAnalyticsService;
