// convex/explorer/ranking.ts

/**
 * ============================================================
 * DÉBROUILLEPRO — EXPLORER V2
 * RANKING ENGINE
 * ============================================================
 *
 * Moteur de classement commun à Explorer.
 *
 * Objectifs :
 * - personnaliser les résultats
 * - favoriser la proximité
 * - prendre en compte les intérêts
 * - valoriser les contenus de qualité
 * - conserver un score borné entre 0 et 100
 */

export type ExplorerRankable = {
  id: string;
  title: string;
  description: string;

  subtitle?: string;
  city?: string;
  location?: string;

  distanceKm?: number;
  rating?: number;

  moduleId?: string;
  score?: number;

  metadata?: Record<string, unknown>;

  createdAt?: number;
};

export type ExplorerRankingContext = {
  city?: string;

  interests?: string[];

  latitude?: number;
  longitude?: number;

  nearbyRadiusKm?: number;

  preferredModules?: string[];

  now?: number;
};

export type ExplorerRankingOptions = {
  baseScore?: number;

  cityWeight?: number;

  interestWeight?: number;

  proximityWeight?: number;

  ratingWeight?: number;

  moduleWeight?: number;

  freshnessWeight?: number;
};

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Score de fraîcheur.
 *
 * Plus l'élément est récent, plus il reçoit de points.
 * Le bonus décroît progressivement sur 30 jours.
 */
function freshnessScore(createdAt: number | undefined, now: number): number {
  if (!createdAt) return 0;

  const ageMs = Math.max(0, now - createdAt);

  const day = 24 * 60 * 60 * 1000;

  const ageDays = ageMs / day;

  if (ageDays <= 1) return 8;
  if (ageDays <= 3) return 6;
  if (ageDays <= 7) return 4;
  if (ageDays <= 14) return 2;
  if (ageDays <= 30) return 1;

  return 0;
}

/**
 * Calcule le score de personnalisation.
 */
export function rankExplorerItem(
  item: ExplorerRankable,
  context: ExplorerRankingContext,
  options: ExplorerRankingOptions = {},
): number {
  const {
    baseScore = item.score ?? 50,

    cityWeight = 12,

    interestWeight = 18,

    proximityWeight = 16,

    ratingWeight = 8,

    moduleWeight = 10,

    freshnessWeight = 8,
  } = options;

  let score = baseScore;

  const targetCity = normalize(context.city);

  const itemCity = normalize(item.city);

  const itemLocation = normalize(item.location);

  /**
   * ----------------------------------------------------------
   * 1. LOCALISATION
   * ----------------------------------------------------------
   */
  if (
    targetCity &&
    (itemCity.includes(targetCity) ||
      targetCity.includes(itemCity) ||
      itemLocation.includes(targetCity))
  ) {
    score += cityWeight;
  }

  /**
   * ----------------------------------------------------------
   * 2. INTÉRÊTS
   * ----------------------------------------------------------
   */
  const interests = Array.isArray(context.interests)
    ? context.interests.map(normalize).filter(Boolean)
    : [];

  if (interests.length > 0) {
    const searchable = normalize(
      [
        item.title,
        item.description,
        item.subtitle,
        item.moduleId,
        item.metadata?.category,
        item.metadata?.specialty,
        ...(Array.isArray(item.metadata?.tags) ? item.metadata.tags : []),
      ]
        .filter(Boolean)
        .join(" "),
    );

    const matchingInterests = interests.filter((interest) =>
      searchable.includes(interest),
    );

    if (matchingInterests.length > 0) {
      score += Math.min(interestWeight, matchingInterests.length * 6);
    }
  }

  /**
   * ----------------------------------------------------------
   * 3. MODULES PRÉFÉRÉS
   * ----------------------------------------------------------
   */
  if (
    item.moduleId &&
    Array.isArray(context.preferredModules) &&
    context.preferredModules.some(
      (module) => normalize(module) === normalize(item.moduleId),
    )
  ) {
    score += moduleWeight;
  }

  /**
   * ----------------------------------------------------------
   * 4. PROXIMITÉ
   * ----------------------------------------------------------
   */
  if (item.distanceKm !== undefined) {
    const radius = context.nearbyRadiusKm ?? 25;

    if (item.distanceKm <= radius) {
      const proximityRatio = Math.max(0, 1 - item.distanceKm / radius);

      score += proximityRatio * proximityWeight;
    }
  }

  /**
   * ----------------------------------------------------------
   * 5. NOTE
   * ----------------------------------------------------------
   */
  if (item.rating !== undefined && Number.isFinite(item.rating)) {
    score += Math.min(ratingWeight, Math.max(0, item.rating));
  }

  /**
   * ----------------------------------------------------------
   * 6. FRAÎCHEUR
   * ----------------------------------------------------------
   */
  score +=
    freshnessScore(item.createdAt, context.now ?? Date.now()) *
    (freshnessWeight / 8);

  return Number(clamp(score).toFixed(2));
}

/**
 * Classe une collection d'éléments.
 */
export function rankExplorerItems<T extends ExplorerRankable>(
  items: T[],
  context: ExplorerRankingContext,
  options?: ExplorerRankingOptions,
): T[] {
  return items
    .map((item) => ({
      ...item,
      score: rankExplorerItem(item, context, options),
    }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

/**
 * Classe puis limite une collection.
 */
export function rankAndLimitExplorerItems<T extends ExplorerRankable>(
  items: T[],
  context: ExplorerRankingContext,
  limit: number,
  options?: ExplorerRankingOptions,
): T[] {
  return rankExplorerItems(items, context, options).slice(
    0,
    Math.max(0, limit),
  );
}
