// convex/explorer/trending.ts

/**
 * ============================================================
 * DÉBROUILLEPRO — EXPLORER V2
 * TRENDING ENGINE
 * ============================================================
 *
 * Moteur "Tendances".
 *
 * Responsabilités :
 * - calculer un score de tendance
 * - favoriser les contenus récents
 * - intégrer les interactions disponibles
 * - détecter les accélérations de popularité
 * - éviter qu'un contenu ancien domine uniquement
 *   grâce à son volume historique
 * - classer les résultats
 *
 * Ce fichier ne dépend d'aucune table Convex.
 * Il travaille sur des objets déjà transformés en cartes Explorer.
 * ============================================================
 */

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

export type TrendingItem = {
  id: string;

  type?: string;

  moduleId?: string;

  title?: string;

  description?: string;

  category?: string;

  city?: string;

  location?: string;

  tags?: string[];

  createdAt?: number;

  updatedAt?: number;

  /**
   * Métriques disponibles.
   *
   * Toutes sont optionnelles afin de rester compatible
   * avec les différentes sources Explorer.
   */
  views?: number;

  viewCount?: number;

  likes?: number;

  likeCount?: number;

  saves?: number;

  bookmarkCount?: number;

  shares?: number;

  shareCount?: number;

  comments?: number;

  commentCount?: number;

  clicks?: number;

  ctaClicks?: number;

  score?: number;

  metadata?: Record<string, unknown>;
};

/**
 * Configuration du moteur Trending.
 */
export type TrendingOptions = {
  limit?: number;

  now?: number;

  /**
   * Fenêtre temporelle en heures.
   *
   * Par défaut : 72 heures.
   */
  windowHours?: number;

  /**
   * Autorise les contenus sans date.
   *
   * Par défaut : true.
   */
  includeUndated?: boolean;

  /**
   * Module ciblé.
   */
  moduleId?: string;

  /**
   * Ville ciblée.
   */
  city?: string;
};

/**
 * Résultat enrichi.
 */
export type TrendingResult<T extends TrendingItem> = T & {
  trendingScore: number;

  freshnessScore: number;

  engagementScore: number;

  velocityScore: number;

  relevanceScore: number;

  trendLevel: "viral" | "hot" | "rising" | "normal";
};

/**
 * ============================================================
 * CONSTANTES
 * ============================================================
 */

export const DEFAULT_TRENDING_LIMIT = 20;

export const MAX_TRENDING_LIMIT = 100;

export const DEFAULT_TRENDING_WINDOW_HOURS = 72;

/**
 * Poids principaux.
 *
 * Fraîcheur :
 * 35 %
 *
 * Engagement :
 * 35 %
 *
 * Vélocité :
 * 20 %
 *
 * Score existant / pertinence :
 * 10 %
 */
const FRESHNESS_WEIGHT = 0.35;

const ENGAGEMENT_WEIGHT = 0.35;

const VELOCITY_WEIGHT = 0.2;

const RELEVANCE_WEIGHT = 0.1;

/**
 * ============================================================
 * UTILITAIRES
 * ============================================================
 */

function finiteNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value);
}

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

/**
 * Limite sécurisée.
 */
export function normalizeTrendingLimit(limit?: number): number {
  if (limit === undefined || !Number.isFinite(limit)) {
    return DEFAULT_TRENDING_LIMIT;
  }

  return Math.max(1, Math.min(Math.floor(limit), MAX_TRENDING_LIMIT));
}

/**
 * Fenêtre temporelle sécurisée.
 */
export function normalizeTrendingWindow(windowHours?: number): number {
  if (windowHours === undefined || !Number.isFinite(windowHours)) {
    return DEFAULT_TRENDING_WINDOW_HOURS;
  }

  return Math.max(1, Math.min(Math.floor(windowHours), 24 * 30));
}

/**
 * ============================================================
 * MÉTRIQUES
 * ============================================================
 */

/**
 * Récupère le nombre de vues disponible.
 */
export function getViews(item: TrendingItem): number {
  return Math.max(finiteNumber(item.views), finiteNumber(item.viewCount));
}

/**
 * Récupère les likes.
 */
export function getLikes(item: TrendingItem): number {
  return Math.max(finiteNumber(item.likes), finiteNumber(item.likeCount));
}

/**
 * Récupère les sauvegardes.
 */
export function getSaves(item: TrendingItem): number {
  return Math.max(finiteNumber(item.saves), finiteNumber(item.bookmarkCount));
}

/**
 * Récupère les partages.
 */
export function getShares(item: TrendingItem): number {
  return Math.max(finiteNumber(item.shares), finiteNumber(item.shareCount));
}

/**
 * Récupère les commentaires.
 */
export function getComments(item: TrendingItem): number {
  return Math.max(finiteNumber(item.comments), finiteNumber(item.commentCount));
}

/**
 * Récupère les clics.
 */
