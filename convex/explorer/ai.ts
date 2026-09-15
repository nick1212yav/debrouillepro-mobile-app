// convex/explorer/ai.ts

/**
 * ============================================================
 * DÉBROUILLEPRO — EXPLORER V2
 * AI ENGINE
 * ============================================================
 *
 * Couche Intelligence Explorer.
 *
 * Responsabilités :
 *
 * - comprendre l'intention de recherche
 * - détecter le contexte utilisateur
 * - suggérer des univers
 * - suggérer des modules
 * - générer des requêtes de recherche
 * - expliquer pourquoi un résultat est proposé
 * - produire un contexte exploitable par DébrouilleAI
 *
 * IMPORTANT :
 *
 * Ce moteur ne fait pas encore appel à un LLM externe.
 *
 * Il constitue la couche "AI orchestration" locale.
 * Elle pourra ensuite être branchée à DébrouilleAI / un LLM
 * sans modifier le reste d'Explorer.
 * ============================================================
 */

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

export type ExplorerAIIntent =
  | "search"
  | "discover"
  | "nearby"
  | "job"
  | "immo"
  | "service"
  | "event"
  | "shopping"
  | "travel"
  | "health"
  | "education"
  | "social"
  | "media"
  | "finance"
  | "transport"
  | "food"
  | "emergency"
  | "unknown";

export type ExplorerAIEntityType =
  | "job"
  | "property"
  | "service"
  | "event"
  | "product"
  | "restaurant"
  | "person"
  | "community"
  | "publication"
  | "module"
  | "universe"
  | "location"
  | "unknown";

export type ExplorerAIContext = {
  city?: string;

  country?: string;

  latitude?: number;

  longitude?: number;

  favoriteModules?: string[];

  interests?: string[];

  preferredUniverses?: string[];

  recentSearches?: string[];

  activeModule?: string;

  language?: string;
};

export type ExplorerAIQuery = {
  query: string;

  context?: ExplorerAIContext;

  limit?: number;
};

export type ExplorerAIIntentResult = {
  intent: ExplorerAIIntent;

  confidence: number;

  entities: ExplorerAIEntity[];

  keywords: string[];

  normalizedQuery: string;

  nearbyRequested: boolean;

  suggestedUniverse?: string;

  suggestedModule?: string;
};

export type ExplorerAIEntity = {
  type: ExplorerAIEntityType;

  value: string;

  confidence: number;
};

export type ExplorerAISuggestion = {
  id: string;

  type: "universe" | "module" | "query" | "action";

  label: string;

  description?: string;

  icon?: string;

  route?: string;

  score: number;

  reason: string;

  metadata?: Record<string, unknown>;
};

export type ExplorerAIResponse = {
  query: string;

  normalizedQuery: string;

  intent: ExplorerAIIntentResult;

  suggestions: ExplorerAISuggestion[];

  searchQueries: string[];

  explanations: string[];

  generatedAt: number;
};

/**
 * ============================================================
 * CONSTANTES
 * ============================================================
 */

export const DEFAULT_AI_LIMIT = 10;

export const MAX_AI_LIMIT = 30;

/**
 * ============================================================
 * DICTIONNAIRES
 * ============================================================
 */

