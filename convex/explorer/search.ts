// convex/explorer/search.ts

/**
 * ============================================================
 * DÉBROUILLEPRO — EXPLORER V2
 * UNIVERSAL SEARCH ENGINE
 * ============================================================
 *
 * Moteur de recherche universelle d'Explorer.
 *
 * Responsabilités :
 * - normaliser la requête utilisateur
 * - rechercher dans plusieurs champs
 * - gérer plusieurs mots-clés
 * - détecter les modules pertinents
 * - calculer un score de pertinence
 * - supporter les recherches par intention simple
 *
 * Ce fichier ne dépend d'aucune table Convex.
 * Les données sont fournies sous forme d'ExplorerSearchItem.
 * ============================================================
 */

/**
 * Modules actuellement compris par Explorer.
 *
 * On reste volontairement aligné sur les modules réellement
 * présents dans ton Explorer.
 */
export type ExplorerSearchModule =
  | "job"
  | "immo"
  | "service"
  | "restaurant"
  | "event"
  | "product"
  | "publication"
  | "person"
  | "community"
  | "voyages"
  | "education"
  | "sante"
  | "transport"
  | "all";

/**
 * Élément recherchable par Explorer.
 */
export type ExplorerSearchItem = {
  id: string;

  type: string;

  moduleId?: string;

  title: string;

  description?: string;

  subtitle?: string;

  category?: string;

  location?: string;

  city?: string;

  country?: string;

  tags?: string[];

  keywords?: string[];

  authorName?: string;

  metadata?: Record<string, unknown>;

  score?: number;

  createdAt?: number;
};

/**
 * Contexte facultatif de recherche.
 */
export type ExplorerSearchContext = {
  city?: string;

  country?: string;

  preferredModules?: string[];

  interests?: string[];

  now?: number;
};

/**
 * Options du moteur de recherche.
 */
export type ExplorerSearchOptions = {
  module?: ExplorerSearchModule;

  limit?: number;

  minScore?: number;

  context?: ExplorerSearchContext;
};

/**
 * Résultat enrichi.
 */
export type ExplorerSearchResult<T extends ExplorerSearchItem> = T & {
  searchScore: number;

  matchedFields: string[];

  matchedTerms: string[];

  relevance: "high" | "medium" | "low";
};

/**
 * Limites du moteur.
 */
export const DEFAULT_SEARCH_LIMIT = 20;

export const MAX_SEARCH_LIMIT = 100;

/**
 * ============================================================
 * NORMALISATION
 * ============================================================
 */

export function normalizeSearchText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Transforme une phrase en termes de recherche.
 */
export function tokenizeSearchQuery(query: string): string[] {
  const normalized = normalizeSearchText(query);

  if (!normalized) {
    return [];
  }

  return Array.from(
    new Set(
      normalized
        .split(/[\s,;|/]+/)
        .map((term) => term.trim())
        .filter((term) => term.length >= 2),
    ),
  );
}

/**
 * ============================================================
 * SYNONYMES
 * ============================================================
 *
 * Première couche du futur moteur sémantique.
 *
 * Exemple :
 * "emploi" → job
 * "appartement" → immo
 * "restaurant" → restaurant
 */
const SEARCH_SYNONYMS: Record<string, string[]> = {
  emploi: ["job", "travail", "recrutement", "poste"],

  travail: ["job", "emploi", "recrutement", "poste"],

  boulot: ["job", "emploi", "travail"],

  appartement: ["appartement", "logement", "studio", "maison", "immo"],

  maison: ["maison", "logement", "appartement", "immo"],

  logement: ["logement", "appartement", "maison", "immo"],

  voiture: ["voiture", "auto", "vehicule", "transport"],

  restaurant: ["restaurant", "restauration", "manger", "cuisine"],

  evenement: ["evenement", "event", "sortie", "concert", "festival"],

  produit: ["produit", "article", "achat", "marketplace"],

  vente: ["vente", "acheter", "achat", "produit", "marketplace"],

  formation: ["formation", "cours", "education", "apprentissage"],

  ecole: ["ecole", "education", "formation", "cours"],

  medecin: ["medecin", "sante", "docteur", "hopital", "clinique"],

  voyage: ["voyage", "vacances", "destination", "tourisme"],

  service: ["service", "prestataire", "aide", "professionnel"],
};

