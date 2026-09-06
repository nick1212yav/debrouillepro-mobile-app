import { HomePersonalizationEngine } from "../engine/HomePersonalizationEngine";

import type { HomeContext } from "../types/home-context.types";

import type { HomePreferences } from "../types/home.types";

/**
 * ============================================================
 * DÉBROUILLEPRO — HomePersonalizationService
 * ============================================================
 *
 * Couche métier de personnalisation de la Home.
 *
 * Responsabilités :
 * - préférences utilisateur
 * - modules favoris
 * - intérêts
 * - catégories
 * - ordre personnalisé
 * - sections masquées
 *
 * IMPORTANT :
 * - aucune logique de ranking ici
 * - aucune logique de routing ici
 * - aucune logique Convex ici
 * - la logique de personnalisation est déléguée
 *   à HomePersonalizationEngine
 *
 * Architecture :
 *
 * Home UI / Hooks
 *       ↓
 * HomePersonalizationService
 *       ↓
 * HomePersonalizationEngine
 *       ↓
 * Personalized data
 *
 * ============================================================
 */

/**
 * Dépendances injectables.
 */
export interface HomePersonalizationServiceDependencies {
  engine?: HomePersonalizationEngine;
}

/**
 * Options de personnalisation.
 */
export interface PersonalizeOptions {
  /**
   * Nombre maximum d'éléments à retourner.
   */
  limit?: number;
}

/**
 * ============================================================
 * SERVICE
 * ============================================================
 */

export class HomePersonalizationService {
  /**
   * Moteur de personnalisation.
   */
  readonly engine: HomePersonalizationEngine;

  /**
   * ==========================================================
   * CONSTRUCTOR
   * ==========================================================
   */
  constructor(deps: HomePersonalizationServiceDependencies = {}) {
    this.engine = deps.engine ?? new HomePersonalizationEngine();
  }

  /**
   * ==========================================================
   * PERSONALIZE
   * ==========================================================
   *
   * Personnalise une liste générique.
   *
   * La logique métier reste entièrement dans
   * HomePersonalizationEngine.
   */
  personalize<T>(
    items: T[],
    context?: HomeContext,
    preferences?: HomePreferences,
    options: PersonalizeOptions = {},
  ): T[] {
    return this.engine.personalizeItems(items, context, preferences, options);
  }

  /**
   * ==========================================================
   * PERSONALIZE ITEMS
   * ==========================================================
   *
   * Alias explicite conservé pour compatibilité.
   */
  personalizeItems<T>(
    items: T[],
    context?: HomeContext,
    preferences?: HomePreferences,
    options: PersonalizeOptions = {},
  ): T[] {
    return this.personalize(items, context, preferences, options);
  }

  /**
   * ==========================================================
   * PERSONALIZE MODULES
   * ==========================================================
   *
   * Personnalise une liste de modules.
   *
   * Le service ne connaît pas directement la registry.
   * Cette responsabilité reste dans
   * HomePersonalizationEngine.
   */
  personalizeModules<T extends string = string>(
    modules: T[],
    context?: HomeContext,
    preferences?: HomePreferences,
  ): T[] {
    return this.engine.personalizeModules(
      modules as never,
      context,
      preferences,
    ) as T[];
  }

  /**
   * ==========================================================
   * APPLY PREFERENCES
   * ==========================================================
   *
   * Applique les préférences à une liste déjà récupérée.
   *
   * Utilise volontairement personalize() afin de conserver
   * un seul point d'entrée métier dans le service.
   */
  applyPreferences<T>(
    items: T[],
    preferences?: HomePreferences,
    context?: HomeContext,
  ): T[] {
    return this.personalize(items, context, preferences);
  }

  /**
   * ==========================================================
   * DEFAULT PREFERENCES
   * ==========================================================
   *
   * Retourne les préférences neutres de la Home.
   *
   * IMPORTANT :
   * categories et interests sont obligatoires dans
   * HomePreferences.
   */
  getDefaultPreferences(): HomePreferences {
    return {
      /**
       * Modules favoris.
       */
      favoriteModules: [],

      /**
       * Catégories préférées.
       */
      categories: [],

      /**
       * Centres d'intérêt.
       */
      interests: [],

      /**
       * Sections masquées.
       */
      hiddenSections: [],

      /**
       * Ordre personnalisé des sections.
       */
      customSectionOrder: [],

      /**
       * Préférences de notifications.
       */
      notificationPreferences: {
        newRecommendations: true,
        nearbyAlerts: true,
        opportunities: true,
      },
    };
  }
}

/**
 * ============================================================
 * SINGLETON
 * ============================================================
 *
 * Instance partagée du service.
 */
export const homePersonalizationService = new HomePersonalizationService();

/**
 * Export par défaut.
 */
export default HomePersonalizationService;
