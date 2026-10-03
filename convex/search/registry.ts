// convex/search/registry.ts
//
// ─── CATALOGUE DES MODULES ───────────────────────────────────────────────
//
// RÈGLE FONDAMENTALE :
//   On ajoute un module ICI seulement quand son schéma est STABLE.
//
// Ajouter un module finalisé =
//   1. Ajouter son searchIndex dans schema.ts
//   2. Ajouter une entrée ci-dessous
//   3. Créer son source adapter dans sources/
//   4. C'est tout. Le moteur ne change pas.

import type { ActionId, EntityDefinition, ModuleEntry } from "./types";

/* ============================================================================
 * VILLES CONNUES
 * ============================================================================
 *
 * Liste globale utilisée pour la détection de localisation.
 * Enrichie progressivement.
 * ========================================================================== */

export const GLOBAL_CITIES: string[] = [
  // RDC
  "kolwezi",
  "lubumbashi",
  "kinshasa",
  "likasi",
  "mbuji-mayi",
  "kisangani",
  "bukavu",
  "goma",
  "kananga",
  "matadi",
  "bunia",
  "uvira",
  "kikwit",
  "tshikapa",
  "kabinda",

  // Afrique de l'Ouest
  "dakar",
  "abidjan",
  "bamako",
  "accra",
  "lome",
  "cotonou",
  "ouagadougou",
  "niamey",
  "conakry",
  "freetown",
  "monrovia",

  // Afrique Centrale
  "douala",
  "yaounde",
  "brazzaville",
  "libreville",
  "bangui",
  "malabo",
  "kigali",
  "bujumbura",

  // Afrique de l'Est
  "nairobi",
  "kampala",
  "dar es salaam",
  "addis abeba",
  "khartoum",
  "juba",
  "mogadiscio",
  "dodoma",

  // Afrique du Nord / Sud
  "le caire",
  "tunis",
  "alger",
  "rabat",
  "casablanca",
  "johannesburg",
  "le cap",
  "durban",
  "pretoria",
];

export const GLOBAL_NEIGHBORHOODS: string[] = [
  // Kolwezi
  "joli site",
  "musonoi",
  "latumba",
  "manika",

  // Lubumbashi
  "golf",
  "bel-air",
  "katuba",
  "kenya",

  // Kinshasa
  "gombe",
  "limete",
  "matonge",
  "bandal",
];

/* ============================================================================
 * REGISTRE DES MODULES STABLES
 * ============================================================================
 *
 * ⚠️ Ne contenir QUE les modules dont le schéma est finalisé.
 * ========================================================================== */

