// convex/homeIntelligence.ts

import { query } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  buildHomeData,
  getHomeModulesFromData,
  type HomeData,
} from "./homeBuilder";

// ============================================================
// DÉBROUILLEPRO — HOME INTELLIGENCE ENGINE
// ============================================================
//
// Le cerveau décisionnel de la Home.
//
// IMPORTANT
// ---------
// Ce fichier ne possède PAS sa propre source de vérité métier.
// Il orchestre les données déjà produites par Home / Feed /
// Activity et les transforme en signaux intelligents.
//
// Architecture:
//
//   HOME DATA
//      │
//      ├── contexte
//      ├── préférences
//      ├── modules
//      └── feed
//             │
//             ▼
//      HOME INTELLIGENCE
//             │
//      ┌──────┼────────┬────────┬────────┐
//      ▼      ▼        ▼        ▼        ▼
//   Context  Radar   Nearby   Brief   Pulse
//      │
//      └────────── Command Center ──────────┘
//
// ============================================================

// ============================================================
// TYPES
// ============================================================

type IntelligencePriority = "critical" | "high" | "medium" | "low";

type IntelligenceKind =
  | "context"
  | "opportunity"
  | "nearby"
  | "brief"
  | "activity"
  | "action";

interface IntelligenceItem {
  id: string;
  kind: IntelligenceKind;

  title: string;
  description: string;

  moduleId?: string;
  route?: string;

  priority: IntelligencePriority;

  score: number;

  icon?: string;

  reason?: string;

  actionLabel?: string;

  expiresAt?: number;
}

interface ActivitySignal {
  id: string;
  type: string;
  label: string;
  timestamp: number;
  moduleId?: string;
}

interface IntelligenceMetrics {
  contextScore: number;
  opportunityScore: number;
  nearbyScore: number;
  engagementScore: number;
  personalizationScore: number;
  overallScore: number;
}

// ============================================================
// CONSTANTES
// ============================================================

const MAX_CONTEXT_SUGGESTIONS = 5;
const MAX_OPPORTUNITIES = 6;
const MAX_NEARBY = 6;
const MAX_ACTIVITY = 8;

const DAY = 24 * 60 * 60 * 1000;

const MODULE_FALLBACK_LABELS: Record<string, string> = {
  community: "Communauté",
  network: "Réseau",
  boutique: "Boutique",
  services: "Services",
  jobs: "Emplois",
  health: "Santé",
  justice: "Justice",
  city: "Ville",
  voyages: "Voyages",
  annonces: "Annonces",
  pay: "Paiement",
  education: "Éducation",
  live: "Live",
};

// ============================================================
// HELPERS GÉNÉRAUX
// ============================================================

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function moduleLabel(module: {
  id: string;
  label?: string;
  shortLabel?: string;
}): string {
  return (
    normalizeString(module.label) ||
    normalizeString(module.shortLabel) ||
    MODULE_FALLBACK_LABELS[module.id] ||
    module.id
  );
}

function priorityFromScore(score: number): IntelligencePriority {
  if (score >= 90) return "critical";
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
}

function safeArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function getFeedItems(feed: unknown): any[] {
  if (!feed) {
    return [];
  }

  if (Array.isArray(feed)) {
    return feed;
  }

  if (typeof feed === "object" && feed !== null) {
    const candidate = feed as {
      page?: unknown;
      results?: unknown;
      items?: unknown;
    };

    if (Array.isArray(candidate.page)) {
      return candidate.page;
    }

    if (Array.isArray(candidate.results)) {
      return candidate.results;
    }

    if (Array.isArray(candidate.items)) {
      return candidate.items;
    }
  }

  return [];
}

// ============================================================
// ACTIVITÉ
// ============================================================

async function getRecentActivity(
  ctx: any,
  email: string,
): Promise<ActivitySignal[]> {
  try {
    const activities = await ctx.runQuery(api.activity.list, {});

    return safeArray(activities)
      .slice(0, MAX_ACTIVITY)
      .map((activity: any, index: number) => ({
        id: normalizeString(activity?._id) || `activity-${index}`,

        type:
          normalizeString(activity?.type) ||
          normalizeString(activity?.action) ||
          "activity",

        label:
          normalizeString(activity?.label) ||
          normalizeString(activity?.description) ||
          "Activité récente",

        timestamp:
          typeof activity?.createdAt === "number"
            ? activity.createdAt
            : typeof activity?.timestamp === "number"
              ? activity.timestamp
              : Date.now(),

        moduleId: normalizeString(activity?.moduleId) || undefined,
      }));
  } catch {
    // L'intelligence Home doit rester
    // fonctionnelle même si Activity
    // n'est momentanément pas disponible.
    return [];
  }
}

