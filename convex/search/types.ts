// convex/search/types.ts
//
// ─── CONTRATS DU SEARCH CORE ─────────────────────────────────────────────
//
// Ce fichier ne connaît NI Convex NI le schéma. Uniquement des types TS purs.

/* ============================================================================
 * ACTIONS
 * ========================================================================== */

export type ActionId =
  | "acheter"
  | "vendre"
  | "louer"
  | "chercher"
  | "trouver"
  | "visiter"
  | "reserver"
  | "apprendre"
  | "travailler"
  | "recruter"
  | "postuler"
  | "publier"
  | "consulter"
  | "voyager"
  | "envoyer"
  | "payer"
  | "reparer"
  | "construire"
  | "investir"
  | "contacter"
  | "commander"
  | "participer";

/* ============================================================================
 * DOMAINES
 * ========================================================================== */

/**
 * Un domaine = un grand axe métier de DébrouillePro.
 * Chaque domaine correspond à une ou plusieurs sources Convex.
 *
 * On laisse la liste ouverte : de nouveaux domaines s'ajouteront
 * au fur et à mesure que les modules sont finalisés.
 */
export type DomainId = string;

/* ============================================================================
 * INTENTION — résultat du parsing
 * ========================================================================== */

export interface ParsedIntent {
  /** Requête brute */
  raw: string;

  /** Requête normalisée (accents retirés, lowercase, compactée) */
  normalized: string;

  /** Tokens bruts */
  tokens: string[];

  /** Tokens utiles (stopwords retirés, longueur >= 2) */
  meaningfulTokens: string[];

  /** Actions détectées (dans l'ordre d'apparition) */
  actions: ActionId[];

  /** Action dominante (première détectée) */
  primaryAction: ActionId | null;

  /** Entités détectées (noms normalisés) */
  entities: string[];

  /** Entité principale */
  primaryEntity: string | null;

  /** Localisations détectées */
  locations: string[];

  /** Localisation principale */
  primaryLocation: string | null;

  /** Domaines candidats (ordonnés par pertinence) */
  domains: DomainId[];
}

/* ============================================================================
 * SOURCE ADAPTER — contrat que chaque source doit implémenter
 * ========================================================================== */

/**
 * Résultat brut retourné par une source adapter.
 * C'est le seul endroit où les détails Convex apparaissent.
 */
export interface RawSearchHit {
  /** Identifiant unique global (ex: "prop-<convexId>") */
  id: string;

  /** Titre affichable */
  title: string;

  /** Sous-titre (contexte) */
  subtitle: string;

  /** Meta (prix, date, contrat…) */
  meta?: string;

  /** Badge court ("LIVE", "CDI", "Vente"…) */
  badge?: string;

  /** Couleur du badge */
  badgeColor?: string;

  /** Route de navigation au tap */
  route: string;

  /** Données brutes pour scoring */
  fields: {
    title: string;
    description?: string;
    tags?: string[];
    city?: string;
    country?: string;
    category?: string;
    type?: string;
  };
}

/**
 * Contrat que chaque source adapter doit respecter.
 *
 * Chaque source décide :
 *   - comment interroger Convex
 *   - quelle search index utiliser
 *   - comment mapper les documents en RawSearchHit
 */
export interface SourceAdapter {
  /** Domaine auquel la source appartient */
  domain: DomainId;

  /** Identifiant unique de la source (ex: "properties") */
  id: string;

  /**
   * Exécute la recherche dans Convex.
   *
   * @param ctx  Convex context (typé any pour rester découplé)
   * @param intent  Résultat du parsing (pour filtrer par localisation, action…)
   * @param term  Terme de recherche principal (à passer au search index)
   * @param limit  Nombre max de résultats
   */
  search(
    ctx: any,
    intent: ParsedIntent,
    term: string,
    limit: number,
  ): Promise<RawSearchHit[]>;
}

/* ============================================================================
 * RÉSULTAT SCORÉ
 * ========================================================================== */

export interface ScoredHit extends RawSearchHit {
  /** Score de pertinence (calculé par ranking.ts) */
  score: number;

  /** Domaine d'origine */
  domain: DomainId;
}

/* ============================================================================
 * GROUPE DE RÉSULTATS
 * ========================================================================== */

export interface ResultGroup {
  domain: DomainId;
  label: string;
  route: string;
  color: string;
  description: string;
  totalCount: number;
  topResults: ScoredHit[];
}

/* ============================================================================
 * RÉPONSE FINALE
 * ========================================================================== */

export interface SearchResponse {
  parsed: ParsedIntent;
  groups: ResultGroup[];
  totalCount: number;
}

/* ============================================================================
 * REGISTRE — contrat d'une entrée de module
 * ========================================================================== */

/**
 * Définition d'une entité reconnue par un module.
 *
 * Ex : { name: "maison", synonyms: ["habitation", "domicile"] }
 */
export interface EntityDefinition {
  name: string;
  synonyms?: string[];
}

/**
 * Entrée du registre des modules.
 *
 * ⚠️ Le registry ne connaît PAS les implémentations Convex.
 * Il déclare uniquement des `sourceIds` (strings). L'engine résoudra
 * `sourceId → SourceAdapter` à l'exécution.
 */
export interface ModuleEntry {
  id: DomainId;
  label: string;
  route: string;
  color: string;
  description: string;

  /** Mots-clés déclencheurs ("immobilier", "emploi", "cours"…) */
  keywords: string[];

  /** Entités reconnues (avec leurs synonymes) */
  entities: EntityDefinition[];

  /** Actions possibles sur ce domaine */
  actions: ActionId[];

  /** Priorité de tri (plus haut = affiché en premier) */
  priority: number;

  /** IDs des sources (ex: "properties", "jobListings") */
  sourceIds: string[];
}