export const MODULE_REGISTRY: ModuleEntry[] = [
  /* ═══════════════════════════════════════════════════════════════════════
   * IMMOBILIER — issu de la table `properties`
   * ═══════════════════════════════════════════════════════════════════════ */
  {
    id: "immo",
    label: "Immobilier",
    route: "immo",
    color: "#34D399",
    description: "Maisons, appartements, terrains",

    keywords: [
      "immo",
      "immobilier",
      "location",
      "vente",
      "achat",
      "loyer",
      "bail",
      "propriete",
    ],

    entities: [
      {
        name: "maison",
        synonyms: ["habitation", "demeure", "domicile"],
      },
      {
        name: "appartement",
        synonyms: ["appart", "appartement"],
      },
      {
        name: "villa",
        synonyms: [],
      },
      {
        name: "studio",
        synonyms: [],
      },
      {
        name: "terrain",
        synonyms: ["parcelle", "lot"],
      },
      {
        name: "chambre",
        synonyms: [],
      },
      {
        name: "duplex",
        synonyms: [],
      },
      {
        name: "local",
        synonyms: ["local commercial"],
      },
      {
        name: "bureau",
        synonyms: [],
      },
      {
        name: "logement",
        synonyms: ["habitat"],
      },
      {
        name: "propriete",
        synonyms: [],
      },
      {
        name: "ferme",
        synonyms: [],
      },
    ],

    actions: [
      "acheter",
      "vendre",
      "louer",
      "visiter",
      "construire",
      "investir",
    ],

    priority: 100,

    // `publications` permet de retrouver également les publications
    // immobilières correspondant à l'intention.
    sourceIds: ["properties", "publications"],
  },

  /* ═══════════════════════════════════════════════════════════════════════
   * EMPLOI — issu de la table `jobListings`
   * ═══════════════════════════════════════════════════════════════════════ */
  {
    id: "jobs",
    label: "Emploi & Jobs",
    route: "jobs",
    color: "#A78BFA",
    description: "Offres d'emploi & recrutement",

    keywords: [
      "emploi",
      "job",
      "recrutement",
      "carriere",
      "cv",
      "poste",
      "travail",
    ],

    entities: [
      {
        name: "job",
        synonyms: ["emploi", "poste"],
      },
      {
        name: "travail",
        synonyms: ["boulot"],
      },
      {
        name: "stage",
        synonyms: ["stagiaire"],
      },
      {
        name: "cdi",
        synonyms: [],
      },
      {
        name: "cdd",
        synonyms: [],
      },
      {
        name: "freelance",
        synonyms: ["mission"],
      },
      {
        name: "chauffeur",
        synonyms: ["conducteur"],
      },
      {
        name: "developpeur",
        synonyms: ["dev", "programmeur"],
      },
      {
        name: "comptable",
        synonyms: ["comptabilite"],
      },
      {
        name: "secretaire",
        synonyms: [],
      },
      {
        name: "infirmier",
        synonyms: ["infirmiere"],
      },
      {
        name: "professeur",
        synonyms: ["enseignant"],
      },
    ],

    actions: ["chercher", "travailler", "recruter", "postuler", "publier"],

    priority: 100,

    // `publications` permet également de retrouver les publications
    // correspondant aux offres d'emploi.
    sourceIds: ["jobListings", "publications"],
  },

  /* ═══════════════════════════════════════════════════════════════════════
   * FORMATIONS — issu de la table `courses`
   * ═══════════════════════════════════════════════════════════════════════ */
  {
    id: "apprendre",
    label: "Formations",
    route: "cours",
    color: "#22D3EE",
    description: "Cours, formations, certifications",

    keywords: [
      "cours",
      "formation",
      "apprendre",
      "education",
      "certification",
      "diplome",
    ],

    entities: [
      {
        name: "cours",
        synonyms: ["lecon", "classe"],
      },
      {
        name: "formation",
        synonyms: ["training"],
      },
      {
        name: "certification",
        synonyms: ["certif", "diplome"],
      },
      {
        name: "tutoriel",
        synonyms: ["tuto"],
      },
      {
        name: "javascript",
        synonyms: ["js"],
      },
      {
        name: "python",
        synonyms: [],
      },
      {
        name: "excel",
        synonyms: [],
      },
      {
        name: "marketing",
        synonyms: [],
      },
      {
        name: "design",
        synonyms: [],
      },
    ],

    actions: ["apprendre", "chercher", "payer", "consulter"],

    priority: 80,

    // `publications` permet également de retrouver les publications
    // de type education.
    sourceIds: ["courses", "publications"],
  },

  /* ═══════════════════════════════════════════════════════════════════════
   * ANNONCES / PUBLICATIONS — issu de la table `publications`
   *
   * Cette table est multi-type (immo, job, service, evenement, community,
   * agri, sante, transport, annonce). Le source adapter filtrera selon
   * l'intention détectée.
   * ═══════════════════════════════════════════════════════════════════════ */
  {
    id: "publications",
    label: "Annonces",
    route: "annonces",
    color: "#FBBF24",
    description: "Annonces & publications",

    keywords: [
      "annonce",
      "publication",
      "offre",
      "pub",
      "evenement",
      "sante",
      "agri",
      "transport",
      "community",
    ],

    entities: [
      {
        name: "annonce",
        synonyms: ["publication", "offre"],
      },
      {
        name: "evenement",
        synonyms: ["event", "sortie"],
      },
      {
        name: "service",
        synonyms: ["prestation"],
      },
      {
        name: "transport",
        synonyms: ["trajet"],
      },
    ],

    actions: ["chercher", "publier", "contacter", "consulter"],

    priority: 60,
    sourceIds: ["publications"],
  },

  /* ═══════════════════════════════════════════════════════════════════════
   * LIVE — issu de la table `liveStreams`
   *
   * ⚠️ Le search index `search_title` de `liveStreams` sera ajouté
   *    avant de brancher son source adapter (Étape 4).
   * ═══════════════════════════════════════════════════════════════════════ */
  {
    id: "live",
    label: "Live Streaming",
    route: "live-streaming",
    color: "#F87171",
    description: "Vidéos en direct",

    keywords: ["live", "direct", "stream", "streaming", "diffusion"],

    entities: [
      {
        name: "live",
        synonyms: ["direct", "stream"],
      },
      {
        name: "replay",
        synonyms: [],
      },
      {
        name: "diffusion",
        synonyms: [],
      },
    ],

    actions: ["consulter", "chercher", "publier"],

    priority: 70,
    sourceIds: ["liveStreams"],
  },
];

