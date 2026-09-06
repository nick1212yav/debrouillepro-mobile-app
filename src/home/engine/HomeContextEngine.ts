import type { HomeContext } from "../types/home-context.types";

import type { ModuleId } from "@/config/modules/moduleRegistry";

import { MODULE_REGISTRY } from "@/config/modules/moduleRegistry";

/**
 * ============================================================
 * DÉBROUILLEPRO
 * HomeContextEngine
 * ============================================================
 *
 * Construit le contexte nécessaire à la Home intelligente.
 *
 * Responsabilités :
 * - heure / période de la journée
 * - modules favoris
 * - catégories
 * - intérêts
 * - localisation éventuelle
 * - session
 *
 * IMPORTANT :
 * aucune dépendance externe obligatoire.
 * Cela permet :
 *
 * new HomeContextEngine()
 *
 * ============================================================
 */

export interface HomeContextEngineDependencies {
  now?: () => Date;

  getSessionId?: () => string | undefined;

  getLocation?: () =>
    | {
        latitude: number;
        longitude: number;
        city?: string;
        country?: string;
      }
    | undefined;
}

export interface BuildHomeContextInput {
  userId?: string;

  favoriteModules?: ModuleId[];

  modules?: ModuleId[];

  categories?: string[];

  interests?: string[];

  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };

  sessionId?: string;
}

type ContextRecord = Record<string, unknown>;

export class HomeContextEngine {
  private readonly deps: HomeContextEngineDependencies;

  constructor(deps: HomeContextEngineDependencies = {}) {
    this.deps = deps;
  }

  /**
   * Détermine la période de la journée.
   */
  getTimeOfDay(
    date: Date = this.deps.now?.() ?? new Date(),
  ): "morning" | "afternoon" | "evening" | "night" {
    const hour = date.getHours();

    if (hour >= 5 && hour < 12) {
      return "morning";
    }

    if (hour >= 12 && hour < 18) {
      return "afternoon";
    }

    if (hour >= 18 && hour < 23) {
      return "evening";
    }

    return "night";
  }

  /**
   * Construit le contexte Home.
   */
  buildContext(input: BuildHomeContextInput = {}): HomeContext {
    const date = this.deps.now?.() ?? new Date();

    const modules = input.modules ?? input.favoriteModules ?? [];

    const location = input.location ?? this.deps.getLocation?.();

    const sessionId = input.sessionId ?? this.deps.getSessionId?.();

    const context: ContextRecord = {
      userId: input.userId,

      modules,

      favoriteModules: input.favoriteModules ?? modules,

      categories: input.categories ?? [],

      interests: input.interests ?? [],

      location,

      sessionId,

      timeOfDay: this.getTimeOfDay(date),

      timestamp: date.getTime(),
    };

    return context as HomeContext;
  }

  /**
   * Alias utilisé par les services.
   */
  createContext(input: BuildHomeContextInput = {}): HomeContext {
    return this.buildContext(input);
  }

  /**
   * Retourne les modules actifs compatibles Home.
   */
  getAvailableModules(): ModuleId[] {
    return Object.values(MODULE_REGISTRY)
      .filter((module) => module.enabled && module.home.enabled)
      .map((module) => module.id as ModuleId);
  }

  /**
   * Vérifie si un module peut être utilisé
   * dans le contexte Home.
   */
  isModuleAvailable(moduleId: ModuleId): boolean {
    const module = MODULE_REGISTRY[moduleId];

    return Boolean(module && module.enabled && module.home.enabled);
  }
}

export default HomeContextEngine;
