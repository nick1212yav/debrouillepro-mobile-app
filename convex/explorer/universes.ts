// convex/explorer/universes.ts

/**
 * ============================================================
 * DÉBROUILLEPRO — EXPLORER V2
 * UNIVERSES ENGINE
 * ============================================================
 *
 * Moteur des "Univers" Explorer.
 *
 * Responsabilités :
 *
 * - définir les univers de découverte
 * - normaliser les modules
 * - regrouper les modules par univers
 * - filtrer les univers
 * - rechercher dans les univers
 * - calculer un score de découverte
 * - classer les univers
 * - produire un snapshot prêt pour le frontend
 *
 * IMPORTANT :
 *
 * Ce fichier ne dépend d'aucune table Convex.
 *
 * Le frontend ou un autre moteur peut lui transmettre
 * les modules provenant du ModuleRegistry.
 * ============================================================
 */

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

export type ExplorerUniverseId =
  | "emploi"
  | "immobilier"
  | "services"
  | "commerce"
  | "evenements"
  | "social"
  | "sante"
  | "education"
  | "voyages"
  | "agriculture"
  | "transport"
  | "media"
  | "business"
  | "finance"
  | "citoyen"
  | "environnement"
  | "technologie"
  | "sport"
  | "culture"
  | "securite"
  | "general";

export type ExplorerUniverseIcon = string;

export type ExplorerUniverse = {
  id: ExplorerUniverseId;

  label: string;

  shortLabel?: string;

  description: string;

  icon: ExplorerUniverseIcon;

  color: string;

  gradient: string;

  keywords: string[];

  modules: string[];

  priority: number;

  featured?: boolean;

  enabled?: boolean;

  metadata?: Record<string, unknown>;
};

export type ExplorerUniverseModule = {
  id: string;

  label: string;

  shortLabel?: string;

  description?: string;

  icon?: string;

  route?: string;

  moduleId?: string;

  universeId?: ExplorerUniverseId;

  keywords?: string[];

  priority?: number;

  enabled?: boolean;

  featured?: boolean;

  score?: number;

  metadata?: Record<string, unknown>;
};

export type UniverseContext = {
  favoriteModules?: string[];

  interests?: string[];

  preferredUniverses?: string[];

  activeModules?: string[];

  language?: string;
};

export type UniverseOptions = {
  limit?: number;

  search?: string;

  universeId?: ExplorerUniverseId;

  includeDisabled?: boolean;

  featuredOnly?: boolean;
};

export type ExplorerUniverseResult = ExplorerUniverse & {
  discoveryScore: number;

  relevanceScore: number;

  personalizationScore: number;

  moduleCount: number;

  activeModuleCount: number;
};

export type UniverseSnapshot = {
  universes: ExplorerUniverseResult[];

  total: number;

  generatedAt: number;
};

/**
 * ============================================================
 * CONSTANTES
 * ============================================================
 */

export const DEFAULT_UNIVERSE_LIMIT = 20;

export const MAX_UNIVERSE_LIMIT = 100;

/**
 * ============================================================
 * UNIVERS DESKTOP / MOBILE
 * ============================================================
 *
 * Cette configuration sert de fallback central.
 *
 * Les modules réels peuvent ensuite être injectés depuis
 * ModuleRegistry.
 * ============================================================
 */

