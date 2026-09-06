// src/config/modules/moduleRegistry.ts

import type {
  ModuleDefinition,
  ModuleFilter,
  ModuleId,
  ModuleOption,
  ModuleRegistry,
} from "./module.types";

// Public type re-export: keeps module.types as the canonical source of ModuleId
// while allowing Home/UI code to import ModuleId from the registry.
export type { ModuleId } from "./module.types";

import {
  MODULE_CATEGORIES,
  MODULE_HOME_PRIORITIES,
  MODULE_ICONS,
  MODULE_LABELS,
  MODULE_PUBLICATION_TYPES,
  MODULE_ROUTES,
  MODULE_SHORT_LABELS,
  MODULES_WITH_FEED,
  MODULES_WITH_NEARBY,
  MODULES_WITH_OPPORTUNITIES,
} from "./module.constants";

// ============================================================
// DÉBROUILLEPRO — MODULE REGISTRY
// ============================================================
//
// SOURCE DE VÉRITÉ CENTRALE DU FRONTEND.
//
// Aucun moteur Home ne doit redéfinir les modules.
//
// Le Registry contient uniquement la configuration métier/UI
// des modules.
//
// Le backend possède son propre registry backend dans :
//
// convex/moduleRegistry.ts
//
// ============================================================

/**
 * Création interne d'une définition de module.
 *
 * Cette fonction permet de garder une construction uniforme
 * et facilite l'évolution future du registry.
 */
function createModule(definition: ModuleDefinition): ModuleDefinition {
  return definition;
}

// ============================================================
// REGISTRY PRINCIPAL
// ============================================================

