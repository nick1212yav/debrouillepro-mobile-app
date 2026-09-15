// convex/moduleRegistry.ts

/**
 * ============================================================
 * DÉBROUILLEPRO — BACKEND MODULE REGISTRY
 * ============================================================
 *
 * Registry backend des modules.
 *
 * IMPORTANT :
 * - aucune dépendance React
 * - aucune dépendance UI
 * - aucune dépendance src/
 * - aucune icône
 * - aucune animation
 *
 * Le backend utilise uniquement les informations nécessaires
 * à la validation, au Home Engine, aux recommandations,
 * aux opportunités et aux fonctionnalités contextuelles.
 * ============================================================
 */

// ============================================================
// TYPES
// ============================================================

export type BackendModuleDefinition = {
  id: string;

  enabled: boolean;

  home: {
    enabled: boolean;
    priority: number;
  };

  capabilities: {
    feed: boolean;
    nearby: boolean;
    opportunities: boolean;
  };
};

// ============================================================
// REGISTRY
// ============================================================

export const MODULE_REGISTRY: Record<string, BackendModuleDefinition> = {
  community: {
    id: "community",

    enabled: true,

    home: {
      enabled: true,
      priority: 1,
    },

    capabilities: {
      feed: true,
      nearby: true,
      opportunities: false,
    },
  },

  network: {
    id: "network",

    enabled: true,

    home: {
      enabled: true,
      priority: 2,
    },

    capabilities: {
      feed: false,
      nearby: false,
      opportunities: true,
    },
  },

  boutique: {
    id: "boutique",

    enabled: true,

    home: {
      enabled: true,
      priority: 3,
    },

    capabilities: {
      feed: true,
      nearby: true,
      opportunities: true,
    },
  },

  services: {
    id: "services",

    enabled: true,

    home: {
      enabled: true,
      priority: 4,
    },

    capabilities: {
      feed: true,
      nearby: true,
      opportunities: true,
    },
  },

  jobs: {
    id: "jobs",

    enabled: true,

    home: {
      enabled: true,
      priority: 5,
    },

    capabilities: {
      feed: true,
      nearby: true,
      opportunities: true,
    },
  },

  health: {
    id: "health",

    enabled: true,

    home: {
      enabled: true,
      priority: 6,
    },

    capabilities: {
      feed: true,
      nearby: true,
      opportunities: false,
    },
  },

  justice: {
    id: "justice",

    enabled: true,

    home: {
      enabled: true,
      priority: 7,
    },

    capabilities: {
      feed: false,
      nearby: false,
      opportunities: false,
    },
  },

  city: {
    id: "city",

    enabled: true,

    home: {
      enabled: true,
      priority: 8,
    },

    capabilities: {
      feed: false,
      nearby: true,
      opportunities: true,
    },
  },

  voyages: {
    id: "voyages",

    enabled: true,

    home: {
      enabled: true,
      priority: 9,
    },

    capabilities: {
      feed: false,
      nearby: true,
      opportunities: true,
    },
  },

  annonces: {
    id: "annonces",

    enabled: true,

    home: {
      enabled: true,
      priority: 10,
    },

    capabilities: {
      feed: true,
      nearby: true,
      opportunities: true,
    },
  },

  pay: {
    id: "pay",

    enabled: true,

    home: {
      enabled: true,
      priority: 11,
    },

    capabilities: {
      feed: false,
      nearby: false,
      opportunities: false,
    },
  },

  education: {
    id: "education",

    enabled: true,

    home: {
      enabled: true,
      priority: 12,
    },

    capabilities: {
      feed: true,
      nearby: false,
      opportunities: true,
    },
  },

  live: {
    id: "live",

    enabled: true,

    home: {
      enabled: true,
      priority: 13,
    },

    capabilities: {
      feed: true,
      nearby: false,
      opportunities: false,
    },
  },
};

// ============================================================
// HELPERS
// ============================================================

export function getModule(moduleId: string): BackendModuleDefinition | null {
  return MODULE_REGISTRY[moduleId] ?? null;
}

// ============================================================

export function isModuleId(value: string): boolean {
  return Object.prototype.hasOwnProperty.call(MODULE_REGISTRY, value);
}

// ============================================================

export function getAllModules(): BackendModuleDefinition[] {
  return Object.values(MODULE_REGISTRY);
}

// ============================================================

export function getEnabledModules(): BackendModuleDefinition[] {
  return getAllModules().filter((module) => module.enabled);
}

// ============================================================

export function getHomeModules(): BackendModuleDefinition[] {
  return getEnabledModules()
    .filter((module) => module.home.enabled)
    .sort((a, b) => a.home.priority - b.home.priority);
}

// ============================================================

export function getFeedModules(): BackendModuleDefinition[] {
  return getEnabledModules().filter((module) => module.capabilities.feed);
}

// ============================================================

export function getNearbyModules(): BackendModuleDefinition[] {
  return getEnabledModules().filter((module) => module.capabilities.nearby);
}

// ============================================================

export function getOpportunityModules(): BackendModuleDefinition[] {
  return getEnabledModules().filter(
    (module) => module.capabilities.opportunities,
  );
}

// ============================================================

export function moduleSupportsNearby(moduleId: string): boolean {
  return getModule(moduleId)?.capabilities.nearby ?? false;
}

// ============================================================

export function moduleSupportsOpportunities(moduleId: string): boolean {
  return getModule(moduleId)?.capabilities.opportunities ?? false;
}

// ============================================================

export function moduleHasFeed(moduleId: string): boolean {
  return getModule(moduleId)?.capabilities.feed ?? false;
}
