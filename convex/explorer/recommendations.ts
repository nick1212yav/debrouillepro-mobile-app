// convex/explorer/recommendations.ts

/**
 * ============================================================
 * DÉBROUILLEPRO — EXPLORER V2
 * RECOMMENDATION ENGINE
 * ============================================================
 *
 * Moteur "Pour vous".
 *
 * Responsabilités :
 * - personnaliser les résultats Explorer
 * - utiliser les modules favoris
 * - exploiter les intérêts utilisateur
 * - intégrer le contexte géographique
 * - prendre en compte les interactions
 * - favoriser la diversité
 * - éviter une personnalisation trop étroite
 *
 * IMPORTANT :
 * Ce moteur ne connaît aucune table Convex.
 * Il travaille uniquement avec des objets normalisés.
 * ============================================================
 */

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

export type RecommendationInteractionType =
  | "view"
  | "like"
  | "save"
  | "share"
  | "comment"
  | "click"
  | "dismiss";

export type RecommendationItem = {
  id: string;

  type?: string;

  moduleId?: string;

  title?: string;

  description?: string;

  subtitle?: string;

  category?: string;

  city?: string;

  country?: string;

  location?: string;

  tags?: string[];

  keywords?: string[];

  authorId?: string;

  authorName?: string;

  createdAt?: number;

  updatedAt?: number;

  score?: number;

  trendingScore?: number;

  distanceKm?: number;

  metadata?: Record<string, unknown>;
};

export type RecommendationInteraction = {
  itemId: string;

  type: RecommendationInteractionType;

  timestamp?: number;

  moduleId?: string;

  metadata?: Record<string, unknown>;
};

export type RecommendationUserContext = {
  userId?: string;

  city?: string;

  country?: string;

  latitude?: number;

  longitude?: number;

  favoriteModules?: string[];

  interests?: string[];

  preferredCategories?: string[];

  hiddenModules?: string[];

  hiddenSections?: string[];

  recentSearches?: string[];
};

export type RecommendationOptions = {
  limit?: number;

  now?: number;

  /**
   * Favorise les nouveautés.
   */
  explorationRatio?: number;

  /**
   * Niveau de diversité.
   *
   * 0 = classement pur
   * 1 = diversité maximale
   */
  diversity?: number;

  /**
   * Permet d'inclure des éléments
   * déjà vus récemment.
   */
  includeSeen?: boolean;
};

/**
 * Résultat enrichi.
 */
export type RecommendationResult<T extends RecommendationItem> = T & {
  recommendationScore: number;

  personalizationScore: number;

  interestScore: number;

  contextScore: number;

  freshnessScore: number;

  explorationScore: number;

  diversityScore: number;

  reason:
    | "favorite_module"
    | "matching_interest"
    | "nearby"
    | "trending"
    | "fresh"
    | "exploration"
    | "popular"
    | "personalized";
};

/**
 * ============================================================
 * CONSTANTES
 * ============================================================
 */

export const DEFAULT_RECOMMENDATION_LIMIT = 20;

export const MAX_RECOMMENDATION_LIMIT = 100;

export const DEFAULT_EXPLORATION_RATIO = 0.2;

export const DEFAULT_DIVERSITY = 0.35;

/**
 * ============================================================
 * UTILITAIRES
 * ============================================================
 */

function normalizeText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function finiteNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return value;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeLimit(limit?: number): number {
  if (limit === undefined || !Number.isFinite(limit)) {
    return DEFAULT_RECOMMENDATION_LIMIT;
  }

  return Math.max(1, Math.min(Math.floor(limit), MAX_RECOMMENDATION_LIMIT));
}

function normalizeRatio(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(1, value));
}

/**
 * ============================================================
 * SEARCHABLE TEXT
 * ============================================================
 */

