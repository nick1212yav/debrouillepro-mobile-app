// convex/explorer/opportunities.ts

/**
 * ============================================================
 * DÉBROUILLEPRO — EXPLORER V2
 * OPPORTUNITIES ENGINE
 * ============================================================
 *
 * Moteur "Opportunités".
 *
 * Sources principales :
 *   💼 Jobs
 *   🏠 Immo
 *   🛠 Services
 *   🛍 Marketplace
 *   🎟 Événements
 *
 * Le moteur ne dépend pas directement des tables Convex.
 * Il travaille sur des éléments normalisés.
 * ============================================================
 */

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

export type OpportunityType =
  | "job"
  | "immo"
  | "service"
  | "product"
  | "event"
  | "other";

/**
 * IMPORTANT :
 * Type séparé du générique OpportunityResult<T>.
 *
 * Cela évite que TypeScript transforme le type en :
 *
 * T["opportunityReason"] & OpportunityReason
 */
export type OpportunityReason =
  | "nearby"
  | "recommended"
  | "trending"
  | "fresh"
  | "high_value"
  | "popular"
  | "discovery";

export type OpportunityItem = {
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

  createdAt?: number;

  updatedAt?: number;

  price?: number;

  score?: number;

  trendingScore?: number;

  recommendationScore?: number;

  distanceKm?: number;

  status?: string;

  metadata?: Record<string, unknown>;
};

export type OpportunityContext = {
  city?: string;

  country?: string;

  favoriteModules?: string[];

  interests?: string[];

  preferredCategories?: string[];
};

export type OpportunityOptions = {
  limit?: number;

  now?: number;

  city?: string;

  type?: OpportunityType;

  moduleId?: string;

  includeOther?: boolean;
};

export type OpportunityResult<T extends OpportunityItem> = T & {
  opportunityType: OpportunityType;

  opportunityScore: number;

  relevanceScore: number;

  freshnessScore: number;

  proximityScore: number;

  demandScore: number;

  personalizationScore: number;

  opportunityReason: OpportunityReason;
};

export type OpportunityGroup<T extends OpportunityItem> = {
  type: OpportunityType;

  label: string;

  items: OpportunityResult<T>[];

  topScore: number;
};

/**
 * ============================================================
 * CONSTANTES
 * ============================================================
 */

export const DEFAULT_OPPORTUNITY_LIMIT = 20;

export const MAX_OPPORTUNITY_LIMIT = 100;

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
    return DEFAULT_OPPORTUNITY_LIMIT;
  }

  return Math.max(1, Math.min(Math.floor(limit), MAX_OPPORTUNITY_LIMIT));
}

/**
 * ============================================================
 * TYPE DETECTION
 * ============================================================
 */

export function detectOpportunityType(item: OpportunityItem): OpportunityType {
  const raw = normalizeText(item.moduleId ?? item.type);

  switch (raw) {
    case "job":
    case "emploi":
      return "job";

    case "immo":
    case "immobilier":
    case "logement":
      return "immo";

    case "service":
    case "services":
      return "service";

    case "marketplace":
    case "product":
    case "produit":
      return "product";

    case "event":
    case "evenement":
    case "evenements":
      return "event";

    default:
      return "other";
  }
}

/**
 * ============================================================
 * FRAÎCHEUR
 * ============================================================
 */

export function calculateOpportunityFreshness(
  createdAt?: number,
  now = Date.now(),
): number {
  if (createdAt === undefined || !Number.isFinite(createdAt)) {
    return 35;
  }

  const ageHours = Math.max(0, (now - createdAt) / (1000 * 60 * 60));

  if (ageHours <= 1) {
    return 100;
  }

  if (ageHours <= 6) {
    return 92;
  }

  if (ageHours <= 24) {
    return 80;
  }

  if (ageHours <= 72) {
    return 65;
  }

  if (ageHours <= 168) {
    return 45;
  }

  if (ageHours <= 720) {
    return 25;
  }

  return 10;
}

/**
 * ============================================================
 * PROXIMITÉ
 * ============================================================
 */

export function calculateOpportunityProximity(
  item: OpportunityItem,
  city?: string,
): number {
  if (item.distanceKm !== undefined && Number.isFinite(item.distanceKm)) {
    if (item.distanceKm <= 1) {
      return 100;
    }

    if (item.distanceKm <= 5) {
      return 90;
    }

    if (item.distanceKm <= 10) {
      return 75;
    }

    if (item.distanceKm <= 25) {
      return 55;
    }

    if (item.distanceKm <= 50) {
      return 30;
    }

    return 10;
  }

  if (!city) {
    return 0;
  }

  const targetCity = normalizeText(city);

  const itemCity = normalizeText(item.city ?? item.location);

  if (!targetCity || !itemCity) {
    return 0;
  }

  if (itemCity === targetCity) {
    return 90;
  }

  if (itemCity.includes(targetCity) || targetCity.includes(itemCity)) {
    return 65;
  }

  return 0;
}