export const MODULE_REGISTRY: ModuleRegistry = {
  // ==========================================================
  // COMMUNITY
  // ==========================================================

  community: createModule({
    id: "community",

    label: MODULE_LABELS.community,

    shortLabel: MODULE_SHORT_LABELS.community,

    description:
      "Communauté DébrouillePro pour échanger, publier et découvrir la vie locale.",

    icon: MODULE_ICONS.community,

    route: MODULE_ROUTES.community,

    category: MODULE_CATEGORIES.community,

    enabled: true,

    hasFeed: true,

    capabilities: {
      feed: true,
      nearby: true,
      opportunities: false,
      details: true,
      creation: true,
      recommendations: true,
      notifications: true,
      location: true,
      search: true,
    },

    home: {
      enabled: true,
      priority: MODULE_HOME_PRIORITIES.community,
      showInSuggestions: true,
      showInQuickActions: true,
    },

    publicationTypes: [...MODULE_PUBLICATION_TYPES.community],
  }),

  // ==========================================================
  // NETWORK
  // ==========================================================

  network: createModule({
    id: "network",

    label: MODULE_LABELS.network,

    shortLabel: MODULE_SHORT_LABELS.network,

    description:
      "Réseau professionnel et social pour créer des connexions utiles.",

    icon: MODULE_ICONS.network,

    route: MODULE_ROUTES.network,

    category: MODULE_CATEGORIES.network,

    enabled: true,

    hasFeed: false,

    capabilities: {
      feed: false,
      nearby: false,
      opportunities: true,
      details: true,
      creation: true,
      recommendations: true,
      notifications: true,
      location: false,
      search: true,
    },

    home: {
      enabled: true,
      priority: MODULE_HOME_PRIORITIES.network,
      showInSuggestions: true,
      showInQuickActions: true,
    },

    publicationTypes: [...MODULE_PUBLICATION_TYPES.network],
  }),

  // ==========================================================
  // BOUTIQUE
  // ==========================================================

  boutique: createModule({
    id: "boutique",

    label: MODULE_LABELS.boutique,

    shortLabel: MODULE_SHORT_LABELS.boutique,

    description: "Marketplace pour acheter, vendre et découvrir des produits.",

    icon: MODULE_ICONS.boutique,

    route: MODULE_ROUTES.boutique,

    category: MODULE_CATEGORIES.boutique,

    enabled: true,

    hasFeed: true,

    capabilities: {
      feed: true,
      nearby: true,
      opportunities: true,
      details: true,
      creation: true,
      recommendations: true,
      notifications: true,
      location: true,
      search: true,
    },

    home: {
      enabled: true,
      priority: MODULE_HOME_PRIORITIES.boutique,
      showInSuggestions: true,
      showInQuickActions: true,
    },

    publicationTypes: [...MODULE_PUBLICATION_TYPES.boutique],

    detailRoute: "/marketplace/:id",

    createRoute: "/marketplace/create",
  }),

  // ==========================================================
  // SERVICES
  // ==========================================================

  services: createModule({
    id: "services",

    label: MODULE_LABELS.services,

    shortLabel: MODULE_SHORT_LABELS.services,

    description:
      "Trouver et proposer des services et compétences près de chez soi.",

    icon: MODULE_ICONS.services,

    route: MODULE_ROUTES.services,

    category: MODULE_CATEGORIES.services,

    enabled: true,

    hasFeed: true,

    capabilities: {
      feed: true,
      nearby: true,
      opportunities: true,
      details: true,
      creation: true,
      recommendations: true,
      notifications: true,
      location: true,
      search: true,
    },

    home: {
      enabled: true,
      priority: MODULE_HOME_PRIORITIES.services,
      showInSuggestions: true,
      showInQuickActions: true,
    },

    publicationTypes: [...MODULE_PUBLICATION_TYPES.services],

    detailRoute: "/services/:id",

    createRoute: "/services/create",
  }),

  // ==========================================================
  // JOBS
  // ==========================================================

  jobs: createModule({
    id: "jobs",

    label: MODULE_LABELS.jobs,

    shortLabel: MODULE_SHORT_LABELS.jobs,

    description: "Emplois, missions et opportunités professionnelles.",

    icon: MODULE_ICONS.jobs,

    route: MODULE_ROUTES.jobs,

    category: MODULE_CATEGORIES.jobs,

    enabled: true,

    hasFeed: true,

    capabilities: {
      feed: true,
      nearby: true,
      opportunities: true,
      details: true,
      creation: true,
      recommendations: true,
      notifications: true,
      location: true,
      search: true,
    },

    home: {
      enabled: true,
      priority: MODULE_HOME_PRIORITIES.jobs,
      showInSuggestions: true,
      showInQuickActions: true,
    },

    publicationTypes: [...MODULE_PUBLICATION_TYPES.jobs],

    detailRoute: "/jobs/:id",

    createRoute: "/jobs/create",
  }),

  // ==========================================================
  // HEALTH
  // ==========================================================

  health: createModule({
    id: "health",

    label: MODULE_LABELS.health,

    shortLabel: MODULE_SHORT_LABELS.health,

    description: "Services, informations et ressources de santé.",

    icon: MODULE_ICONS.health,

    route: MODULE_ROUTES.health,

    category: MODULE_CATEGORIES.health,

    enabled: true,

    hasFeed: true,

    capabilities: {
      feed: true,
      nearby: true,
      opportunities: false,
      details: true,
      creation: false,
      recommendations: true,
      notifications: true,
      location: true,
      search: true,
    },

    home: {
      enabled: true,
      priority: MODULE_HOME_PRIORITIES.health,
      showInSuggestions: true,
      showInQuickActions: true,
    },

    publicationTypes: [...MODULE_PUBLICATION_TYPES.health],
  }),

  // ==========================================================
  // JUSTICE
  // ==========================================================

  justice: createModule({
    id: "justice",

    label: MODULE_LABELS.justice,

    shortLabel: MODULE_SHORT_LABELS.justice,

    description: "Informations et services liés à la justice et aux droits.",

    icon: MODULE_ICONS.justice,

    route: MODULE_ROUTES.justice,

    category: MODULE_CATEGORIES.justice,

    enabled: true,

    hasFeed: false,

    capabilities: {
      feed: false,
      nearby: false,
      opportunities: false,
      details: true,
      creation: false,
      recommendations: true,
      notifications: true,
      location: false,
      search: true,
    },

    home: {
      enabled: true,
      priority: MODULE_HOME_PRIORITIES.justice,
      showInSuggestions: true,
      showInQuickActions: false,
    },

    publicationTypes: [...MODULE_PUBLICATION_TYPES.justice],
  }),

  // ==========================================================
  // CITY
  // ==========================================================

  city: createModule({
    id: "city",

    label: MODULE_LABELS.city,

    shortLabel: MODULE_SHORT_LABELS.city,

    description: "Ville, habitat, aménagement et services urbains.",

    icon: MODULE_ICONS.city,

    route: MODULE_ROUTES.city,

    category: MODULE_CATEGORIES.city,

    enabled: true,

    hasFeed: false,

    capabilities: {
      feed: false,
      nearby: true,
      opportunities: true,
      details: true,
      creation: true,
      recommendations: true,
      notifications: true,
      location: true,
      search: true,
    },

    home: {
      enabled: true,
      priority: MODULE_HOME_PRIORITIES.city,
      showInSuggestions: true,
      showInQuickActions: true,
    },

    publicationTypes: [...MODULE_PUBLICATION_TYPES.city],
  }),

  // ==========================================================
  // VOYAGES
  // ==========================================================

  voyages: createModule({
    id: "voyages",

    label: MODULE_LABELS.voyages,

    shortLabel: MODULE_SHORT_LABELS.voyages,

    description: "Voyages, destinations, hébergements et découverte.",

    icon: MODULE_ICONS.voyages,

    route: MODULE_ROUTES.voyages,

    category: MODULE_CATEGORIES.voyages,

    enabled: true,

    hasFeed: false,

    capabilities: {
      feed: false,
      nearby: true,
      opportunities: true,
      details: true,
      creation: true,
      recommendations: true,
      notifications: true,
      location: true,
      search: true,
    },

    home: {
      enabled: true,
      priority: MODULE_HOME_PRIORITIES.voyages,
      showInSuggestions: true,
      showInQuickActions: false,
    },

    publicationTypes: [...MODULE_PUBLICATION_TYPES.voyages],
  }),

  // ==========================================================
  // ANNONCES
  // ==========================================================

  annonces: createModule({
    id: "annonces",

    label: MODULE_LABELS.annonces,

    shortLabel: MODULE_SHORT_LABELS.annonces,

    description: "Petites annonces et opportunités locales.",

    icon: MODULE_ICONS.annonces,

    route: MODULE_ROUTES.annonces,

    category: MODULE_CATEGORIES.annonces,

    enabled: true,

    hasFeed: true,

    capabilities: {
      feed: true,
      nearby: true,
      opportunities: true,
      details: true,
      creation: true,
      recommendations: true,
      notifications: true,
      location: true,
      search: true,
    },

    home: {
      enabled: true,
      priority: MODULE_HOME_PRIORITIES.annonces,
      showInSuggestions: true,
      showInQuickActions: true,
    },

    publicationTypes: [...MODULE_PUBLICATION_TYPES.annonces],

    detailRoute: "/annonces/:id",

    createRoute: "/annonces/create",
  }),

  // ==========================================================
  // PAY
  // ==========================================================

  pay: createModule({
    id: "pay",

    label: MODULE_LABELS.pay,

    shortLabel: MODULE_SHORT_LABELS.pay,

    description: "Portefeuille et services financiers DébrouillePay.",

    icon: MODULE_ICONS.pay,

    route: MODULE_ROUTES.pay,

    category: MODULE_CATEGORIES.pay,

    enabled: true,

    hasFeed: false,

    capabilities: {
      feed: false,
      nearby: false,
      opportunities: false,
      details: true,
      creation: false,
      recommendations: true,
      notifications: true,
      location: false,
      search: false,
    },

    home: {
      enabled: true,
      priority: MODULE_HOME_PRIORITIES.pay,
      showInSuggestions: true,
      showInQuickActions: true,
    },

    publicationTypes: [...MODULE_PUBLICATION_TYPES.pay],
  }),

  // ==========================================================
  // EDUCATION
  // ==========================================================

  education: createModule({
    id: "education",

    label: MODULE_LABELS.education,

    shortLabel: MODULE_SHORT_LABELS.education,

    description: "Apprentissage, cours, formation et éducation.",

    icon: MODULE_ICONS.education,

    route: MODULE_ROUTES.education,

    category: MODULE_CATEGORIES.education,

    enabled: true,

    hasFeed: true,

    capabilities: {
      feed: true,
      nearby: false,
      opportunities: true,
      details: true,
      creation: true,
      recommendations: true,
      notifications: true,
      location: false,
      search: true,
    },

    home: {
      enabled: true,
      priority: MODULE_HOME_PRIORITIES.education,
      showInSuggestions: true,
      showInQuickActions: true,
    },

    publicationTypes: [...MODULE_PUBLICATION_TYPES.education],
  }),

  // ==========================================================
  // LIVE
  // ==========================================================

  live: createModule({
    id: "live",

    label: MODULE_LABELS.live,

    shortLabel: MODULE_SHORT_LABELS.live,

    description: "Live, streaming, événements et contenus en direct.",

    icon: MODULE_ICONS.live,

    route: MODULE_ROUTES.live,

    category: MODULE_CATEGORIES.live,

    enabled: true,

    hasFeed: true,

    capabilities: {
      feed: true,
      nearby: false,
      opportunities: false,
      details: true,
      creation: true,
      recommendations: true,
      notifications: true,
      location: false,
      search: true,
    },

    home: {
      enabled: true,
      priority: MODULE_HOME_PRIORITIES.live,
      showInSuggestions: true,
      showInQuickActions: true,
    },

    publicationTypes: [...MODULE_PUBLICATION_TYPES.live],
  }),
};