// ============================================================
// SCORE DE PERSONNALISATION
// ============================================================

function calculatePersonalizationScore(
  prefs: any,
  modules: any[],
  feedItems: any[],
  activity: ActivitySignal[],
): number {
  let score = 20;

  if (
    prefs &&
    Array.isArray(prefs.favoriteModules) &&
    prefs.favoriteModules.length > 0
  ) {
    score += 20;
  }

  if (
    prefs &&
    Array.isArray(prefs.customSectionOrder) &&
    prefs.customSectionOrder.length > 0
  ) {
    score += 15;
  }

  if (
    prefs &&
    Array.isArray(prefs.hiddenSections) &&
    prefs.hiddenSections.length > 0
  ) {
    score += 5;
  }

  if (modules.length >= 5) {
    score += 15;
  }

  if (feedItems.length >= 5) {
    score += 15;
  }

  if (activity.length >= 3) {
    score += 10;
  }

  return clamp(score);
}

// ============================================================
// CONTEXT SUGGESTIONS
// ============================================================

function buildContextSuggestions(
  user: any,
  prefs: any,
  modules: any[],
  feedItems: any[],
): IntelligenceItem[] {
  const suggestions: IntelligenceItem[] = [];

  const favoriteModules = safeArray(prefs?.favoriteModules);

  // ----------------------------------------------------------
  // 1. Modules favoris
  // ----------------------------------------------------------

  for (const favoriteId of favoriteModules.slice(0, 3)) {
    const module = modules.find((item: any) => item.id === favoriteId);

    if (!module) {
      continue;
    }

    const label = moduleLabel(module);

    suggestions.push({
      id: `favorite-${favoriteId}`,

      kind: "context",

      title: `Votre espace ${label}`,

      description: `Retrouvez rapidement ce qui compte pour vous dans ${label}.`,

      moduleId: module.id,

      route: module.route,

      priority: "high",

      score: 88,

      icon: module.icon,

      reason: "Ce module fait partie de vos préférences.",

      actionLabel: `Ouvrir ${label}`,
    });
  }

  // ----------------------------------------------------------
  // 2. Module prioritaire
  // ----------------------------------------------------------

  const priorityModule = modules
    .filter((module: any) => module.home?.enabled !== false)
    .sort((a: any, b: any) => (a.priority ?? 999) - (b.priority ?? 999))[0];

  if (
    priorityModule &&
    !suggestions.some((item) => item.moduleId === priorityModule.id)
  ) {
    const label = moduleLabel(priorityModule);

    suggestions.push({
      id: `priority-${priorityModule.id}`,

      kind: "context",

      title: `À découvrir : ${label}`,

      description:
        "Une porte d'entrée naturelle vers votre expérience DébrouillePro.",

      moduleId: priorityModule.id,

      route: priorityModule.route,

      priority: "medium",

      score: 72,

      icon: priorityModule.icon,

      reason: "Module actuellement prioritaire dans votre Home.",

      actionLabel: "Découvrir",
    });
  }

  // ----------------------------------------------------------
  // 3. Feed actif
  // ----------------------------------------------------------

  const firstFeedItem = feedItems[0];

  if (firstFeedItem) {
    const moduleId = normalizeString(firstFeedItem.moduleId);

    const module = modules.find((item: any) => item.id === moduleId);

    if (module) {
      const label = moduleLabel(module);

      suggestions.push({
        id: `feed-context-${firstFeedItem._id ?? "first"}`,

        kind: "context",

        title: `Nouveau dans ${label}`,

        description:
          "Une nouveauté qui pourrait correspondre à vos centres d'intérêt.",

        moduleId: module.id,

        route: module.route,

        priority: "medium",

        score: 68,

        icon: module.icon,

        reason: "Détecté dans votre flux personnalisé.",

        actionLabel: "Voir",
      });
    }
  }

  return suggestions.slice(0, MAX_CONTEXT_SUGGESTIONS);
}

// ============================================================
// OPPORTUNITY RADAR
// ============================================================