/**
 * ============================================================
 * DEMAND SCORE
 * ============================================================
 */

export function calculateDemandScore(item: OpportunityItem): number {
  const trending = finiteNumber(item.trendingScore);

  const recommendation = finiteNumber(item.recommendationScore);

  const score = finiteNumber(item.score);

  return clamp(trending * 0.4 + recommendation * 0.35 + score * 0.25);
}

/**
 * ============================================================
 * PERSONNALISATION
 * ============================================================
 */

export function calculateOpportunityPersonalization(
  item: OpportunityItem,
  context?: OpportunityContext,
): number {
  if (!context) {
    return 0;
  }

  const module = normalizeText(item.moduleId ?? item.type);

  let score = 0;

  if (
    context.favoriteModules?.some(
      (favorite) => normalizeText(favorite) === module,
    )
  ) {
    score += 50;
  }

  const category = normalizeText(item.category);

  if (
    category &&
    context.preferredCategories?.some(
      (preferred) => normalizeText(preferred) === category,
    )
  ) {
    score += 25;
  }

  const searchable = normalizeText(
    [
      item.title,
      item.description,
      item.category,
      item.moduleId,
      ...(item.tags ?? []),
      ...(item.keywords ?? []),
    ]
      .filter(Boolean)
      .join(" "),
  );

  for (const interest of context.interests ?? []) {
    const normalized = normalizeText(interest);

    if (normalized && searchable.includes(normalized)) {
      score += 10;
    }
  }

  return clamp(score);
}

/**
 * ============================================================
 * RELEVANCE
 * ============================================================
 */

export function calculateOpportunityRelevance(
  item: OpportunityItem,
  context?: OpportunityContext,
  city?: string,
): number {
  const proximity = calculateOpportunityProximity(item, city ?? context?.city);

  const personalization = calculateOpportunityPersonalization(item, context);

  const demand = calculateDemandScore(item);

  return clamp(proximity * 0.45 + personalization * 0.4 + demand * 0.15);
}

/**
 * ============================================================
 * HIGH VALUE SIGNAL
 * ============================================================
 */

export function calculateHighValueSignal(item: OpportunityItem): number {
  const type = detectOpportunityType(item);

  const text = normalizeText(
    [item.title, item.description, item.category, ...(item.tags ?? [])]
      .filter(Boolean)
      .join(" "),
  );

  let score = 0;

  switch (type) {
    case "job":
      score += 35;

      if (/urgent|recrutement|embauche|immediat/.test(text)) {
        score += 25;
      }

      break;

    case "immo":
      score += 35;

      if (/location|vente|appartement|maison|studio/.test(text)) {
        score += 20;
      }

      break;

    case "service":
      score += 25;

      if (/urgent|disponible|intervention|reparation/.test(text)) {
        score += 25;
      }

      break;

    case "product":
      score += 20;

      if (/promo|offre|occasion|neuf|prix/.test(text)) {
        score += 20;
      }

      break;

    case "event":
      score += 25;

      if (/aujourd|demain|weekend|ce soir|concert|festival/.test(text)) {
        score += 25;
      }

      break;

    default:
      score += 10;
  }

  return clamp(score);
}

/**
 * ============================================================
 * OPPORTUNITY SCORE
 * ============================================================
 */

export function scoreOpportunity<T extends OpportunityItem>(
  item: T,
  context?: OpportunityContext,
  options: OpportunityOptions = {},
): OpportunityResult<T> {
  const now = options.now ?? Date.now();

  const opportunityType = detectOpportunityType(item);

  const freshnessScore = calculateOpportunityFreshness(item.createdAt, now);

  const proximityScore = calculateOpportunityProximity(
    item,
    options.city ?? context?.city,
  );

  const demandScore = calculateDemandScore(item);

  const personalizationScore = calculateOpportunityPersonalization(
    item,
    context,
  );

  const relevanceScore = calculateOpportunityRelevance(
    item,
    context,
    options.city ?? context?.city,
  );

  const highValueScore = calculateHighValueSignal(item);

  const opportunityScore = clamp(
    relevanceScore * 0.25 +
      proximityScore * 0.15 +
      freshnessScore * 0.15 +
      demandScore * 0.15 +
      personalizationScore * 0.15 +
      highValueScore * 0.15,
  );

  /**
   * CORRECTION IMPORTANTE :
   *
   * Ne pas utiliser :
   *
   * OpportunityResult<T>["opportunityReason"]
   *
   * ici, car OpportunityResult<T> est une
   * intersection avec T.
   *
   * On utilise directement OpportunityReason.
   */
  let opportunityReason: OpportunityReason = "discovery";

  if (proximityScore >= 80) {
    opportunityReason = "nearby";
  } else if (personalizationScore >= 65) {
    opportunityReason = "recommended";
  } else if (finiteNumber(item.trendingScore) >= 70) {
    opportunityReason = "trending";
  } else if (freshnessScore >= 85) {
    opportunityReason = "fresh";
  } else if (highValueScore >= 70) {
    opportunityReason = "high_value";
  } else if (demandScore >= 65) {
    opportunityReason = "popular";
  }

  return {
    ...item,

    opportunityType,

    opportunityScore,

    relevanceScore,

    freshnessScore,

    proximityScore,

    demandScore,

    personalizationScore,

    opportunityReason,
  };
}