// ============================================================
// HELPERS
// ============================================================

/**
 * Récupère un module par son ID.
 */
export function getModule(moduleId: ModuleId): ModuleDefinition {
  return MODULE_REGISTRY[moduleId];
}

/**
 * Vérifie qu'un identifiant correspond à un module.
 */
export function isModuleId(value: string): value is ModuleId {
  return Object.prototype.hasOwnProperty.call(MODULE_REGISTRY, value);
}

/**
 * Retourne tous les modules.
 */
export function getAllModules(): ModuleDefinition[] {
  return Object.values(MODULE_REGISTRY);
}

/**
 * Retourne les modules activés.
 */
export function getEnabledModules(): ModuleDefinition[] {
  return getAllModules().filter((module) => module.enabled);
}

/**
 * Retourne les modules visibles dans Home.
 *
 * IMPORTANT :
 * priorité croissante = affichage prioritaire.
 */
export function getHomeModules(): ModuleDefinition[] {
  return getEnabledModules()
    .filter((module) => module.home.enabled)
    .sort((a, b) => a.home.priority - b.home.priority);
}

/**
 * Retourne les modules possédant un feed.
 */
export function getFeedModules(): ModuleDefinition[] {
  return getEnabledModules().filter((module) => module.hasFeed);
}

/**
 * Retourne les modules compatibles Nearby.
 */