export const EXPLORER_UNIVERSES: ExplorerUniverse[] = [
  {
    id: "emploi",
    label: "Emploi & Carrière",
    shortLabel: "Emploi",
    description:
      "Jobs, recrutement, missions, compétences et opportunités professionnelles.",
    icon: "briefcase",
    color: "#8B5CF6",
    gradient: "from-violet-500 to-purple-700",
    keywords: [
      "emploi",
      "job",
      "travail",
      "carriere",
      "recrutement",
      "mission",
      "freelance",
      "formation",
    ],
    modules: ["job", "emploi", "mentorat", "certifications", "reputation"],
    priority: 100,
    featured: true,
    enabled: true,
  },

  {
    id: "immobilier",
    label: "Immobilier & Logement",
    shortLabel: "Immo",
    description: "Logements, ventes, locations, immobilier et habitat.",
    icon: "home",
    color: "#10B981",
    gradient: "from-emerald-500 to-green-700",
    keywords: [
      "immo",
      "immobilier",
      "logement",
      "maison",
      "appartement",
      "location",
      "vente",
      "habitat",
    ],
    modules: ["immo", "logement", "amenagement", "urbanisme", "city-habitat"],
    priority: 95,
    featured: true,
    enabled: true,
  },

  {
    id: "services",
    label: "Services",
    shortLabel: "Services",
    description:
      "Trouvez un professionnel, proposez vos services ou répondez à un besoin.",
    icon: "wrench",
    color: "#F97316",
    gradient: "from-orange-500 to-red-600",
    keywords: [
      "service",
      "professionnel",
      "artisan",
      "aide",
      "intervention",
      "reparation",
      "prestataire",
    ],
    modules: ["service", "services", "livraison", "tracking"],
    priority: 90,
    featured: true,
    enabled: true,
  },

  {
    id: "commerce",
    label: "Commerce & Marketplace",
    shortLabel: "Commerce",
    description: "Produits, bonnes affaires, vendeurs et achats.",
    icon: "shopping-bag",
    color: "#F97316",
    gradient: "from-orange-400 to-pink-600",
    keywords: [
      "marketplace",
      "commerce",
      "produit",
      "achat",
      "vente",
      "boutique",
      "occasion",
    ],
    modules: ["marketplace", "marketplace-pro", "annonces"],
    priority: 88,
    featured: true,
    enabled: true,
  },

  {
    id: "evenements",
    label: "Événements & Sorties",
    shortLabel: "Événements",
    description: "Événements, activités, rencontres, agendas et sorties.",
    icon: "calendar-days",
    color: "#EC4899",
    gradient: "from-pink-500 to-rose-600",
    keywords: [
      "evenement",
      "sortie",
      "concert",
      "festival",
      "agenda",
      "rencontre",
      "activite",
    ],
    modules: [
      "evenement",
      "evenements",
      "events-agenda",
      "agenda",
      "evenements-pro",
    ],
    priority: 86,
    featured: true,
    enabled: true,
  },

  {
    id: "social",
    label: "Communautés & Réseau",
    shortLabel: "Social",
    description:
      "Communautés, groupes, réseau, créateurs et nouvelles rencontres.",
    icon: "users",
    color: "#3B82F6",
    gradient: "from-blue-500 to-indigo-700",
    keywords: [
      "community",
      "communaute",
      "groupe",
      "reseau",
      "amis",
      "social",
      "createur",
    ],
    modules: ["community", "groupes", "network", "network-profile", "creator"],
    priority: 84,
    featured: true,
    enabled: true,
  },

  {
    id: "sante",
    label: "Santé & Bien-être",
    shortLabel: "Santé",
    description:
      "Santé, médecins, bien-être, sport, nutrition et accompagnement.",
    icon: "heart-pulse",
    color: "#EF4444",
    gradient: "from-red-500 to-rose-700",
    keywords: [
      "sante",
      "medecin",
      "bien-etre",
      "nutrition",
      "sport",
      "fitness",
      "pharmacie",
      "telemedecine",
    ],
    modules: [
      "sante",
      "appointment",
      "medical-record",
      "telemedicine",
      "pharmacy",
      "nutrition",
      "fitness",
      "meditation",
      "bien-etre",
    ],
    priority: 82,
    featured: true,
    enabled: true,
  },

  {
    id: "education",
    label: "Éducation & Apprentissage",
    shortLabel: "Éducation",
    description:
      "Cours, écoles, apprentissage, mentorat et développement des compétences.",
    icon: "graduation-cap",
    color: "#6366F1",
    gradient: "from-indigo-500 to-blue-700",
    keywords: [
      "education",
      "ecole",
      "cours",
      "apprentissage",
      "formation",
      "competence",
      "mentorat",
    ],
    modules: [
      "apprendre",
      "cours",
      "ecole",
      "edu-formelle",
      "mentorat",
      "certifications",
      "quiz",
    ],
    priority: 80,
    featured: true,
    enabled: true,
  },

  {
    id: "voyages",
    label: "Voyages & Découvertes",
    shortLabel: "Voyages",
    description:
      "Destinations, hébergements, expériences et carnets de voyage.",
    icon: "plane",
    color: "#0EA5E9",
    gradient: "from-sky-500 to-cyan-700",
    keywords: [
      "voyage",
      "destination",
      "tourisme",
      "hotel",
      "hebergement",
      "aventure",
      "vacances",
    ],
    modules: [
      "voyages",
      "destinations",
      "hebergement",
      "budget-voyage",
      "carnet-voyage",
    ],
    priority: 78,
    featured: true,
    enabled: true,
  },

  {
    id: "agriculture",
    label: "Agriculture & Alimentation",
    shortLabel: "Agri",
    description: "Agriculture, producteurs, alimentation et économie locale.",
    icon: "sprout",
    color: "#84CC16",
    gradient: "from-lime-500 to-green-700",
    keywords: [
      "agriculture",
      "agri",
      "ferme",
      "producteur",
      "alimentation",
      "rural",
      "agro",
    ],
    modules: ["agri", "restauration"],
    priority: 75,
    enabled: true,
  },

  {
    id: "transport",
    label: "Transport & Mobilité",
    shortLabel: "Transport",
    description: "Transport, mobilité, livraison, trajets et déplacements.",
    icon: "car",
    color: "#6366F1",
    gradient: "from-indigo-500 to-violet-700",
    keywords: [
      "transport",
      "mobilite",
      "trajet",
      "voiture",
      "livraison",
      "chauffeur",
    ],
    modules: ["transport", "livraison", "tracking", "carte"],
    priority: 73,
    enabled: true,
  },

  {
    id: "media",
    label: "Média & Création",
    shortLabel: "Média",
    description:
      "Actualités, vidéos, stories, streaming, contenus et création.",
    icon: "play-circle",
    color: "#EF4444",
    gradient: "from-red-500 to-orange-600",
    keywords: [
      "media",
      "video",
      "story",
      "streaming",
      "reels",
      "photo",
      "creation",
      "actualite",
    ],
    modules: [
      "media",
      "live-stories",
      "live-streaming",
      "reels",
      "studio-photo",
      "editeur",
      "series-playlist",
    ],
    priority: 70,
    featured: true,
    enabled: true,
  },

  {
    id: "business",
    label: "Business & Entrepreneuriat",
    shortLabel: "Business",
    description:
      "Entreprises, entrepreneurs, créateurs et développement d'activité.",
    icon: "building-2",
    color: "#0F766E",
    gradient: "from-teal-500 to-emerald-700",
    keywords: [
      "business",
      "entreprise",
      "entrepreneur",
      "startup",
      "commerce",
      "creator",
    ],
    modules: ["business", "creator-dashboard", "revenus", "revenus-dashboard"],
    priority: 68,
    enabled: true,
  },

  {
    id: "finance",
    label: "Finance & Argent",
    shortLabel: "Finance",
    description:
      "Budget, paiements, portefeuille, revenus et gestion financière.",
    icon: "wallet",
    color: "#10B981",
    gradient: "from-emerald-500 to-teal-700",
    keywords: [
      "finance",
      "argent",
      "budget",
      "paiement",
      "revenu",
      "wallet",
      "portefeuille",
    ],
    modules: ["finances", "budget-voyage", "paiement", "wallet", "revenus"],
    priority: 65,
    enabled: true,
  },

  {
    id: "citoyen",
    label: "Citoyen & Vie publique",
    shortLabel: "Citoyen",
    description:
      "Services publics, données, démarches, justice et vie citoyenne.",
    icon: "landmark",
    color: "#64748B",
    gradient: "from-slate-500 to-gray-800",
    keywords: [
      "citoyen",
      "public",
      "administration",
      "justice",
      "donnees",
      "demarches",
    ],
    modules: ["data-publique", "justice", "juridique", "documents", "admin"],
    priority: 63,
    enabled: true,
  },

  {
    id: "environnement",
    label: "Environnement & Énergie",
    shortLabel: "Environnement",
    description:
      "Environnement, énergie, transition écologique et aménagement.",
    icon: "leaf",
    color: "#22C55E",
    gradient: "from-green-500 to-emerald-800",
    keywords: [
      "environnement",
      "ecologie",
      "energie",
      "climat",
      "transition",
      "urbanisme",
    ],
    modules: ["environnement", "energie", "urbanisme", "amenagement"],
    priority: 60,
    enabled: true,
  },

  {
    id: "technologie",
    label: "Technologie & Innovation",
    shortLabel: "Tech",
    description:
      "Technologie, innovation, intelligence artificielle et nouveaux outils.",
    icon: "cpu",
    color: "#06B6D4",
    gradient: "from-cyan-500 to-blue-700",
    keywords: [
      "tech",
      "technologie",
      "innovation",
      "ia",
      "intelligence artificielle",
      "digital",
    ],
    modules: ["ai-studio", "templates", "laboratory"],
    priority: 58,
    enabled: true,
  },

  {
    id: "sport",
    label: "Sport & Activités",
    shortLabel: "Sport",
    description: "Sport, fitness, challenges et activités physiques.",
    icon: "dumbbell",
    color: "#F97316",
    gradient: "from-orange-500 to-red-700",
    keywords: ["sport", "fitness", "entrainement", "challenge", "activite"],
    modules: ["sport", "fitness", "challenges"],
    priority: 55,
    enabled: true,
  },

  {
    id: "culture",
    label: "Culture & Loisirs",
    shortLabel: "Culture",
    description: "Culture, musique, découvertes, loisirs et expériences.",
    icon: "sparkles",
    color: "#A855F7",
    gradient: "from-purple-500 to-fuchsia-700",
    keywords: [
      "culture",
      "loisir",
      "musique",
      "art",
      "decouverte",
      "spectacle",
    ],
    modules: ["culture", "evenements", "media", "decouverte"],
    priority: 52,
    enabled: true,
  },

  {
    id: "securite",
    label: "Sécurité & Urgence",
    shortLabel: "Sécurité",
    description: "Urgences, sécurité publique, assistance et protection.",
    icon: "shield-alert",
    color: "#DC2626",
    gradient: "from-red-600 to-red-900",
    keywords: ["securite", "urgence", "sos", "emergency", "protection"],
    modules: ["sos", "emergency", "securite-publique"],
    priority: 50,
    enabled: true,
  },

  {
    id: "general",
    label: "Découvrir tout",
    shortLabel: "Tout",
    description: "Découvrez l'ensemble des univers DébrouillePro.",
    icon: "compass",
    color: "#6366F1",
    gradient: "from-indigo-500 to-purple-700",
    keywords: ["explorer", "decouvrir", "tout", "univers", "general"],
    modules: [],
    priority: 10,
    featured: false,
    enabled: true,
  },
];

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