const INTENT_KEYWORDS: Record<ExplorerAIIntent, string[]> = {
  search: ["chercher", "rechercher", "trouver", "cherche", "recherche"],

  discover: [
    "decouvrir",
    "decouverte",
    "explorer",
    "voir",
    "montre",
    "suggestion",
    "suggestions",
  ],

  nearby: [
    "pres",
    "proche",
    "proximite",
    "autour",
    "alentours",
    "ici",
    "pres de moi",
    "a cote",
  ],

  job: [
    "job",
    "emploi",
    "travail",
    "poste",
    "recrutement",
    "recrute",
    "embauche",
    "cv",
    "carriere",
    "mission",
    "freelance",
  ],

  immo: [
    "immobilier",
    "immo",
    "maison",
    "appartement",
    "studio",
    "logement",
    "location",
    "louer",
    "vente",
    "acheter",
  ],

  service: [
    "service",
    "artisan",
    "plombier",
    "electricien",
    "reparation",
    "reparer",
    "aide",
    "prestataire",
    "professionnel",
  ],

  event: [
    "evenement",
    "evenements",
    "sortie",
    "concert",
    "festival",
    "agenda",
    "activite",
    "rencontre",
  ],

  shopping: [
    "acheter",
    "achat",
    "produit",
    "produits",
    "marketplace",
    "boutique",
    "occasion",
    "vendre",
    "vente",
    "prix",
  ],

  travel: [
    "voyage",
    "voyager",
    "destination",
    "hotel",
    "hebergement",
    "vacances",
    "tourisme",
    "billet",
  ],

  health: [
    "sante",
    "medecin",
    "docteur",
    "hopital",
    "pharmacie",
    "pharmacie",
    "nutrition",
    "bien etre",
    "telemedecine",
  ],

  education: [
    "cours",
    "formation",
    "apprendre",
    "ecole",
    "universite",
    "education",
    "competence",
    "certification",
    "mentor",
  ],

  social: [
    "communaute",
    "community",
    "groupe",
    "amis",
    "reseau",
    "social",
    "rencontre",
  ],

  media: [
    "video",
    "videos",
    "article",
    "actualite",
    "news",
    "story",
    "stories",
    "reel",
    "reels",
    "stream",
    "streaming",
  ],

  finance: [
    "argent",
    "finance",
    "budget",
    "paiement",
    "revenu",
    "wallet",
    "portefeuille",
  ],

  transport: [
    "transport",
    "voiture",
    "taxi",
    "chauffeur",
    "trajet",
    "mobilite",
    "livraison",
  ],

  food: [
    "restaurant",
    "restauration",
    "manger",
    "repas",
    "cuisine",
    "food",
    "menu",
    "restaurant",
  ],

  emergency: [
    "urgence",
    "urgent",
    "sos",
    "danger",
    "police",
    "secours",
    "accident",
  ],

  unknown: [],
};

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

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeLimit(limit?: number): number {
  if (limit === undefined || !Number.isFinite(limit)) {
    return DEFAULT_AI_LIMIT;
  }

  return Math.max(1, Math.min(Math.floor(limit), MAX_AI_LIMIT));
}

/**
 * ============================================================
 * TOKENIZATION
 * ============================================================
 */

export function tokenizeQuery(query: string): string[] {
  return normalizeText(query)
    .split(/\s+/)
    .map((token) => token.replace(/[^\p{L}\p{N}-]/gu, ""))
    .filter((token) => token.length >= 2);
}

/**
 * ============================================================
 * INTENT DETECTION
 * ============================================================
 */

export function detectExplorerIntent(query: string): ExplorerAIIntentResult {
  const normalizedQuery = normalizeText(query);

  const tokens = tokenizeQuery(query);

  if (!normalizedQuery) {
    return {
      intent: "unknown",

      confidence: 0,

      entities: [],

      keywords: [],

      normalizedQuery,

      nearbyRequested: false,
    };
  }

  const scores = new Map<ExplorerAIIntent, number>();

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [
    ExplorerAIIntent,
    string[],
  ][]) {
    let score = 0;

    for (const keyword of keywords) {
      const normalizedKeyword = normalizeText(keyword);

      if (!normalizedKeyword) {
        continue;
      }

      if (normalizedQuery.includes(normalizedKeyword)) {
        score += normalizedKeyword.length >= 7 ? 3 : 2;
      }

      if (tokens.includes(normalizedKeyword)) {
        score += 2;
      }
    }

    if (score > 0) {
      scores.set(intent, score);
    }
  }

  let bestIntent: ExplorerAIIntent | undefined;

  let bestScore = 0;

  for (const [intent, score] of scores) {
    if (score > bestScore) {
      bestIntent = intent;

      bestScore = score;
    }
  }

  const intent = bestIntent ?? "unknown";

  const confidence = bestScore === 0 ? 0 : clamp(bestScore * 12);

  const nearbyRequested = INTENT_KEYWORDS.nearby.some((keyword) =>
    normalizedQuery.includes(normalizeText(keyword)),
  );

  const entities = extractExplorerEntities(normalizedQuery, intent);

  return {
    intent,

    confidence,

    entities,

    keywords: tokens,

    normalizedQuery,

    nearbyRequested,

    suggestedUniverse: getSuggestedUniverse(intent),

    suggestedModule: getSuggestedModule(intent),
  };
}