export function getNearbyModules(): ModuleDefinition[] {
  return getEnabledModules().filter(
    (module) => module.capabilities.nearby === true,
  );
}

/**
 * Retourne les modules compatibles Opportunities.
 */
export function getOpportunityModules(): ModuleDefinition[] {
  return getEnabledModules().filter(
    (module) => module.capabilities.opportunities === true,
  );
}

/**
 * Recherche avancée de modules.
 */
export function findModules(filter: ModuleFilter): ModuleDefinition[] {
  return getAllModules().filter((module) => {
    if (filter.category && module.category !== filter.category) {
      return false;
    }

    if (filter.enabled !== undefined && module.enabled !== filter.enabled) {
      return false;
    }

    if (filter.hasFeed !== undefined && module.hasFeed !== filter.hasFeed) {
      return false;
    }

    if (
      filter.nearby !== undefined &&
      module.capabilities.nearby !== filter.nearby
    ) {
      return false;
    }

    if (
      filter.opportunities !== undefined &&
      module.capabilities.opportunities !== filter.opportunities
    ) {
      return false;
    }

    if (
      filter.homeEnabled !== undefined &&
      module.home.enabled !== filter.homeEnabled
    ) {
      return false;
    }

    return true;
  });
}

/**
 * Retourne une représentation légère
 * destinée aux composants UI.
 */
export function getModuleOption(moduleId: ModuleId): ModuleOption {
  const module = getModule(moduleId);

  return {
    id: module.id,

    label: module.label,

    shortLabel: module.shortLabel,

    icon: module.icon,

    route: module.route,

    priority: module.home.priority,
  };
}

/**
 * Retourne toutes les options UI Home.
 */
export function getModuleOptions(): ModuleOption[] {
  return getHomeModules().map((module) => getModuleOption(module.id));
}

/**
 * Retourne les modules d'une catégorie.
 */
export function getModulesByCategory(
  category: ModuleDefinition["category"],
): ModuleDefinition[] {
  return getAllModules().filter((module) => module.category === category);
}

/**
 * Vérifie si un module possède un feed.
 */
export function moduleHasFeed(moduleId: ModuleId): boolean {
  return MODULES_WITH_FEED.includes(
    moduleId as (typeof MODULES_WITH_FEED)[number],
  );
}

/**
 * Vérifie si un module est compatible Nearby.
 */
export function moduleSupportsNearby(moduleId: ModuleId): boolean {
  return MODULES_WITH_NEARBY.includes(
    moduleId as (typeof MODULES_WITH_NEARBY)[number],
  );
}

/**
 * Vérifie si un module est compatible Opportunities.
 */
export function moduleSupportsOpportunities(moduleId: ModuleId): boolean {
  return MODULES_WITH_OPPORTUNITIES.includes(
    moduleId as (typeof MODULES_WITH_OPPORTUNITIES)[number],
  );
}

/**
 * Retourne les types de publications
 * associés à un module.
 *
 * Une copie est retournée afin d'éviter
 * toute mutation accidentelle du registry.
 */
export function getModulePublicationTypes(moduleId: ModuleId): string[] {
  return [...(MODULE_REGISTRY[moduleId].publicationTypes ?? [])];
}

/**
 * Retourne la priorité Home.
 */
export function getModuleHomePriority(moduleId: ModuleId): number {
  return MODULE_REGISTRY[moduleId].home.priority;
}

/**
 * Retourne la route principale.
 */
export function getModuleRoute(moduleId: ModuleId): string {
  return MODULE_REGISTRY[moduleId].route;
}

/**
 * Retourne le label.
 */
export function getModuleLabel(moduleId: ModuleId): string {
  return MODULE_REGISTRY[moduleId].label;
}

/**
 * Retourne l'icône.
 */
export function getModuleIcon(moduleId: ModuleId): string {
  return MODULE_REGISTRY[moduleId].icon;
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default MODULE_REGISTRY;