/**
 * Retourne les synonymes d'un terme.
 */
export function expandSearchTerm(term: string): string[] {
  const normalized = normalizeSearchText(term);

  if (!normalized) {
    return [];
  }

  return Array.from(
    new Set([normalized, ...(SEARCH_SYNONYMS[normalized] ?? [])]),
  );
}

/**
 * Développe tous les termes de la requête.
 */
export function expandSearchQuery(query: string): string[] {
  const terms = tokenizeSearchQuery(query);

  return Array.from(new Set(terms.flatMap(expandSearchTerm)));
}

/**
 * ============================================================
 * MODULE DETECTION
 * ============================================================
 */

const MODULE_KEYWORDS: Record<
  Exclude<ExplorerSearchModule, "all">,
  string[]
> = {
  job: [
    "job",
    "emploi",
    "travail",
    "boulot",
    "recrutement",
    "poste",
    "carriere",
    "cv",
  ],

  immo: [
    "immo",
    "immobilier",
    "appartement",
    "maison",
    "logement",
    "terrain",
    "location",
    "loyer",
    "vente",
  ],

  service: [
    "service",
    "prestataire",
    "reparation",
    "coiffeur",
    "plombier",
    "electricien",
    "menage",
    "livraison",
  ],

  restaurant: [
    "restaurant",
    "restauration",
    "manger",
    "cuisine",
    "repas",
    "bar",
    "cafe",
  ],

  event: [
    "evenement",
    "event",
    "concert",
    "festival",
    "conference",
    "sortie",
    "agenda",
  ],

  product: [
    "produit",
    "marketplace",
    "achat",
    "vente",
    "acheter",
    "article",
    "occasion",
  ],

  publication: ["publication", "post", "actualite", "article", "news"],

  person: ["personne", "profil", "utilisateur", "professionnel", "expert"],

  community: ["communaute", "groupe", "association", "network", "reseau"],

  voyages: [
    "voyage",
    "vacances",
    "destination",
    "tourisme",
    "hotel",
    "hebergement",
  ],

  education: [
    "education",
    "ecole",
    "cours",
    "formation",
    "apprentissage",
    "universite",
  ],

  sante: ["sante", "medecin", "docteur", "hopital", "clinique", "pharmacie"],

  transport: ["transport", "voiture", "bus", "taxi", "mobilite", "livraison"],
};

/**
 * Détecte les modules correspondant à une requête.
 */
export function detectSearchModules(query: string): ExplorerSearchModule[] {
  const terms = expandSearchQuery(query);

  if (terms.length === 0) {
    return ["all"];
  }

  const detected: Array<{
    module: ExplorerSearchModule;
    score: number;
  }> = [];

  for (const [module, keywords] of Object.entries(MODULE_KEYWORDS) as Array<
    [Exclude<ExplorerSearchModule, "all">, string[]]
  >) {
    let score = 0;

    for (const term of terms) {
      if (keywords.includes(term)) {
        score += 1;
      }
    }

    if (score > 0) {
      detected.push({
        module,
        score,
      });
    }
  }

  detected.sort((a, b) => b.score - a.score);

  return detected.length > 0 ? detected.map((item) => item.module) : ["all"];
}

/**
 * ============================================================
 * SEARCHABLE FIELDS
 * ============================================================
 */

type SearchField = {
  name: string;

  value: string;

  weight: number;
};