/* ============================================================================
 * INDEX DÉRIVÉS (construits une fois au démarrage)
 * ========================================================================== */

/**
 * Modules indexés par ID.
 */
export const MODULE_BY_ID: Map<string, ModuleEntry> = new Map(
  MODULE_REGISTRY.map((m) => [m.id, m]),
);

/**
 * Mapping entité canonique → domaines associés.
 * Utilisé par l'engine pour résoudre les domaines correspondant
 * aux entités détectées.
 */
export const ENTITY_TO_DOMAINS: Map<string, string[]> = (() => {
  const map = new Map<string, string[]>();

  for (const mod of MODULE_REGISTRY) {
    for (const entity of mod.entities) {
      const key = entity.name.toLowerCase();

      const list = map.get(key) ?? [];

      if (!list.includes(mod.id)) {
        list.push(mod.id);
      }

      map.set(key, list);

      // Les synonymes pointent aussi vers le domaine.
      for (const syn of entity.synonyms ?? []) {
        const synKey = syn.toLowerCase();
        const synList = map.get(synKey) ?? [];

        if (!synList.includes(mod.id)) {
          synList.push(mod.id);
        }

        map.set(synKey, synList);
      }
    }
  }

  return map;
})();

/**
 * Mapping mot-clé → domaines.
 *
 * Exemple :
 *   "emploi" → ["jobs"]
 */
export const KEYWORD_TO_DOMAINS: Map<string, string[]> = (() => {
  const map = new Map<string, string[]>();

  for (const mod of MODULE_REGISTRY) {
    for (const kw of mod.keywords) {
      const key = kw.toLowerCase();

      const list = map.get(key) ?? [];

      if (!list.includes(mod.id)) {
        list.push(mod.id);
      }

      map.set(key, list);
    }
  }

  return map;
})();

/* ============================================================================
 * HELPERS EXPORTÉS
 * ========================================================================== */

/**
 * Retourne toutes les entités du registre au format attendu par
 * `buildEntityVocabulary` (entities.ts).
 */
export function getEntityEntries(): Array<{
  entity: string;
  synonyms: string[];
}> {
  const entries: Array<{
    entity: string;
    synonyms: string[];
  }> = [];

  for (const mod of MODULE_REGISTRY) {
    for (const e of mod.entities) {
      entries.push({
        entity: e.name,
        synonyms: e.synonyms ?? [],
      });
    }
  }

  return entries;
}

/**
 * Retourne les domaines à interroger pour un ensemble d'entités.
 */
export function resolveDomainsForEntities(entities: string[]): string[] {
  const found = new Set<string>();

  for (const entity of entities) {
    const domains = ENTITY_TO_DOMAINS.get(entity.toLowerCase());

    if (domains) {
      for (const domain of domains) {
        found.add(domain);
      }
    }
  }

  return Array.from(found);
}

/**
 * Retourne les domaines à interroger pour un ensemble de mots-clés.
 */
export function resolveDomainsForKeywords(keywords: string[]): string[] {
  const found = new Set<string>();

  for (const kw of keywords) {
    const domains = KEYWORD_TO_DOMAINS.get(kw.toLowerCase());

    if (domains) {
      for (const domain of domains) {
        found.add(domain);
      }
    }
  }

  return Array.from(found);
}

/**
 * Retourne la liste de tous les sourceIds déclarés
 * par un ensemble de domaines.
 */
export function getSourceIdsForDomains(domains: string[]): string[] {
  const sourceIds = new Set<string>();

  for (const domain of domains) {
    const mod = MODULE_BY_ID.get(domain);

    if (mod) {
      for (const sourceId of mod.sourceIds) {
        sourceIds.add(sourceId);
      }
    }
  }

  return Array.from(sourceIds);
}

/**
 * Retourne tous les sourceIds déclarés.
 *
 * Utile pour savoir quels adapters doivent être implémentés.
 */
export function getAllSourceIds(): string[] {
  const ids = new Set<string>();

  for (const mod of MODULE_REGISTRY) {
    for (const sourceId of mod.sourceIds) {
      ids.add(sourceId);
    }
  }

  return Array.from(ids);
}