function buildOpportunityRadar(
  modules: any[],
  feedItems: any[],
): IntelligenceItem[] {
  const opportunityModules = modules.filter(
    (module: any) => module.capabilities?.opportunities === true,
  );

  const result: IntelligenceItem[] = [];

  // ----------------------------------------------------------
  // Opportunités détectées dans le feed
  // ----------------------------------------------------------

  for (const item of feedItems) {
    const moduleId = normalizeString(item?.moduleId);

    const module = opportunityModules.find(
      (candidate: any) => candidate.id === moduleId,
    );

    if (!module) {
      continue;
    }

    const title =
      normalizeString(item?.title) ||
      normalizeString(item?.name) ||
      `Opportunité ${moduleLabel(module)}`;

    const description =
      normalizeString(item?.description) ||
      `Une nouvelle opportunité est disponible dans ${moduleLabel(module)}.`;

    result.push({
      id: `opportunity-${item?._id ?? result.length}`,

      kind: "opportunity",

      title,

      description,

      moduleId: module.id,

      route: normalizeString(item?.route) || module.route,

      priority: "high",

      score: clamp(78 + (item?.isBoosted ? 12 : 0)),

      icon: module.icon,

      reason: "Correspond à un domaine d'opportunité actif dans DébrouillePro.",

      actionLabel: "Voir l'opportunité",
    });

    if (result.length >= MAX_OPPORTUNITIES) {
      break;
    }
  }

  // ----------------------------------------------------------
  // Fallback : modules d'opportunité
  // ----------------------------------------------------------

  if (result.length === 0) {
    for (const module of opportunityModules.slice(0, MAX_OPPORTUNITIES)) {
      result.push({
        id: `opportunity-module-${module.id}`,

        kind: "opportunity",

        title: `Opportunités ${moduleLabel(module)}`,

        description: `Explorez les nouvelles possibilités dans ${moduleLabel(module)}.`,

        moduleId: module.id,

        route: module.route,

        priority: "medium",

        score: 62,

        icon: module.icon,

        reason: "Ce module propose des opportunités.",

        actionLabel: "Explorer",
      });
    }
  }

  return result;
}

// ============================================================
// NEARBY NOW
// ============================================================

function buildNearbyNow(modules: any[]): IntelligenceItem[] {
  return modules
    .filter((module: any) => module.capabilities?.nearby === true)
    .sort((a: any, b: any) => (a.priority ?? 999) - (b.priority ?? 999))
    .slice(0, MAX_NEARBY)
    .map((module: any, index: number) => ({
      id: `nearby-${module.id}`,

      kind: "nearby" as const,

      title: `${moduleLabel(module)} près de vous`,

      description: `Découvrez les services, activités et opportunités ${moduleLabel(module).toLowerCase()} autour de vous.`,

      moduleId: module.id,

      route: module.route,

      priority: index < 2 ? "high" : "medium",

      score: clamp(84 - index * 7),

      icon: module.icon,

      reason: "Le module est compatible avec les fonctionnalités de proximité.",

      actionLabel: "Explorer autour de moi",
    }));
}

// ============================================================
// DAILY BRIEF
// ============================================================

function buildDailyBrief(
  user: any,
  modules: any[],
  feedItems: any[],
  activity: ActivitySignal[],
): {
  greeting: string;
  headline: string;
  summary: string;
  highlights: IntelligenceItem[];
} {
  const hour = new Date().getHours();

  let greeting = "Bonjour";

  if (hour >= 12 && hour < 18) {
    greeting = "Bon après-midi";
  }

  if (hour >= 18) {
    greeting = "Bonsoir";
  }

  const name = normalizeString(user?.name);

  const displayName = name || "vous";

  const highlights: IntelligenceItem[] = [];

  // ----------------------------------------------------------
  // Activité récente
  // ----------------------------------------------------------

  if (activity.length > 0) {
    const recent = activity[0];

    highlights.push({
      id: `brief-activity-${recent.id}`,

      kind: "activity",

      title: "Votre activité récente",

      description: recent.label,

      moduleId: recent.moduleId,

      priority: "medium",

      score: 76,

      reason: "Basé sur votre activité récente.",

      actionLabel: "Continuer",
    });
  }

  // ----------------------------------------------------------
  // Nouveau contenu
  // ----------------------------------------------------------

  if (feedItems.length > 0) {
    highlights.push({
      id: "brief-feed",

      kind: "brief",

      title: "Votre fil a du nouveau",

      description: `${feedItems.length} contenu${
        feedItems.length > 1 ? "s" : ""
      } personnalisé${feedItems.length > 1 ? "s" : ""} disponible${
        feedItems.length > 1 ? "s" : ""
      }.`,

      priority: "high",

      score: 82,

      actionLabel: "Voir le fil",
    });
  }

  // ----------------------------------------------------------
  // Module recommandé
  // ----------------------------------------------------------

  const recommended = modules[0];

  if (recommended) {
    highlights.push({
      id: `brief-module-${recommended.id}`,

      kind: "brief",

      title: `À explorer aujourd'hui : ${moduleLabel(recommended)}`,

      description: `Votre Home pense que ${moduleLabel(
        recommended,
      ).toLowerCase()} pourrait vous être utile aujourd'hui.`,

      moduleId: recommended.id,

      route: recommended.route,

      priority: "medium",

      score: 67,

      icon: recommended.icon,

      actionLabel: "Découvrir",
    });
  }

  return {
    greeting: `${greeting}, ${displayName}`,

    headline: "Voici ce qui mérite votre attention aujourd'hui.",

    summary:
      highlights.length > 0
        ? "Votre Home a préparé quelques éléments personnalisés pour vous."
        : "Votre Home est prête à vous faire découvrir quelque chose d'utile.",

    highlights: highlights.slice(0, 4),
  };
}