function getSearchableText(item: RecommendationItem): string {
  return normalizeText(
    [
      item.title,
      item.description,
      item.subtitle,
      item.category,
      item.moduleId,
      item.type,
      item.city,
      item.country,
      item.location,
      item.authorName,
      ...(item.tags ?? []),
      ...(item.keywords ?? []),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

/**
 * ============================================================
 * FRESHNESS
 * ============================================================
 */

export function calculateRecommendationFreshness(
  createdAt?: number,
  now = Date.now(),
): number {
  if (createdAt === undefined || !Number.isFinite(createdAt)) {
    return 40;
  }

  const ageHours = Math.max(0, (now - createdAt) / (1000 * 60 * 60));

  if (ageHours <= 1) {
    return 100;
  }

  if (ageHours <= 6) {
    return 90;
  }

  if (ageHours <= 24) {
    return 75;
  }

  if (ageHours <= 72) {
    return 55;
  }

  if (ageHours <= 168) {
    return 35;
  }

  return 15;
}

/**
 * ============================================================
 * MODULE PREFERENCE
 * ============================================================
 */

export function calculateModulePreference(
  item: RecommendationItem,
  context?: RecommendationUserContext,
): number {
  if (!context) {
    return 0;
  }

  const module = normalizeText(item.moduleId ?? item.type);

  if (!module) {
    return 0;
  }

  const favorites = context.favoriteModules ?? [];

  const favoriteMatch = favorites.some(
    (value) => normalizeText(value) === module,
  );

  if (favoriteMatch) {
    return 100;
  }

  /**
   * Les catégories proches
   * des modules favoris obtiennent
   * un petit bonus.
   */
  const relatedText = normalizeText(
    [item.category, item.title, item.description].filter(Boolean).join(" "),
  );

  for (const favorite of favorites) {
    const normalizedFavorite = normalizeText(favorite);

    if (normalizedFavorite && relatedText.includes(normalizedFavorite)) {
      return 55;
    }
  }

  return 0;
}

/**
 * ============================================================
 * INTEREST MATCHING
 * ============================================================
 */

export function calculateInterestScore(
  item: RecommendationItem,
  context?: RecommendationUserContext,
): number {
  if (!context) {
    return 0;
  }

  const interests = [
    ...(context.interests ?? []),
    ...(context.preferredCategories ?? []),
  ]
    .map(normalizeText)
    .filter(Boolean);

  if (interests.length === 0) {
    return 0;
  }

  const searchable = getSearchableText(item);

  let matches = 0;

  for (const interest of interests) {
    if (searchable.includes(interest)) {
      matches += 1;
    }
  }

  if (matches === 0) {
    return 0;
  }

  return clamp((matches / interests.length) * 100);
}

/**
 * ============================================================
 * LOCATION CONTEXT
 * ============================================================
 */

export function calculateContextScore(
  item: RecommendationItem,
  context?: RecommendationUserContext,
): number {
  if (!context) {
    return 0;
  }

  let score = 0;

  const itemCity = normalizeText(item.city ?? item.location);

  const userCity = normalizeText(context.city);

  if (itemCity && userCity) {
    if (itemCity === userCity) {
      score += 70;
    } else if (itemCity.includes(userCity) || userCity.includes(itemCity)) {
      score += 45;
    }
  }

  const itemCountry = normalizeText(item.country);

  const userCountry = normalizeText(context.country);

  if (itemCountry && userCountry && itemCountry === userCountry) {
    score += 20;
  }

  if (item.distanceKm !== undefined && Number.isFinite(item.distanceKm)) {
    if (item.distanceKm <= 1) {
      score += 30;
    } else if (item.distanceKm <= 5) {
      score += 22;
    } else if (item.distanceKm <= 15) {
      score += 12;
    } else if (item.distanceKm <= 30) {
      score += 5;
    }
  }

  return clamp(score);
}

/**
 * ============================================================
 * INTERACTION HISTORY
 * ============================================================
 */

function getItemInteractions(
  item: RecommendationItem,
  interactions: RecommendationInteraction[],
): RecommendationInteraction[] {
  return interactions.filter((interaction) => interaction.itemId === item.id);
}

/**
 * Score d'affinité basé sur les interactions.
 */
export function calculateInteractionAffinity(
  item: RecommendationItem,
  interactions: RecommendationInteraction[],
): number {
  const itemInteractions = getItemInteractions(item, interactions);

  if (itemInteractions.length === 0) {
    return 0;
  }

  let score = 0;

  for (const interaction of itemInteractions) {
    switch (interaction.type) {
      case "like":
        score += 20;
        break;

      case "save":
        score += 25;
        break;

      case "share":
        score += 30;
        break;

      case "comment":
        score += 25;
        break;

      case "click":
        score += 15;
        break;

      case "view":
        score += 5;
        break;

      case "dismiss":
        score -= 40;
        break;

      default:
        break;
    }
  }

  return clamp(score);
}

/**
 * ============================================================
 * MODULE AFFINITY FROM HISTORY
 * ============================================================
 */

export function calculateModuleAffinity(
  item: RecommendationItem,
  interactions: RecommendationInteraction[],
): number {
  const module = normalizeText(item.moduleId ?? item.type);

  if (!module) {
    return 0;
  }

  const moduleInteractions = interactions.filter(
    (interaction) => normalizeText(interaction.moduleId) === module,
  );

  if (moduleInteractions.length === 0) {
    return 0;
  }

  let score = 0;

  for (const interaction of moduleInteractions) {
    switch (interaction.type) {
      case "like":
      case "save":
      case "share":
      case "comment":
        score += 15;
        break;

      case "click":
        score += 10;
        break;

      case "view":
        score += 3;
        break;

      case "dismiss":
        score -= 20;
        break;
    }
  }

  return clamp(score);
}

/**
 * ============================================================
 * TRENDING SIGNAL
 * ============================================================
 */

export function calculateTrendingSignal(item: RecommendationItem): number {
  return clamp(finiteNumber(item.trendingScore));
}

/**
 * ============================================================
 * BASE SCORE
 * ============================================================
 */

export function calculateBaseRecommendationScore(
  item: RecommendationItem,
): number {
  return clamp(finiteNumber(item.score));
}

/**
 * ============================================================
 * EXPLORATION
 * ============================================================
 *
 * L'exploration évite que "Pour vous"
 * montre toujours exactement les mêmes univers.
 */
export function calculateExplorationScore(
  item: RecommendationItem,
  context?: RecommendationUserContext,
): number {
  const module = normalizeText(item.moduleId ?? item.type);

  const favorites = (context?.favoriteModules ?? []).map(normalizeText);

  const interests = (context?.interests ?? []).map(normalizeText);

  const alreadyKnown = favorites.includes(module) || interests.includes(module);

  /**
   * Les modules inconnus
   * reçoivent davantage d'exploration.
   */
  if (!alreadyKnown) {
    return 85;
  }

  return 25;
}

/**
 * ============================================================
 * HIDDEN FILTER
 * ============================================================
 */

export function isRecommendationHidden(
  item: RecommendationItem,
  context?: RecommendationUserContext,
): boolean {
  if (!context) {
    return false;
  }

  const module = normalizeText(item.moduleId ?? item.type);

  return (
    context.hiddenModules?.some((hidden) => normalizeText(hidden) === module) ??
    false
  );
}

/**
 * ============================================================
 * SEEN FILTER
 * ============================================================
 */

export function hasRecentlyInteracted(
  item: RecommendationItem,
  interactions: RecommendationInteraction[],
  now = Date.now(),
): boolean {
  const recentLimit = 7 * 24 * 60 * 60 * 1000;

  return interactions.some((interaction) => {
    if (interaction.itemId !== item.id) {
      return false;
    }

    if (interaction.timestamp === undefined) {
      return true;
    }

    return now - interaction.timestamp <= recentLimit;
  });
}

/**
 * ============================================================
 * RECOMMENDATION REASON
 * ============================================================
 */

function getRecommendationReason(
  item: RecommendationItem,
  moduleScore: number,
  interestScore: number,
  contextScore: number,
  freshnessScore: number,
  explorationScore: number,
  trendingScore: number,
): RecommendationResult<RecommendationItem>["reason"] {
  if (moduleScore >= 80) {
    return "favorite_module";
  }

  if (interestScore >= 60) {
    return "matching_interest";
  }

  if (contextScore >= 60) {
    return "nearby";
  }

  if (trendingScore >= 70) {
    return "trending";
  }

  if (freshnessScore >= 80) {
    return "fresh";
  }

  if (explorationScore >= 75) {
    return "exploration";
  }

  if (finiteNumber(item.score) >= 70) {
    return "popular";
  }

  return "personalized";
}

/**
 * ============================================================
 * SINGLE ITEM SCORING
 * ============================================================
 */

export function scoreRecommendation<T extends RecommendationItem>(
  item: T,
  context?: RecommendationUserContext,
  interactions: RecommendationInteraction[] = [],
  options: RecommendationOptions = {},
): RecommendationResult<T> {
  const now = options.now ?? Date.now();

  const moduleScore = calculateModulePreference(item, context);

  const interestScore = calculateInterestScore(item, context);

  const contextScore = calculateContextScore(item, context);

  const freshnessScore = calculateRecommendationFreshness(item.createdAt, now);

  const interactionScore = calculateInteractionAffinity(item, interactions);

  const moduleAffinity = calculateModuleAffinity(item, interactions);

  const trendingScore = calculateTrendingSignal(item);

  const baseScore = calculateBaseRecommendationScore(item);

  const explorationScore = calculateExplorationScore(item, context);

  /**
   * Personnalisation globale.
   */
  const personalizationScore = clamp(
    moduleScore * 0.3 +
      interestScore * 0.25 +
      contextScore * 0.2 +
      interactionScore * 0.15 +
      moduleAffinity * 0.1,
  );

  /**
   * Score final.
   */
  const recommendationScore = clamp(
    personalizationScore * 0.45 +
      trendingScore * 0.15 +
      freshnessScore * 0.1 +
      explorationScore * 0.1 +
      baseScore * 0.1 +
      contextScore * 0.1,
  );

  const diversityScore = explorationScore;

  const reason = getRecommendationReason(
    item,
    moduleScore,
    interestScore,
    contextScore,
    freshnessScore,
    explorationScore,
    trendingScore,
  );

  return {
    ...item,

    recommendationScore:
      /**
       * Un léger bonus à l'interaction
       * empêche un contenu déjà apprécié
       * de disparaître immédiatement.
       */
      clamp(recommendationScore + interactionScore * 0.05),

    personalizationScore,

    interestScore,

    contextScore,

    freshnessScore,

    explorationScore,

    diversityScore,

    reason,
  };
}

/**
 * ============================================================
 * DIVERSITY
 * ============================================================
 */

function getDiversityKey(item: RecommendationItem): string {
  return normalizeText(item.moduleId ?? item.type) || "unknown";
}

/**
 * Réordonne les résultats afin d'éviter
 * 20 éléments du même module.
 */
export function diversifyRecommendations<T extends RecommendationItem>(
  items: RecommendationResult<T>[],
  diversity = DEFAULT_DIVERSITY,
): RecommendationResult<T>[] {
  const normalizedDiversity = Math.max(0, Math.min(1, diversity));

  if (normalizedDiversity <= 0 || items.length <= 2) {
    return [...items];
  }

  const remaining = [...items];

  const result: RecommendationResult<T>[] = [];

  const moduleCounts = new Map<string, number>();

  while (remaining.length > 0) {
    let bestIndex = 0;

    let bestAdjustedScore = -Infinity;

    for (let index = 0; index < remaining.length; index += 1) {
      const item = remaining[index];

      const key = getDiversityKey(item);

      const count = moduleCounts.get(key) ?? 0;

      /**
       * Plus un module est présent,
       * plus son prochain élément reçoit
       * une pénalité.
       */
      const diversityPenalty = count * 20 * normalizedDiversity;

      const adjustedScore =
        item.recommendationScore -
        diversityPenalty +
        item.diversityScore * normalizedDiversity * 0.1;

      if (adjustedScore > bestAdjustedScore) {
        bestAdjustedScore = adjustedScore;

        bestIndex = index;
      }
    }

    const [selected] = remaining.splice(bestIndex, 1);

    const key = getDiversityKey(selected);

    moduleCounts.set(key, (moduleCounts.get(key) ?? 0) + 1);

    result.push(selected);
  }

  return result;
}

/**
 * ============================================================
 * PIPELINE COMPLET
 * ============================================================
 */

export function getRecommendations<T extends RecommendationItem>(
  items: T[],
  context?: RecommendationUserContext,
  interactions: RecommendationInteraction[] = [],
  options: RecommendationOptions = {},
): RecommendationResult<T>[] {
  const limit = normalizeLimit(options.limit);

  const now = options.now ?? Date.now();

  const explorationRatio = normalizeRatio(
    options.explorationRatio,
    DEFAULT_EXPLORATION_RATIO,
  );

  const diversity = normalizeRatio(options.diversity, DEFAULT_DIVERSITY);

  const includeSeen = options.includeSeen ?? false;

  /**
   * Prépare les éléments.
   */
  const candidates = items.filter((item) => {
    /**
     * Respect des modules cachés.
     */
    if (isRecommendationHidden(item, context)) {
      return false;
    }

    /**
     * Évite les éléments vus récemment
     * lorsque demandé.
     */
    if (!includeSeen && hasRecentlyInteracted(item, interactions, now)) {
      return false;
    }

    return true;
  });

  /**
   * Score.
   */
  const scored = candidates.map((item) =>
    scoreRecommendation(item, context, interactions, {
      ...options,
      now,
    }),
  );

  /**
   * Classement initial.
   */
  scored.sort((a, b) => b.recommendationScore - a.recommendationScore);

  /**
   * Diversité.
   */
  const diversified = diversifyRecommendations(scored, diversity);

  /**
   * Contrôle de l'exploration.
   *
   * On s'assure qu'une partie des résultats
   * provient de modules moins connus.
   */
  if (explorationRatio > 0 && diversified.length > 3) {
    const explorationCandidates = diversified
      .filter((item) => item.explorationScore >= 75)
      .sort((a, b) => b.explorationScore - a.explorationScore);

    const explorationCount = Math.min(
      Math.floor(limit * explorationRatio),
      explorationCandidates.length,
    );

    const explorationItems = explorationCandidates.slice(0, explorationCount);

    const normalItems = diversified.filter(
      (item) =>
        !explorationItems.some((exploration) => exploration.id === item.id),
    );

    /**
     * On mélange les éléments
     * exploratoires avec les meilleurs.
     */
    const finalItems: RecommendationResult<T>[] = [];

    let normalIndex = 0;

    let explorationIndex = 0;

    while (
      finalItems.length < limit &&
      (normalIndex < normalItems.length ||
        explorationIndex < explorationItems.length)
    ) {
      /**
       * Tous les 4 éléments,
       * on injecte une découverte.
       */
      if (
        explorationIndex < explorationItems.length &&
        (finalItems.length % 4 === 3 || normalIndex >= normalItems.length)
      ) {
        finalItems.push(explorationItems[explorationIndex]);

        explorationIndex += 1;

        continue;
      }

      if (normalIndex < normalItems.length) {
        finalItems.push(normalItems[normalIndex]);

        normalIndex += 1;

        continue;
      }

      if (explorationIndex < explorationItems.length) {
        finalItems.push(explorationItems[explorationIndex]);

        explorationIndex += 1;
      }
    }

    return finalItems.slice(0, limit);
  }

  return diversified.slice(0, limit);
}

/**
 * ============================================================
 * GROUPING
 * ============================================================
 */

export type RecommendationGroup<T extends RecommendationItem> = {
  moduleId: string;

  label: string;

  items: RecommendationResult<T>[];

  topScore: number;
};

const MODULE_LABELS: Record<string, string> = {
  job: "Emploi",

  immo: "Immobilier",

  service: "Services",

  restaurant: "Restaurants",

  event: "Événements",

  product: "Marketplace",

  publication: "Publications",

  person: "Personnes",

  community: "Communautés",

  voyages: "Voyages",

  education: "Éducation",

  sante: "Santé",

  transport: "Transport",
};

/**
 * Regroupe les recommandations
 * par univers Explorer.
 */
export function groupRecommendationsByModule<T extends RecommendationItem>(
  items: RecommendationResult<T>[],
): RecommendationGroup<T>[] {
  const groups = new Map<string, RecommendationResult<T>[]>();

  for (const item of items) {
    const moduleId = item.moduleId ?? item.type ?? "publication";

    const group = groups.get(moduleId);

    if (group) {
      group.push(item);
    } else {
      groups.set(moduleId, [item]);
    }
  }

  return Array.from(groups.entries())
    .map(([moduleId, moduleItems]) => ({
      moduleId,

      label: MODULE_LABELS[moduleId] ?? moduleId,

      items: moduleItems.sort(
        (a, b) => b.recommendationScore - a.recommendationScore,
      ),

      topScore: moduleItems[0]?.recommendationScore ?? 0,
    }))
    .sort((a, b) => b.topScore - a.topScore);
}

/**
 * ============================================================
 * RECOMMENDATION SNAPSHOT
 * ============================================================
 */

export type RecommendationSnapshot<T extends RecommendationItem> = {
  items: RecommendationResult<T>[];

  groups: RecommendationGroup<T>[];

  generatedAt: number;

  personalized: boolean;
};

/**
 * Construit le résultat complet
 * de la section "Pour vous".
 */
export function buildRecommendationSnapshot<T extends RecommendationItem>(
  items: T[],
  context?: RecommendationUserContext,
  interactions: RecommendationInteraction[] = [],
  options: RecommendationOptions = {},
): RecommendationSnapshot<T> {
  const recommendations = getRecommendations(
    items,
    context,
    interactions,
    options,
  );

  return {
    items: recommendations,

    groups: groupRecommendationsByModule(recommendations),

    generatedAt: options.now ?? Date.now(),

    personalized: Boolean(
      context &&
      (context.favoriteModules?.length ||
        context.interests?.length ||
        interactions.length),
    ),
  };
}

/**
 * ============================================================
 * RECOMMENDATION REASON LABEL
 * ============================================================
 */

export function getRecommendationReasonLabel(
  reason: RecommendationResult<RecommendationItem>["reason"],
): string {
  switch (reason) {
    case "favorite_module":
      return "Parce que vous aimez ce module";

    case "matching_interest":
      return "Selon vos centres d'intérêt";

    case "nearby":
      return "Près de vous";

    case "trending":
      return "Tendance actuellement";

    case "fresh":
      return "Nouveau pour vous";

    case "exploration":
      return "À découvrir";

    case "popular":
      return "Populaire";

    default:
      return "Recommandé pour vous";
  }
}