export function getClicks(item: TrendingItem): number {
  return Math.max(finiteNumber(item.clicks), finiteNumber(item.ctaClicks));
}

/**
 * ============================================================
 * ENGAGEMENT
 * ============================================================
 *
 * On donne plus de poids aux interactions fortes :
 *
 * vue       → 1
 * like      → 3
 * commentaire → 5
 * sauvegarde  → 6
 * partage     → 8
 * clic CTA    → 5
 */
export function calculateEngagement(item: TrendingItem): number {
  const views = getViews(item);

  const likes = getLikes(item);

  const comments = getComments(item);

  const saves = getSaves(item);

  const shares = getShares(item);

  const clicks = getClicks(item);

  const weighted =
    views * 1 + likes * 3 + comments * 5 + saves * 6 + shares * 8 + clicks * 5;

  /**
   * Logarithme pour éviter qu'un seul
   * contenu extrêmement populaire écrase tout.
   */
  return Math.min(100, Math.log1p(weighted) * 8);
}

/**
 * ============================================================
 * ENGAGEMENT RATE
 * ============================================================
 */

export function calculateEngagementRate(item: TrendingItem): number {
  const views = getViews(item);

  if (views <= 0) {
    return 0;
  }

  const interactions =
    getLikes(item) +
    getComments(item) +
    getSaves(item) +
    getShares(item) +
    getClicks(item);

  return Math.min(100, (interactions / views) * 100);
}

/**
 * ============================================================
 * FRAÎCHEUR
 * ============================================================
 */

export function calculateFreshness(
  createdAt?: number,
  now = Date.now(),
  windowHours = DEFAULT_TRENDING_WINDOW_HOURS,
): number {
  if (createdAt === undefined || !Number.isFinite(createdAt)) {
    return 50;
  }

  const ageMs = Math.max(0, now - createdAt);

  const ageHours = ageMs / (1000 * 60 * 60);

  if (ageHours <= 1) {
    return 100;
  }

  if (ageHours >= windowHours) {
    return 5;
  }

  /**
   * Décroissance exponentielle douce.
   */
  const score = 100 * Math.exp(-ageHours / (windowHours * 0.45));

  return Math.max(5, Math.min(100, score));
}

/**
 ============================================================
 * VÉLOCITÉ
 * ============================================================
 *
 * La vélocité cherche à mesurer :
 *
 * interactions / âge
 *
 * afin de favoriser un contenu qui reçoit
 * rapidement de l'attention.
 */
export function calculateVelocity(
  item: TrendingItem,
  now = Date.now(),
): number {
  const createdAt = item.createdAt;

  if (createdAt === undefined || !Number.isFinite(createdAt)) {
    return 0;
  }

  const ageHours = Math.max(0.25, (now - createdAt) / (1000 * 60 * 60));

  const interactions =
    getLikes(item) * 3 +
    getComments(item) * 5 +
    getSaves(item) * 6 +
    getShares(item) * 8 +
    getClicks(item) * 5;

  if (interactions <= 0) {
    return 0;
  }

  /**
   * Interactions par heure,
   * compressées logarithmiquement.
   */
  return Math.min(100, Math.log1p(interactions / ageHours) * 20);
}

/**
 * ============================================================
 * RELEVANCE
 * ============================================================
 */

export function calculateRelevance(
  item: TrendingItem,
  options: TrendingOptions = {},
): number {
  let score = finiteNumber(item.score);

  if (
    options.moduleId &&
    normalizeText(item.moduleId ?? item.type) ===
      normalizeText(options.moduleId)
  ) {
    score += 30;
  }

  if (
    options.city &&
    normalizeText(item.city ?? item.location).includes(
      normalizeText(options.city),
    )
  ) {
    score += 30;
  }

  return Math.min(100, score);
}

/**
 * ============================================================
 * TREND LEVEL
 * ============================================================
 */

export function getTrendLevel(
  score: number,
): "viral" | "hot" | "rising" | "normal" {
  if (score >= 80) {
    return "viral";
  }

  if (score >= 60) {
    return "hot";
  }

  if (score >= 35) {
    return "rising";
  }

  return "normal";
}

/**
 * ============================================================
 * SINGLE ITEM
 * ============================================================
 */

export function scoreTrendingItem<T extends TrendingItem>(
  item: T,
  options: TrendingOptions = {},
): TrendingResult<T> {
  const now = options.now ?? Date.now();

  const windowHours = normalizeTrendingWindow(options.windowHours);

  const freshnessScore = calculateFreshness(item.createdAt, now, windowHours);

  const engagementScore = calculateEngagement(item);

  const velocityScore = calculateVelocity(item, now);

  const relevanceScore = calculateRelevance(item, options);

  const trendingScore = Math.min(
    100,
    Number(
      (
        freshnessScore * FRESHNESS_WEIGHT +
        engagementScore * ENGAGEMENT_WEIGHT +
        velocityScore * VELOCITY_WEIGHT +
        relevanceScore * RELEVANCE_WEIGHT
      ).toFixed(2),
    ),
  );

  return {
    ...item,

    trendingScore,

    freshnessScore,

    engagementScore,

    velocityScore,

    relevanceScore,

    trendLevel: getTrendLevel(trendingScore),
  };
}