function normalizeLimit(limit?: number): number {
  if (limit === undefined || !Number.isFinite(limit)) {
    return DEFAULT_UNIVERSE_LIMIT;
  }

  return Math.max(1, Math.min(Math.floor(limit), MAX_UNIVERSE_LIMIT));
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * ============================================================
 * MODULE → UNIVERS
 * ============================================================
 */

export function findUniverseForModule(
  moduleId: string,
): ExplorerUniverse | undefined {
  const normalized = normalizeText(moduleId);

  if (!normalized) {
    return undefined;
  }

  return EXPLORER_UNIVERSES.find((universe) =>
    universe.modules.some((module) => normalizeText(module) === normalized),
  );
}

/**
 * ============================================================
 * RECHERCHE UNIVERS
 * ============================================================
 */

export function searchUniverses(
  universes: ExplorerUniverse[],
  search?: string,
): ExplorerUniverse[] {
  const query = normalizeText(search);

  if (!query) {
    return [...universes];
  }

  return universes.filter((universe) => {
    const searchable = normalizeText(
      [
        universe.id,
        universe.label,
        universe.shortLabel,
        universe.description,
        ...universe.keywords,
        ...universe.modules,
      ]
        .filter(Boolean)
        .join(" "),
    );

    return searchable.includes(query);
  });
}

/**
 * ============================================================
 * PERSONNALISATION
 * ============================================================
 */

export function calculateUniversePersonalization(
  universe: ExplorerUniverse,
  context?: UniverseContext,
): number {
  if (!context) {
    return 0;
  }

  let score = 0;

  const universeKeywords = new Set(universe.keywords.map(normalizeText));

  /**
   * Univers explicitement préféré.
   */
  if (
    context.preferredUniverses?.some(
      (value) => normalizeText(value) === normalizeText(universe.id),
    )
  ) {
    score += 50;
  }

  /**
   * Modules favoris.
   */
  for (const module of context.favoriteModules ?? []) {
    const normalized = normalizeText(module);

    if (
      universe.modules.some(
        (universeModule) => normalizeText(universeModule) === normalized,
      )
    ) {
      score += 20;
    }
  }

  /**
   * Modules actifs récemment.
   */
  for (const module of context.activeModules ?? []) {
    const normalized = normalizeText(module);

    if (
      universe.modules.some(
        (universeModule) => normalizeText(universeModule) === normalized,
      )
    ) {
      score += 10;
    }
  }

  /**
   * Centres d'intérêt.
   */
  for (const interest of context.interests ?? []) {
    const normalized = normalizeText(interest);

    if (normalized && universeKeywords.has(normalized)) {
      score += 8;
    }
  }

  return clamp(score);
}

/**
 * ============================================================
 * RELEVANCE
 * ============================================================
 */

export function calculateUniverseRelevance(
  universe: ExplorerUniverse,
  context?: UniverseContext,
): number {
  const personalization = calculateUniversePersonalization(universe, context);

  /**
   * La priorité du registre est normalisée
   * pour produire un signal compris entre 0 et 100.
   */
  const priorityScore = clamp(universe.priority);

  return clamp(priorityScore * 0.55 + personalization * 0.45);
}

/**
 * ============================================================
 * DISCOVERY SCORE
 * ============================================================
 */

export function calculateUniverseDiscoveryScore(
  universe: ExplorerUniverse,
  context?: UniverseContext,
): number {
  const relevance = calculateUniverseRelevance(universe, context);

  const featuredBonus = universe.featured ? 10 : 0;

  const enabledBonus = universe.enabled === false ? -100 : 0;

  return clamp(relevance + featuredBonus + enabledBonus);
}

/**
 * ============================================================
 * ENRICHISSEMENT
 * ============================================================
 */

export function enrichUniverse(
  universe: ExplorerUniverse,
  modules: ExplorerUniverseModule[] = [],
  context?: UniverseContext,
): ExplorerUniverseResult {
  const universeModules = modules.filter((module) => {
    const moduleId = module.moduleId ?? module.id;

    return universe.modules.some(
      (universeModule) =>
        normalizeText(universeModule) === normalizeText(moduleId),
    );
  });

  const activeModuleCount = universeModules.filter(
    (module) => module.enabled !== false,
  ).length;

  const relevanceScore = calculateUniverseRelevance(universe, context);

  const personalizationScore = calculateUniversePersonalization(
    universe,
    context,
  );

  const discoveryScore = calculateUniverseDiscoveryScore(universe, context);

  return {
    ...universe,

    discoveryScore,

    relevanceScore,

    personalizationScore,

    moduleCount: universeModules.length,

    activeModuleCount,
  };
}

/**
 * ============================================================
 * FILTRAGE
 * ============================================================
 */

function matchesUniverseOptions(
  universe: ExplorerUniverse,
  options: UniverseOptions,
): boolean {
  if (!options.includeDisabled && universe.enabled === false) {
    return false;
  }

  if (options.featuredOnly && !universe.featured) {
    return false;
  }

  if (options.universeId && universe.id !== options.universeId) {
    return false;
  }

  return true;
}

/**
 * ============================================================
 * PIPELINE
 * ============================================================
 */

export function getExplorerUniverses(
  modules: ExplorerUniverseModule[] = [],
  context?: UniverseContext,
  options: UniverseOptions = {},
): ExplorerUniverseResult[] {
  const limit = normalizeLimit(options.limit);

  let universes = EXPLORER_UNIVERSES.filter((universe) =>
    matchesUniverseOptions(universe, options),
  );

  universes = searchUniverses(universes, options.search);

  return universes
    .map((universe) => enrichUniverse(universe, modules, context))
    .sort((a, b) => {
      if (a.discoveryScore !== b.discoveryScore) {
        return b.discoveryScore - a.discoveryScore;
      }

      return b.priority - a.priority;
    })
    .slice(0, limit);
}

/**
 * ============================================================
 * UNIVERS FEATURED
 * ============================================================
 */

export function getFeaturedUniverses(
  modules: ExplorerUniverseModule[] = [],
  context?: UniverseContext,
  limit = 8,
): ExplorerUniverseResult[] {
  return getExplorerUniverses(modules, context, {
    limit,
    featuredOnly: true,
  });
}

/**
 * ============================================================
 * MODULES D'UN UNIVERS
 * ============================================================
 */

export function getModulesForUniverse(
  universeId: ExplorerUniverseId,
  modules: ExplorerUniverseModule[],
): ExplorerUniverseModule[] {
  const universe = EXPLORER_UNIVERSES.find((item) => item.id === universeId);

  if (!universe) {
    return [];
  }

  return modules
    .filter((module) => {
      const moduleId = module.moduleId ?? module.id;

      return universe.modules.some(
        (universeModule) =>
          normalizeText(universeModule) === normalizeText(moduleId),
      );
    })
    .filter((module) => module.enabled !== false)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

/**
 * ============================================================
 * UNIVERS PAR MODULE
 * ============================================================
 */

export function getUniversesForModule(moduleId: string): ExplorerUniverse[] {
  const normalized = normalizeText(moduleId);

  if (!normalized) {
    return [];
  }

  return EXPLORER_UNIVERSES.filter((universe) =>
    universe.modules.some((module) => normalizeText(module) === normalized),
  );
}

/**
 * ============================================================
 * SNAPSHOT
 * ============================================================
 */

export function buildUniverseSnapshot(
  modules: ExplorerUniverseModule[] = [],
  context?: UniverseContext,
  options: UniverseOptions = {},
): UniverseSnapshot {
  const universes = getExplorerUniverses(modules, context, options);

  return {
    universes,

    total: universes.length,

    generatedAt: Date.now(),
  };
}

/**
 * ============================================================
 * RESOLUTION D'UN UNIVERS
 * ============================================================
 */

export function getUniverseById(
  universeId: ExplorerUniverseId,
): ExplorerUniverse | undefined {
  return EXPLORER_UNIVERSES.find((universe) => universe.id === universeId);
}

/**
 * ============================================================
 * LABEL
 * ============================================================
 */

export function getUniverseLabel(universeId: ExplorerUniverseId): string {
  return getUniverseById(universeId)?.label ?? "Découvrir";
}

/**
 * ============================================================
 * SUMMARY
 * ============================================================
 */

export type UniverseSummary = {
  total: number;

  featured: number;

  enabled: number;

  disabled: number;
};

export function summarizeUniverses(
  universes: ExplorerUniverseResult[],
): UniverseSummary {
  let featured = 0;

  let enabled = 0;

  let disabled = 0;

  for (const universe of universes) {
    if (universe.featured) {
      featured += 1;
    }

    if (universe.enabled === false) {
      disabled += 1;
    } else {
      enabled += 1;
    }
  }

  return {
    total: universes.length,

    featured,

    enabled,

    disabled,
  };
}