// ============================================================
// COMMAND CENTER
// ============================================================

function buildCommandCenter(
  contextSuggestions: IntelligenceItem[],
  opportunities: IntelligenceItem[],
  nearby: IntelligenceItem[],
  activity: ActivitySignal[],
): IntelligenceItem[] {
  const actions: IntelligenceItem[] = [];

  // Priorité absolue :
  // opportunité > activité > nearby > contexte

  if (opportunities[0]) {
    actions.push({
      ...opportunities[0],

      id: `command-${opportunities[0].id}`,

      kind: "action",

      title: "Une opportunité vous attend",

      description: opportunities[0].description,

      priority: "critical",

      score: clamp(opportunities[0].score + 8),

      actionLabel: "Agir maintenant",
    });
  }

  if (activity[0]) {
    actions.push({
      id: `command-activity-${activity[0].id}`,

      kind: "action",

      title: "Reprendre là où vous étiez",

      description: activity[0].label,

      moduleId: activity[0].moduleId,

      priority: "high",

      score: 86,

      reason: "Votre dernière activité peut être reprise.",

      actionLabel: "Continuer",
    });
  }

  if (nearby[0]) {
    actions.push({
      ...nearby[0],

      id: `command-${nearby[0].id}`,

      kind: "action",

      title: "Quelque chose est proche",

      priority: "medium",

      score: nearby[0].score,

      actionLabel: "Explorer autour de moi",
    });
  }

  if (actions.length === 0 && contextSuggestions[0]) {
    actions.push({
      ...contextSuggestions[0],

      id: `command-${contextSuggestions[0].id}`,

      kind: "action",

      actionLabel: contextSuggestions[0].actionLabel ?? "Découvrir",
    });
  }

  return actions.slice(0, 3);
}

// ============================================================
// MÉTRIQUES
// ============================================================

function calculateMetrics(
  context: IntelligenceItem[],
  opportunities: IntelligenceItem[],
  nearby: IntelligenceItem[],
  activity: ActivitySignal[],
  personalizationScore: number,
): IntelligenceMetrics {
  const contextScore =
    context.length > 0
      ? clamp(
          context.reduce((total, item) => total + item.score, 0) /
            context.length,
        )
      : 0;

  const opportunityScore =
    opportunities.length > 0
      ? clamp(
          opportunities.reduce((total, item) => total + item.score, 0) /
            opportunities.length,
        )
      : 0;

  const nearbyScore =
    nearby.length > 0
      ? clamp(
          nearby.reduce((total, item) => total + item.score, 0) / nearby.length,
        )
      : 0;

  const engagementScore = clamp(activity.length * 12);

  const overallScore = clamp(
    contextScore * 0.2 +
      opportunityScore * 0.2 +
      nearbyScore * 0.15 +
      engagementScore * 0.15 +
      personalizationScore * 0.3,
  );

  return {
    contextScore,
    opportunityScore,
    nearbyScore,
    engagementScore,
    personalizationScore,
    overallScore,
  };
}

// ============================================================
// CONSTRUCTION DE L'INTELLIGENCE
// ============================================================