/**
 * ============================================================
 * FILTER
 * ============================================================
 */

function isWithinTrendingWindow(
  item: TrendingItem,
  now: number,
  windowHours: number,
): boolean {
  /**
   * Les contenus sans date peuvent être conservés
   * selon l'option.
   */
  if (item.createdAt === undefined || !Number.isFinite(item.createdAt)) {
    return true;
  }

  const ageHours = Math.max(0, (now - item.createdAt) / (1000 * 60 * 60));

  return ageHours <= windowHours;
}

/**
 * ============================================================
 * PIPELINE TRENDING
 * ============================================================
 */

export function getTrendingItems<T extends TrendingItem>(
  items: T[],
  options: TrendingOptions = {},
): TrendingResult<T>[] {
  const now = options.now ?? Date.now();

  const windowHours = normalizeTrendingWindow(options.windowHours);

  const limit = normalizeTrendingLimit(options.limit);

  const includeUndated = options.includeUndated ?? true;

  const filtered = items.filter((item) => {
    /**
     * Filtre temporel.
     */
    if (item.createdAt === undefined && !includeUndated) {
      return false;
    }

    if (!isWithinTrendingWindow(item, now, windowHours)) {
      return false;
    }

    /**
     * Filtre module.
     */
    if (
      options.moduleId &&
      normalizeText(item.moduleId ?? item.type) !==
        normalizeText(options.moduleId)
    ) {
      return false;
    }

    /**
     * Filtre ville.
     */
    if (
      options.city &&
      !normalizeText(item.city ?? item.location).includes(
        normalizeText(options.city),
      )
    ) {
      return false;
    }

    return true;
  });

  const scored = filtered.map((item) => scoreTrendingItem(item, options));

  return scored
    .sort((a, b) => {
      /**
       * Score principal.
       */
      if (a.trendingScore !== b.trendingScore) {
        return b.trendingScore - a.trendingScore;
      }

      /**
       * Vélocité comme second critère.
       */
      if (a.velocityScore !== b.velocityScore) {
        return b.velocityScore - a.velocityScore;
      }

      /**
       * Fraîcheur comme troisième critère.
       */
      return b.freshnessScore - a.freshnessScore;
    })
    .slice(0, limit);
}

/**
 * ============================================================
 * GROUPING PAR MODULE
 * ============================================================
 */

export type TrendingModuleGroup<T extends TrendingItem> = {
  moduleId: string;

  label: string;

  items: TrendingResult<T>[];

  topScore: number;
};

/**
 * Labels affichés dans Explorer.
 */
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
 * Regroupe les tendances par univers.
 */
export function groupTrendingByModule<T extends TrendingItem>(
  items: TrendingResult<T>[],
): TrendingModuleGroup<T>[] {
  const groups = new Map<string, TrendingResult<T>[]>();

  for (const item of items) {
    const moduleId = item.moduleId ?? item.type ?? "publication";

    const existing = groups.get(moduleId);

    if (existing) {
      existing.push(item);
    } else {
      groups.set(moduleId, [item]);
    }
  }

  return Array.from(groups.entries())
    .map(([moduleId, moduleItems]) => ({
      moduleId,

      label: MODULE_LABELS[moduleId] ?? moduleId,

      items: moduleItems.sort((a, b) => b.trendingScore - a.trendingScore),

      topScore: moduleItems[0]?.trendingScore ?? 0,
    }))
    .sort((a, b) => b.topScore - a.topScore);
}

/**
 * ============================================================
 * TRENDING SNAPSHOT
 * ============================================================
 */

export type TrendingSnapshot<T extends TrendingItem> = {
  items: TrendingResult<T>[];

  groups: TrendingModuleGroup<T>[];

  generatedAt: number;

  windowHours: number;
};

/**
 * Construit un snapshot complet
 * utilisé par Explorer.
 */
export function buildTrendingSnapshot<T extends TrendingItem>(
  items: T[],
  options: TrendingOptions = {},
): TrendingSnapshot<T> {
  const windowHours = normalizeTrendingWindow(options.windowHours);

  const trending = getTrendingItems(items, {
    ...options,
    windowHours,
  });

  return {
    items: trending,

    groups: groupTrendingByModule(trending),

    generatedAt: options.now ?? Date.now(),

    windowHours,
  };
}

/**
 * ============================================================
 * TRENDING INSIGHT
 * ============================================================
 */

export function getTrendingInsight(item: TrendingResult<TrendingItem>): string {
  switch (item.trendLevel) {
    case "viral":
      return "Très forte activité en ce moment";

    case "hot":
      return "Très tendance actuellement";

    case "rising":
      return "En forte progression";

    default:
      return "Tendance actuelle";
  }
}