/**
 * ============================================================
 * FILTER
 * ============================================================
 */

function matchesOpportunityFilters(
  item: OpportunityItem,
  options: OpportunityOptions,
): boolean {
  const type = detectOpportunityType(item);

  if (options.type && options.type !== "other" && type !== options.type) {
    return false;
  }

  if (!options.includeOther && type === "other") {
    return false;
  }

  if (
    options.moduleId &&
    normalizeText(item.moduleId ?? item.type) !==
      normalizeText(options.moduleId)
  ) {
    return false;
  }

  return true;
}

/**
 * ============================================================
 * PIPELINE
 * ============================================================
 */

export function getOpportunities<T extends OpportunityItem>(
  items: T[],
  context?: OpportunityContext,
  options: OpportunityOptions = {},
): OpportunityResult<T>[] {
  const limit = normalizeLimit(options.limit);

  const filtered = items.filter((item) =>
    matchesOpportunityFilters(item, options),
  );

  const scored = filtered.map((item) =>
    scoreOpportunity(item, context, options),
  );

  return scored
    .sort((a, b) => {
      if (a.opportunityScore !== b.opportunityScore) {
        return b.opportunityScore - a.opportunityScore;
      }

      if (a.proximityScore !== b.proximityScore) {
        return b.proximityScore - a.proximityScore;
      }

      return b.freshnessScore - a.freshnessScore;
    })
    .slice(0, limit);
}

/**
 * ============================================================
 * GROUPING
 * ============================================================
 */

const OPPORTUNITY_LABELS: Record<OpportunityType, string> = {
  job: "Emploi",
  immo: "Immobilier",
  service: "Services",
  product: "Marketplace",
  event: "Événements",
  other: "Autres",
};

export function groupOpportunities<T extends OpportunityItem>(
  items: OpportunityResult<T>[],
): OpportunityGroup<T>[] {
  const groups = new Map<OpportunityType, OpportunityResult<T>[]>();

  for (const item of items) {
    const type = item.opportunityType;

    const existing = groups.get(type);

    if (existing) {
      existing.push(item);
    } else {
      groups.set(type, [item]);
    }
  }

  return Array.from(groups.entries())
    .map(([type, groupItems]) => ({
      type,

      label: OPPORTUNITY_LABELS[type],

      items: groupItems.sort((a, b) => b.opportunityScore - a.opportunityScore),

      topScore: groupItems[0]?.opportunityScore ?? 0,
    }))
    .sort((a, b) => b.topScore - a.topScore);
}

/**
 * ============================================================
 * SNAPSHOT
 * ============================================================
 */

export type OpportunitySnapshot<T extends OpportunityItem> = {
  items: OpportunityResult<T>[];

  groups: OpportunityGroup<T>[];

  generatedAt: number;

  total: number;
};

export function buildOpportunitySnapshot<T extends OpportunityItem>(
  items: T[],
  context?: OpportunityContext,
  options: OpportunityOptions = {},
): OpportunitySnapshot<T> {
  const opportunities = getOpportunities(items, context, options);

  return {
    items: opportunities,

    groups: groupOpportunities(opportunities),

    generatedAt: options.now ?? Date.now(),

    total: opportunities.length,
  };
}

/**
 * ============================================================
 * LABELS
 * ============================================================
 */

export function getOpportunityReasonLabel(reason: OpportunityReason): string {
  switch (reason) {
    case "nearby":
      return "Près de vous";

    case "recommended":
      return "Pour vous";

    case "trending":
      return "Très demandé";

    case "fresh":
      return "Nouveau";

    case "high_value":
      return "À saisir";

    case "popular":
      return "Populaire";

    default:
      return "À découvrir";
  }
}

/**
 * ============================================================
 * MODULE SUMMARY
 * ============================================================
 */

export type OpportunitySummary = {
  jobs: number;

  immo: number;

  services: number;

  products: number;

  events: number;

  other: number;

  total: number;
};

export function summarizeOpportunities<T extends OpportunityItem>(
  items: OpportunityResult<T>[],
): OpportunitySummary {
  const summary: OpportunitySummary = {
    jobs: 0,
    immo: 0,
    services: 0,
    products: 0,
    events: 0,
    other: 0,
    total: items.length,
  };

  for (const item of items) {
    switch (item.opportunityType) {
      case "job":
        summary.jobs += 1;
        break;

      case "immo":
        summary.immo += 1;
        break;

      case "service":
        summary.services += 1;
        break;

      case "product":
        summary.products += 1;
        break;

      case "event":
        summary.events += 1;
        break;

      default:
        summary.other += 1;
        break;
    }
  }

  return summary;
}