/**
 * ============================================================
 * ENTITY EXTRACTION
 * ============================================================
 */

export function extractExplorerEntities(
  query: string,
  intent: ExplorerAIIntent,
): ExplorerAIEntity[] {
  const normalized = normalizeText(query);

  const entities: ExplorerAIEntity[] = [];

  /**
   * Localisation.
   */
  const locationPatterns = [
    /(?:a|à|dans|sur|pres de|près de)\s+([a-zà-ÿ-]{3,})/i,
  ];

  for (const pattern of locationPatterns) {
    const match = normalized.match(pattern);

    if (
      match?.[1] &&
      !INTENT_KEYWORDS.nearby.includes(normalizeText(match[1]))
    ) {
      entities.push({
        type: "location",

        value: match[1],

        confidence: 55,
      });
    }
  }

  /**
   * Type d'entité principal.
   */
  const entityType = getEntityTypeForIntent(intent);

  if (entityType !== "unknown") {
    entities.push({
      type: entityType,

      value: normalized,

      confidence: 60,
    });
  }

  return entities;
}

/**
 * ============================================================
 * INTENT → ENTITY
 * ============================================================
 */

function getEntityTypeForIntent(
  intent: ExplorerAIIntent,
): ExplorerAIEntityType {
  switch (intent) {
    case "job":
      return "job";

    case "immo":
      return "property";

    case "service":
      return "service";

    case "event":
      return "event";

    case "shopping":
      return "product";

    case "travel":
      return "location";

    case "health":
      return "service";

    case "education":
      return "module";

    case "social":
      return "community";

    case "media":
      return "publication";

    case "food":
      return "restaurant";

    case "nearby":
      return "location";

    default:
      return "unknown";
  }
}

/**
 * ============================================================
 * INTENT → UNIVERS
 * ============================================================
 */

function getSuggestedUniverse(intent: ExplorerAIIntent): string | undefined {
  switch (intent) {
    case "job":
      return "emploi";

    case "immo":
      return "immobilier";

    case "service":
      return "services";

    case "event":
      return "evenements";

    case "shopping":
      return "commerce";

    case "travel":
      return "voyages";

    case "health":
      return "sante";

    case "education":
      return "education";

    case "social":
      return "social";

    case "media":
      return "media";

    case "finance":
      return "finance";

    case "transport":
      return "transport";

    case "food":
      return "commerce";

    case "emergency":
      return "securite";

    default:
      return undefined;
  }
}

/**
 * ============================================================
 * INTENT → MODULE
 * ============================================================
 */

function getSuggestedModule(intent: ExplorerAIIntent): string | undefined {
  switch (intent) {
    case "job":
      return "jobs";

    case "immo":
      return "immo";

    case "service":
      return "services";

    case "event":
      return "evenements";

    case "shopping":
      return "marketplace";

    case "travel":
      return "voyages";

    case "health":
      return "sante";

    case "education":
      return "apprendre";

    case "social":
      return "community";

    case "media":
      return "media";

    case "finance":
      return "finances";

    case "transport":
      return "transport";

    case "food":
      return "restauration";

    case "emergency":
      return "sos";

    default:
      return undefined;
  }
}

/**
 * ============================================================
 * CONTEXT AWARENESS
 * ============================================================
 */

export function enhanceQueryWithContext(
  query: string,
  context?: ExplorerAIContext,
): string {
  const parts = [query];

  if (context?.city) {
    parts.push(context.city);
  }

  if (context?.interests && context.interests.length > 0) {
    parts.push(context.interests.slice(0, 3).join(" "));
  }

  return parts.filter(Boolean).join(" ").trim();
}

