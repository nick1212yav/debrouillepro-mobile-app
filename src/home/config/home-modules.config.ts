import type { ModuleId } from "@/config/modules/moduleRegistry";
import { MODULE_REGISTRY } from "@/config/modules/moduleRegistry";

/**
 * ============================================================
 * DÉBROUILLEPRO — HOME MODULE CONFIGURATION
 * ============================================================
 *
 * Home ne possède pas la définition complète des modules.
 *
 * Le fichier :
 *
 *   @/config/modules/moduleRegistry
 *
 * est la source de vérité.
 *
 * Home ne fait qu'exposer les modules compatibles avec Home.
 * ============================================================
 */

/**
 * Modules activés dans Home.
 */
export const HOME_MODULE_IDS: ModuleId[] = [
  "community",
  "network",
  "boutique",
  "services",
  "jobs",
  "health",
  "justice",
  "city",
  "voyages",
  "annonces",
  "pay",
  "education",
  "live",
];

/**
 * Modules possédant un feed exploitable par Home.
 */
export const HOME_FEED_MODULE_IDS: ModuleId[] = HOME_MODULE_IDS.filter(
  (moduleId) => {
    const module = MODULE_REGISTRY[moduleId];

    return Boolean(module?.hasFeed);
  },
);

/**
 * Modules compatibles avec les fonctionnalités
 * géolocalisées / nearby.
 */
export const HOME_NEARBY_MODULE_IDS: ModuleId[] = HOME_MODULE_IDS.filter(
  (moduleId) => {
    const module = MODULE_REGISTRY[moduleId];

    return Boolean(module?.capabilities?.nearby);
  },
);

/**
 * Modules pouvant produire des opportunités.
 */
export const HOME_OPPORTUNITY_MODULE_IDS: ModuleId[] = HOME_MODULE_IDS.filter(
  (moduleId) => {
    const module = MODULE_REGISTRY[moduleId];

    return Boolean(module?.capabilities?.opportunities);
  },
);

/**
 * Modules affichables sur Home.
 */
export const HOME_ENABLED_MODULE_IDS: ModuleId[] = HOME_MODULE_IDS.filter(
  (moduleId) => {
    const module = MODULE_REGISTRY[moduleId];

    return Boolean(module?.home?.enabled);
  },
);

/**
 * Priorités Home provenant du registry.
 *
 * Plus la valeur est élevée, plus le module est prioritaire.
 */
export const HOME_MODULE_PRIORITIES: Partial<Record<ModuleId, number>> =
  HOME_MODULE_IDS.reduce(
    (result, moduleId) => {
      const module = MODULE_REGISTRY[moduleId];

      if (module?.home?.enabled) {
        result[moduleId] = module.home.priority;
      }

      return result;
    },
    {} as Partial<Record<ModuleId, number>>,
  );

/**
 * Retourne la définition d'un module.
 */
export function getHomeModuleDefinition(moduleId: ModuleId) {
  return MODULE_REGISTRY[moduleId];
}

/**
 * Vérifie si un module est activé dans Home.
 */
export function isHomeModuleEnabled(moduleId: ModuleId): boolean {
  return HOME_ENABLED_MODULE_IDS.includes(moduleId);
}

/**
 * Vérifie si un module possède un feed.
 */
export function homeModuleHasFeed(moduleId: ModuleId): boolean {
  return HOME_FEED_MODULE_IDS.includes(moduleId);
}

/**
 * Vérifie si un module supporte Nearby.
 */
export function homeModuleSupportsNearby(moduleId: ModuleId): boolean {
  return HOME_NEARBY_MODULE_IDS.includes(moduleId);
}

/**
 * Vérifie si un module peut fournir des opportunités.
 */
export function homeModuleSupportsOpportunities(moduleId: ModuleId): boolean {
  return HOME_OPPORTUNITY_MODULE_IDS.includes(moduleId);
}

/**
 * Retourne tous les modules Home triés par priorité.
 */
export function getHomeModulesByPriority(): ModuleId[] {
  return [...HOME_ENABLED_MODULE_IDS].sort(
    (a, b) =>
      (HOME_MODULE_PRIORITIES[b] ?? 0) - (HOME_MODULE_PRIORITIES[a] ?? 0),
  );
}

/**
 * Retourne les modules compatibles avec Nearby.
 */
export function getHomeNearbyModules(): ModuleId[] {
  return [...HOME_NEARBY_MODULE_IDS].sort(
    (a, b) =>
      (HOME_MODULE_PRIORITIES[b] ?? 0) - (HOME_MODULE_PRIORITIES[a] ?? 0),
  );
}

/**
 * Retourne les modules compatibles avec le feed.
 */
export function getHomeFeedModules(): ModuleId[] {
  return [...HOME_FEED_MODULE_IDS].sort(
    (a, b) =>
      (HOME_MODULE_PRIORITIES[b] ?? 0) - (HOME_MODULE_PRIORITIES[a] ?? 0),
  );
}
