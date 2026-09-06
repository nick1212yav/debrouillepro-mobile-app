import type { HomeContext } from "../types/home-context.types";

import type { HomePreferences } from "../types/home.types";

import type { ModuleId } from "@/config/modules/moduleRegistry";

import { MODULE_REGISTRY } from "@/config/modules/moduleRegistry";

/**
 * ============================================================
 * DÉBROUILLEPRO
 * HomePersonalizationEngine
 * ============================================================
 */

export interface PersonalizationOptions {
  limit?: number;
}

type RecordValue = Record<string, unknown>;

function toRecord(value: unknown): RecordValue {
  if (value !== null && typeof value === "object") {
    return value as RecordValue;
  }

  return {};
}

export class HomePersonalizationEngine {
  /**
   * Retourne les modules correspondant
   * aux préférences utilisateur.
   */
  personalizeModules(
    modules: ModuleId[],
    context?: HomeContext,
    preferences?: HomePreferences,
  ): ModuleId[] {
    const contextRecord = toRecord(context);

    const preferencesRecord = toRecord(preferences);

    const favoriteModules = Array.isArray(preferencesRecord.favoriteModules)
      ? preferencesRecord.favoriteModules
      : Array.isArray(contextRecord.favoriteModules)
        ? contextRecord.favoriteModules
        : [];

    const hiddenModules = Array.isArray(preferencesRecord.hiddenModules)
      ? preferencesRecord.hiddenModules
      : [];

    const favorites = new Set<string>(favoriteModules.map(String));

    const hidden = new Set<string>(hiddenModules.map(String));

    return [...modules]
      .filter((moduleId) => !hidden.has(String(moduleId)))
      .sort((a, b) => {
        const favoriteA = favorites.has(String(a)) ? 1 : 0;

        const favoriteB = favorites.has(String(b)) ? 1 : 0;

        if (favoriteA !== favoriteB) {
          return favoriteB - favoriteA;
        }

        const priorityA = MODULE_REGISTRY[a]?.home.priority ?? 0;

        const priorityB = MODULE_REGISTRY[b]?.home.priority ?? 0;

        return priorityB - priorityA;
      });
  }

  /**
   * Personnalise des items génériques.
   */
  personalizeItems<T>(
    items: T[],
    context?: HomeContext,
    preferences?: HomePreferences,
    options: PersonalizationOptions = {},
  ): T[] {
    const contextRecord = toRecord(context);

    const preferencesRecord = toRecord(preferences);

    const interests = new Set(
      (Array.isArray(preferencesRecord.interests)
        ? preferencesRecord.interests
        : Array.isArray(contextRecord.interests)
          ? contextRecord.interests
          : []
      ).map(String),
    );

    const favoriteModules = new Set(
      (Array.isArray(preferencesRecord.favoriteModules)
        ? preferencesRecord.favoriteModules
        : []
      ).map(String),
    );

    const scored = items.map((item) => {
      const value = toRecord(item);

      const moduleId = String(value.moduleId ?? "");

      const category = String(value.category ?? "");

      let boost = 0;

      if (moduleId && favoriteModules.has(moduleId)) {
        boost += 3;
      }

      if (category && interests.has(category)) {
        boost += 2;
      }

      return {
        item,
        boost,
      };
    });

    scored.sort((a, b) => b.boost - a.boost);

    const result = scored.map(({ item }) => item);

    return options.limit ? result.slice(0, options.limit) : result;
  }

  /**
   * Alias pratique.
   */
  personalize<T>(
    items: T[],
    context?: HomeContext,
    preferences?: HomePreferences,
    options: PersonalizationOptions = {},
  ): T[] {
    return this.personalizeItems(items, context, preferences, options);
  }
}

export default HomePersonalizationEngine;