/**
 * ============================================================
 * SEARCH QUERY GENERATION
 * ============================================================
 */

export function generateSearchQueries(
  query: string,
  intent: ExplorerAIIntentResult,
  context?: ExplorerAIContext,
): string[] {
  const queries: string[] = [];

  const base = normalizeText(query);

  if (base) {
    queries.push(base);
  }

  if (intent.suggestedUniverse) {
    queries.push([base, intent.suggestedUniverse].filter(Boolean).join(" "));
  }

  if (intent.suggestedModule) {
    queries.push([base, intent.suggestedModule].filter(Boolean).join(" "));
  }

  if (context?.city) {
    queries.push([base, context.city].filter(Boolean).join(" "));
  }

  if (intent.nearbyRequested && context?.city) {
    queries.push([base, context.city, "proche"].filter(Boolean).join(" "));
  }

  return Array.from(new Set(queries.filter(Boolean))).slice(0, 8);
}

/**
 * ============================================================
 * SUGGESTIONS
 * ============================================================
 */

export function generateExplorerSuggestions(
  intent: ExplorerAIIntentResult,
  context?: ExplorerAIContext,
  limit = DEFAULT_AI_LIMIT,
): ExplorerAISuggestion[] {
  const suggestions: ExplorerAISuggestion[] = [];

  const safeLimit = normalizeLimit(limit);

  /**
   * Univers suggéré.
   */
  if (intent.suggestedUniverse) {
    suggestions.push({
      id: `universe:${intent.suggestedUniverse}`,

      type: "universe",

      label: getUniverseLabel(intent.suggestedUniverse),

      description: "Explorez cet univers.",

      icon: "compass",

      route: `/explorer?universe=${encodeURIComponent(
        intent.suggestedUniverse,
      )}`,

      score: intent.confidence + 15,

      reason: "Correspond à votre recherche.",
    });
  }

  /**
   * Module suggéré.
   */
  if (intent.suggestedModule) {
    suggestions.push({
      id: `module:${intent.suggestedModule}`,

      type: "module",

      label: getModuleLabel(intent.suggestedModule),

      description: "Accédez directement au module.",

      icon: "arrow-right",

      route: `/${intent.suggestedModule}`,

      score: intent.confidence,

      reason: "Module directement lié à votre intention.",
    });
  }

  /**
   * Recherche à proximité.
   */
  if (intent.nearbyRequested) {
    suggestions.push({
      id: "action:nearby",

      type: "action",

      label: "À proximité",

      description: context?.city
        ? `Découvrez ce qui se passe près de ${context.city}.`
        : "Découvrez ce qui se passe près de vous.",

      icon: "map-pin",

      route: "/explorer?mode=nearby",

      score: 88,

      reason: "Votre recherche semble demander une proximité géographique.",
    });
  }

  /**
   * Découverte générale.
   */
  if (intent.intent === "discover" || intent.intent === "unknown") {
    suggestions.push({
      id: "action:discover",

      type: "action",

      label: "Découvrir",

      description: "Explorez les tendances et opportunités du moment.",

      icon: "sparkles",

      route: "/explorer",

      score: 70,

      reason: "Votre demande semble orientée découverte.",
    });
  }

  /**
   * Tendances.
   */
  suggestions.push({
    id: "action:trending",

    type: "action",

    label: "Tendances",

    description: "Découvrez ce qui attire actuellement l'attention.",

    icon: "flame",

    route: "/explorer?mode=trending",

    score: intent.intent === "discover" ? 82 : 45,

    reason: "Permet d'explorer les contenus populaires.",
  });

  /**
   * Personnalisation.
   */
  if (context?.favoriteModules && context.favoriteModules.length > 0) {
    suggestions.push({
      id: "action:for-you",

      type: "action",

      label: "Pour vous",

      description: "Suggestions basées sur vos centres d'intérêt.",

      icon: "sparkles",

      route: "/explorer?mode=for-you",

      score: 80,

      reason: "Vous avez des modules favoris.",
    });
  }

  return suggestions.sort((a, b) => b.score - a.score).slice(0, safeLimit);
}