/**
 * Construit le cerveau complet de la Home
 * à partir de données Home déjà construites.
 *
 * IMPORTANT :
 *
 * Cette fonction NE construit PAS HomeData.
 *
 * Elle reçoit `home` directement.
 *
 * Ainsi, le flux optimisé devient :
 *
 *   buildHomeData(ctx)
 *          │
 *          ▼
 *   buildHomeIntelligence(ctx, home)
 *
 * au lieu de :
 *
 *   buildHomeIntelligence(ctx)
 *          │
 *          ▼
 *   ctx.runQuery(home.getHomeData)
 *          │
 *          ▼
 *   buildHomeData(...)
 */
export async function buildHomeIntelligence(
  ctx: any,
  home: HomeData,
): Promise<any> {
  // --------------------------------------------------------
  // HOME DATA = source de vérité
  // --------------------------------------------------------

  const user = home.user;

  const prefs = home.preferences;

  // --------------------------------------------------------
  // MODULES
  // --------------------------------------------------------
  //
  // HomeData expose volontairement :
  //
  //   - moduleIds
  //   - moduleOrder
  //
  // et non `home.modules`.
  //
  // L'intelligence a cependant besoin des métadonnées
  // du registry backend : label, route, icon,
  // capabilities, etc.
  //
  // `getHomeModulesFromData()` fait cette résolution
  // sans reconstruire HomeData.
  //

  const modules = getHomeModulesFromData(home);

  // --------------------------------------------------------
  // FEED
  // --------------------------------------------------------

  const feedItems = getFeedItems(home.feed);

  // --------------------------------------------------------
  // ACTIVITY
  // --------------------------------------------------------

  const activity = await getRecentActivity(ctx, normalizeString(user.email));

  // --------------------------------------------------------
  // INTELLIGENCE LAYERS
  // --------------------------------------------------------

  const contextSuggestions = buildContextSuggestions(
    user,
    prefs,
    modules,
    feedItems,
  );

  const opportunities = buildOpportunityRadar(modules, feedItems);

  const nearby = buildNearbyNow(modules);

  const dailyBrief = buildDailyBrief(user, modules, feedItems, activity);

  const commandCenter = buildCommandCenter(
    contextSuggestions,
    opportunities,
    nearby,
    activity,
  );

  const personalizationScore = calculatePersonalizationScore(
    prefs,
    modules,
    feedItems,
    activity,
  );

  const metrics = calculateMetrics(
    contextSuggestions,
    opportunities,
    nearby,
    activity,
    personalizationScore,
  );

  // --------------------------------------------------------
  // CONTEXTE GLOBAL
  // --------------------------------------------------------

  const favoriteModules: string[] = unique(
    safeArray(prefs.favoriteModules).map((value: unknown) => String(value)),
  );

  const hiddenSections = unique(
    safeArray(prefs.hiddenSections).map((value: unknown) => String(value)),
  );

  return {
    generatedAt: Date.now(),

    version: "2.0",

    user: {
      id: user.id as Id<"users">,

      name: user.name,

      email: user.email,
    },

    preferences: {
      favoriteModules,

      hiddenSections,

      customSectionOrder: safeArray(prefs.customSectionOrder).map(
        (value: unknown) => String(value),
      ),

      notifications: prefs.notificationPreferences,
    },

    // ------------------------------------------------------
    // ① SmartContextSuggestions
    // ------------------------------------------------------

    smartContextSuggestions: contextSuggestions,

    // ------------------------------------------------------
    // ② OpportunityRadar
    // ------------------------------------------------------

    opportunityRadar: {
      items: opportunities,

      count: opportunities.length,

      top: opportunities[0] ?? null,
    },

    // ------------------------------------------------------
    // ③ NearbyNow
    // ------------------------------------------------------

    nearbyNow: {
      items: nearby,

      count: nearby.length,

      top: nearby[0] ?? null,
    },

    // ------------------------------------------------------
    // ④ DailyBrief
    // ------------------------------------------------------

    dailyBrief,

    // ------------------------------------------------------
    // ⑤ HomeCommandCenter
    // ------------------------------------------------------

    commandCenter: {
      actions: commandCenter,

      primary: commandCenter[0] ?? null,
    },

    // ------------------------------------------------------
    // ⑥ HomePersonalizationSheet
    // ------------------------------------------------------

    personalization: {
      score: personalizationScore,

      favoriteModules,

      hiddenSections,

      availableModules: modules.map((module: any) => ({
        id: module.id,

        label: module.label,

        shortLabel: module.shortLabel,

        icon: module.icon,

        route: module.route,

        priority: module.priority,

        favorite: favoriteModules.includes(module.id),
      })),
    },

    // ------------------------------------------------------
    // ⑦ HomeActivityPulse
    // ------------------------------------------------------

    activityPulse: {
      items: activity,

      count: activity.length,

      latest: activity[0] ?? null,
    },

    // ------------------------------------------------------
    // MÉTRIQUES GLOBALES
    // ------------------------------------------------------

    metrics,

    // ------------------------------------------------------
    // META
    // ------------------------------------------------------

    meta: {
      moduleCount: modules.length,

      feedCount: feedItems.length,

      activityCount: activity.length,

      intelligenceLevel:
        metrics.overallScore >= 80
          ? "high"
          : metrics.overallScore >= 55
            ? "medium"
            : "starter",
    },
  };
}