function getSearchFields(item: ExplorerSearchItem): SearchField[] {
  const fields: SearchField[] = [
    {
      name: "title",
      value: normalizeSearchText(item.title),
      weight: 10,
    },

    {
      name: "description",
      value: normalizeSearchText(item.description),
      weight: 5,
    },

    {
      name: "subtitle",
      value: normalizeSearchText(item.subtitle),
      weight: 6,
    },

    {
      name: "category",
      value: normalizeSearchText(item.category),
      weight: 8,
    },

    {
      name: "location",
      value: normalizeSearchText(item.location),
      weight: 5,
    },

    {
      name: "city",
      value: normalizeSearchText(item.city),
      weight: 7,
    },

    {
      name: "country",
      value: normalizeSearchText(item.country),
      weight: 3,
    },

    {
      name: "authorName",
      value: normalizeSearchText(item.authorName),
      weight: 4,
    },

    {
      name: "moduleId",
      value: normalizeSearchText(item.moduleId),
      weight: 7,
    },
  ];

  if (Array.isArray(item.tags)) {
    fields.push({
      name: "tags",
      value: normalizeSearchText(item.tags.join(" ")),
      weight: 6,
    });
  }

  if (Array.isArray(item.keywords)) {
    fields.push({
      name: "keywords",
      value: normalizeSearchText(item.keywords.join(" ")),
      weight: 8,
    });
  }

  return fields.filter((field) => field.value.length > 0);
}

/**
 * ============================================================
 * TERM MATCHING
 * ============================================================
 */

function scoreTermAgainstField(term: string, field: SearchField): number {
  if (!term || !field.value) {
    return 0;
  }

  /**
   * Match exact au début du titre.
   */
  if (field.name === "title" && field.value.startsWith(term)) {
    return field.weight * 1.5;
  }

  /**
   * Match exact du champ.
   */
  if (field.value === term) {
    return field.weight * 1.4;
  }

  /**
   * Match sur un mot.
   */
  const words = field.value.split(/[\s,;|/.-]+/);

  if (words.includes(term)) {
    return field.weight * 1.15;
  }

  /**
   * Match partiel.
   */
  if (field.value.includes(term)) {
    return field.weight;
  }

  return 0;
}

/**
 * ============================================================
 * CONTEXT SCORING
 * ============================================================
 */