/**
 * ============================================================
 * LABELS
 * ============================================================
 */

function getUniverseLabel(universe: string): string {
  const labels: Record<string, string> = {
    emploi: "Emploi & Carrière",

    immobilier: "Immobilier & Logement",

    services: "Services",

    commerce: "Commerce & Marketplace",

    evenements: "Événements & Sorties",

    social: "Communautés & Réseau",

    sante: "Santé & Bien-être",

    education: "Éducation & Apprentissage",

    voyages: "Voyages & Découvertes",

    finance: "Finance & Argent",

    transport: "Transport & Mobilité",

    media: "Média & Création",

    securite: "Sécurité & Urgence",
  };

  return labels[universe] ?? "Découvrir";
}

function getModuleLabel(module: string): string {
  const labels: Record<string, string> = {
    jobs: "Emplois",

    job: "Emploi",

    immo: "Immobilier",

    services: "Services",

    service: "Service",

    evenements: "Événements",

    marketplace: "Marketplace",

    voyages: "Voyages",

    sante: "Santé",

    community: "Community",

    media: "Média",

    finances: "Finances",

    transport: "Transport",

    restauration: "Restauration",

    sos: "SOS",
  };

  return labels[module] ?? module;
}

/**
 * ============================================================
 * EXPLANATIONS
 * ============================================================
 */

export function generateExplorerExplanations(
  intent: ExplorerAIIntentResult,
  context?: ExplorerAIContext,
): string[] {
  const explanations: string[] = [];

  switch (intent.intent) {
    case "job":
      explanations.push("Nous avons détecté une recherche liée à l'emploi.");
      break;

    case "immo":
      explanations.push("Nous avons détecté une recherche immobilière.");
      break;

    case "service":
      explanations.push("Nous avons identifié un besoin de service.");
      break;

    case "event":
      explanations.push("Nous avons identifié une recherche d'événement.");
      break;

    case "shopping":
      explanations.push(
        "Nous avons identifié une intention d'achat ou de vente.",
      );
      break;

    case "travel":
      explanations.push("Nous avons identifié une intention liée au voyage.");
      break;

    case "nearby":
      explanations.push(
        "Votre demande semble rechercher des éléments proches de vous.",
      );
      break;

    case "discover":
      explanations.push(
        "Nous vous proposons des découvertes adaptées à votre demande.",
      );
      break;

    default:
      explanations.push(
        "Nous allons explorer DébrouillePro à partir de votre recherche.",
      );
  }

  if (context?.city) {
    explanations.push(`Le contexte local ${context.city} est pris en compte.`);
  }

  if (context?.interests && context.interests.length > 0) {
    explanations.push(
      "Vos centres d'intérêt peuvent être utilisés pour personnaliser les résultats.",
    );
  }

  return explanations;
}

/**
 * ============================================================
 * AI PIPELINE
 * ============================================================
 */

export function analyzeExplorerQuery(
  input: ExplorerAIQuery,
): ExplorerAIResponse {
  const query = input.query.trim();

  const context = input.context;

  const intent = detectExplorerIntent(query);

  const contextualQuery = enhanceQueryWithContext(query, context);

  const searchQueries = generateSearchQueries(contextualQuery, intent, context);

  const suggestions = generateExplorerSuggestions(intent, context, input.limit);

  const explanations = generateExplorerExplanations(intent, context);

  return {
    query,

    normalizedQuery: contextualQuery,

    intent,

    suggestions,

    searchQueries,

    explanations,

    generatedAt: Date.now(),
  };
}

/**
 * ============================================================
 * SMART QUERY
 * ============================================================
 */

export function buildSmartExplorerQuery(
  query: string,
  context?: ExplorerAIContext,
): string {
  const intent = detectExplorerIntent(query);

  const parts = [normalizeText(query)];

  if (intent.suggestedUniverse) {
    parts.push(intent.suggestedUniverse);
  }

  if (context?.city) {
    parts.push(context.city);
  }

  return Array.from(new Set(parts.filter(Boolean))).join(" ");
}