// ============================================================
// QUERY PRINCIPALE
// ============================================================

/**
 * Retourne l'intelligence Home complète.
 *
 * Cette query reste disponible pour les consommateurs
 * qui veulent uniquement l'intelligence.
 *
 * Elle construit HomeData une seule fois, puis transmet
 * directement cette donnée à `buildHomeIntelligence`.
 *
 * Elle ne fait plus :
 *
 *   ctx.runQuery(api.home.getHomeData, {})
 */
export const getHomeIntelligence = query({
  args: {},

  handler: async (ctx): Promise<any> => {
    const home = await buildHomeData(ctx);

    if (!home) {
      return null;
    }

    return await buildHomeIntelligence(ctx, home);
  },
});

// ============================================================
// QUERIES SPÉCIALISÉES
// ============================================================
//
// Elles permettent aux composants de charger uniquement
// leur morceau d'intelligence lorsqu'une Home complète
// n'est pas nécessaire.
//
// Elles utilisent désormais le même builder Home partagé.
// ============================================================

/**
 * SmartContextSuggestions
 */
export const getSmartContextSuggestions = query({
  args: {},

  handler: async (ctx) => {
    const home = await buildHomeData(ctx);

    const intelligence = home ? await buildHomeIntelligence(ctx, home) : null;

    return intelligence?.smartContextSuggestions ?? [];
  },
});

/**
 * OpportunityRadar
 */
export const getOpportunityRadar = query({
  args: {
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const home = await buildHomeData(ctx);

    const intelligence = home ? await buildHomeIntelligence(ctx, home) : null;

    const limit = Math.max(1, Math.min(args.limit ?? 6, MAX_OPPORTUNITIES));

    return {
      items: (intelligence?.opportunityRadar.items ?? []).slice(0, limit),

      count: intelligence?.opportunityRadar.count ?? 0,
    };
  },
});

/**
 * NearbyNow
 */
export const getNearbyNow = query({
  args: {
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const home = await buildHomeData(ctx);

    const intelligence = home ? await buildHomeIntelligence(ctx, home) : null;

    const limit = Math.max(1, Math.min(args.limit ?? 6, MAX_NEARBY));

    return {
      items: (intelligence?.nearbyNow.items ?? []).slice(0, limit),

      count: intelligence?.nearbyNow.count ?? 0,
    };
  },
});

/**
 * DailyBrief
 */
export const getDailyBrief = query({
  args: {},

  handler: async (ctx) => {
    const home = await buildHomeData(ctx);

    const intelligence = home ? await buildHomeIntelligence(ctx, home) : null;

    return intelligence?.dailyBrief ?? null;
  },
});

/**
 * HomeCommandCenter
 */
export const getHomeCommandCenter = query({
  args: {},

  handler: async (ctx) => {
    const home = await buildHomeData(ctx);

    const intelligence = home ? await buildHomeIntelligence(ctx, home) : null;

    return intelligence?.commandCenter ?? null;
  },
});

/**
 * HomePersonalizationSheet
 */
export const getHomePersonalization = query({
  args: {},

  handler: async (ctx) => {
    const home = await buildHomeData(ctx);

    const intelligence = home ? await buildHomeIntelligence(ctx, home) : null;

    return intelligence?.personalization ?? null;
  },
});

/**
 * HomeActivityPulse
 */
export const getHomeActivityPulse = query({
  args: {},

  handler: async (ctx) => {
    const home = await buildHomeData(ctx);

    const intelligence = home ? await buildHomeIntelligence(ctx, home) : null;

    return intelligence?.activityPulse ?? null;
  },
});