function scoreContext(
  item: ExplorerSearchItem,
  context?: ExplorerSearchContext,
): number {
  if (!context) {
    return 0;
  }

  let score = 0;

  const city = normalizeSearchText(context.city);

  const itemCity = normalizeSearchText(item.city);

  if (
    city &&
    itemCity &&
    (itemCity === city || itemCity.includes(city) || city.includes(itemCity))
  ) {
    score += 10;
  }

  const interests = Array.isArray(context.interests)
    ? context.interests.map(normalizeSearchText)
    : [];

  const searchable = normalizeSearchText(
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

  for (const interest of interests) {
    if (interest && searchable.includes(interest)) {
      score += 5;
    }
  }

  if (
    item.moduleId &&
    context.preferredModules?.some(
      (module) =>
        normalizeSearchText(module) === normalizeSearchText(item.moduleId),
    )
  ) {
    score += 8;
  }

  return score;
}

/**
 * ============================================================
 * SINGLE ITEM SCORING
 * ============================================================
 */

export function scoreSearchItem(
  item: ExplorerSearchItem,
  query: string,
  context?: ExplorerSearchContext,
): ExplorerSearchResult<ExplorerSearchItem> {
  const queryTerms = tokenizeSearchQuery(query);

  const expandedTerms = expandSearchQuery(query);

  const fields = getSearchFields(item);

  const matchedFields = new Set<string>();

  const matchedTerms = new Set<string>();

  let score = item.score ?? 0;

  /**
   * Score principal de recherche.
   */
  for (const term of expandedTerms) {
    let bestTermScore = 0;

    for (const field of fields) {
      const fieldScore = scoreTermAgainstField(term, field);

      if (fieldScore > 0) {
        matchedFields.add(field.name);

        matchedTerms.add(term);

        bestTermScore = Math.max(bestTermScore, fieldScore);
      }
    }

    score += bestTermScore;
  }

  /**
   * Bonus lorsque tous les termes
   * originaux sont présents.
   */
  if (
    queryTerms.length > 0 &&
    queryTerms.every(
      (term) =>
        expandedTerms.includes(term) &&
        fields.some((field) => field.value.includes(term)),
    )
  ) {
    score += 12;
  }

  /**
   * Bonus contexte utilisateur.
   */
  score += scoreContext(item, context);

  /**
   * Bonus module préféré.
   */
  if (
    item.moduleId &&
    context?.preferredModules?.some(
      (module) =>
        normalizeSearchText(module) === normalizeSearchText(item.moduleId),
    )
  ) {
    score += 5;
  }

  /**
   * Normalisation finale.
   */
  const searchScore = Math.max(0, Math.min(100, Number(score.toFixed(2))));

  const relevance =
    searchScore >= 60 ? "high" : searchScore >= 30 ? "medium" : "low";

  return {
    ...item,

    searchScore,

    matchedFields: Array.from(matchedFields),

    matchedTerms: Array.from(matchedTerms),

    relevance,
  };
}

/**
 * ============================================================
 * MODULE FILTER
 * ============================================================
 */

function matchesModule(
  item: ExplorerSearchItem,
  module?: ExplorerSearchModule,
): boolean {
  if (!module || module === "all") {
    return true;
  }

  const normalizedModule = normalizeSearchText(module);

  const itemModule = normalizeSearchText(item.moduleId);

  const itemType = normalizeSearchText(item.type);

  return itemModule === normalizedModule || itemType === normalizedModule;
}

/**
 * ============================================================
 * SEARCH PIPELINE
 * ============================================================
 */

export function searchExplorerItems<T extends ExplorerSearchItem>(
  items: T[],
  query: string,
  options: ExplorerSearchOptions = {},
): ExplorerSearchResult<T>[] {
  const normalizedQuery = normalizeSearchText(query);

  const limit = Math.max(
    1,
    Math.min(
      Math.floor(options.limit ?? DEFAULT_SEARCH_LIMIT),
      MAX_SEARCH_LIMIT,
    ),
  );

  /**
   * Recherche vide :
   *
   * on ne retourne pas arbitrairement
   * tous les éléments comme résultats.
   */
  if (!normalizedQuery) {
    return [];
  }

  const detectedModules = detectSearchModules(query);

  const requestedModule = options.module;

  const effectiveModule =
    requestedModule && requestedModule !== "all" ? requestedModule : undefined;

  /**
   * On utilise le module explicitement demandé
   * lorsqu'il existe.
   */
  const filtered = items.filter((item) => {
    if (effectiveModule && !matchesModule(item, effectiveModule)) {
      return false;
    }

    /**
     * Si Explorer a détecté un module,
     * on donne priorité aux éléments de ce module,
     * mais on ne les exclut pas automatiquement.
     *
     * Cela permet une recherche réellement universelle.
     */
    return true;
  });

  const scored = filtered
    .map((item) => scoreSearchItem(item, normalizedQuery, options.context))
    .filter((item) => item.searchScore >= (options.minScore ?? 1));

  /**
   * Bonus pour les modules détectés.
   */
  const boosted = scored.map((item) => {
    const module = normalizeSearchText(item.moduleId ?? item.type);

    const detected = detectedModules.some(
      (detectedModule) => normalizeSearchText(detectedModule) === module,
    );

    if (!detected) {
      return item;
    }

    return {
      ...item,
      searchScore: Math.min(100, Number((item.searchScore + 8).toFixed(2))),
    };
  });

  return boosted
    .sort((a, b) => b.searchScore - a.searchScore)
    .slice(0, limit) as ExplorerSearchResult<T>[];
}

/**
 * ============================================================
 * SEARCH SUMMARY
 * ============================================================
 */

export type ExplorerSearchSummary = {
  query: string;

  normalizedQuery: string;

  terms: string[];

  expandedTerms: string[];

  detectedModules: ExplorerSearchModule[];

  resultCount: number;
};

/**
 * Construit les informations de compréhension
 * d'une recherche.
 */
export function buildSearchSummary(
  query: string,
  resultCount = 0,
): ExplorerSearchSummary {
  return {
    query,

    normalizedQuery: normalizeSearchText(query),

    terms: tokenizeSearchQuery(query),

    expandedTerms: expandSearchQuery(query),

    detectedModules: detectSearchModules(query),

    resultCount,
  };
}