/**
 * ============================================================
 * QUICK ACTIONS
 * ============================================================
 */

export function getAIQuickActions(
  context?: ExplorerAIContext,
): ExplorerAISuggestion[] {
  const actions: ExplorerAISuggestion[] = [
    {
      id: "ai:nearby",

      type: "action",

      label: "Que se passe-t-il près de moi ?",

      icon: "map-pin",

      route: "/explorer?mode=nearby",

      score: 90,

      reason: "Découverte locale.",
    },

    {
      id: "ai:opportunities",

      type: "action",

      label: "Quelles opportunités pour moi ?",

      icon: "sparkles",

      route: "/explorer?mode=opportunities",

      score: 88,

      reason: "Recherche d'opportunités personnalisées.",
    },

    {
      id: "ai:trending",

      type: "action",

      label: "Qu'est-ce qui est tendance ?",

      icon: "flame",

      route: "/explorer?mode=trending",

      score: 82,

      reason: "Découverte des tendances.",
    },

    {
      id: "ai:discover",

      type: "action",

      label: "Fais-moi découvrir quelque chose",

      icon: "compass",

      route: "/explorer?mode=discover",

      score: 80,

      reason: "Découverte aléatoire et personnalisée.",
    },
  ];

  if (context?.city) {
    actions[0].description = `Explorer autour de ${context.city}.`;
  }

  return actions;
}

/**
 * ============================================================
 * AI CONTEXT
 * ============================================================
 */

export type ExplorerAIContextSnapshot = {
  query: string;

  intent: ExplorerAIIntent;

  confidence: number;

  universe?: string;

  module?: string;

  nearby: boolean;

  city?: string;

  keywords: string[];

  generatedAt: number;
};

export function buildAIContextSnapshot(
  query: string,
  context?: ExplorerAIContext,
): ExplorerAIContextSnapshot {
  const result = detectExplorerIntent(query);

  return {
    query,

    intent: result.intent,

    confidence: result.confidence,

    universe: result.suggestedUniverse,

    module: result.suggestedModule,

    nearby: result.nearbyRequested,

    city: context?.city,

    keywords: result.keywords,

    generatedAt: Date.now(),
  };
}

/**
 * ============================================================
 * AI EXPLANATION
 * ============================================================
 */

export function explainSuggestion(suggestion: ExplorerAISuggestion): string {
  return suggestion.reason;
}

/**
 * ============================================================
 * DEFAULT AI PROMPT
 * ============================================================
 *
 * Utile plus tard pour brancher un LLM.
 * ============================================================
 */

export function buildExplorerAIPrompt(
  query: string,
  context?: ExplorerAIContext,
): string {
  const contextLines = [
    context?.city ? `Ville: ${context.city}` : "",

    context?.country ? `Pays: ${context.country}` : "",

    context?.activeModule ? `Module actif: ${context.activeModule}` : "",

    context?.favoriteModules?.length
      ? `Modules favoris: ${context.favoriteModules.join(", ")}`
      : "",

    context?.interests?.length
      ? `Centres d'intérêt: ${context.interests.join(", ")}`
      : "",
  ].filter(Boolean);

  return [
    "Tu es DébrouilleAI, l'intelligence de découverte de DébrouillePro.",

    "Ta mission est d'aider l'utilisateur à trouver rapidement ce qui lui est utile.",

    `Recherche utilisateur: ${query}`,

    contextLines.length
      ? `Contexte utilisateur:\n${contextLines.join("\n")}`
      : "",

    "Priorités:",
    "1. Comprendre l'intention.",
    "2. Privilégier les résultats pertinents.",
    "3. Utiliser la proximité lorsque disponible.",
    "4. Personnaliser sans être intrusif.",
    "5. Proposer une action concrète.",
  ]
    .filter(Boolean)
    .join("\n\n");
}
