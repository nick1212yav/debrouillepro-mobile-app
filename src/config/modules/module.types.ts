/**
 * ============================================================
 * DÉBROUILLEPRO — MODULE TYPES
 * ============================================================
 *
 * Types centraux utilisés par tous les modules de
 * DébrouillePro.
 *
 * IMPORTANT :
 * Ce fichier ne contient aucune logique métier.
 * Il contient uniquement les contrats TypeScript.
 *
 * Ce fichier constitue la source de vérité des types
 * fondamentaux du système de modules.
 * ============================================================
 */

/**
 * ============================================================
 * MODULE ID
 * ============================================================
 *
 * Identifiant canonique d'un module DébrouillePro.
 *
 * IMPORTANT :
 * Ne pas utiliser directement des chaînes arbitraires
 * lorsqu'un ModuleId est attendu.
 */
export type ModuleId =
  | "community"
  | "network"
  | "boutique"
  | "services"
  | "jobs"
  | "health"
  | "justice"
  | "city"
  | "voyages"
  | "annonces"
  | "pay"
  | "education"
  | "live";

/**
 * ============================================================
 * MODULE CATEGORY
 * ============================================================
 *
 * Catégories fonctionnelles d'un module.
 */
export type ModuleCategory =
  | "social"
  | "commerce"
  | "services"
  | "employment"
  | "health"
  | "justice"
  | "city"
  | "travel"
  | "finance"
  | "education"
  | "media";

/**
 * ============================================================
 * MODULE CAPABILITIES
 * ============================================================
 *
 * Capacités générales disponibles pour un module.
 */
export interface ModuleCapabilities {
  /**
   * Le module peut fournir des éléments géolocalisés.
   */
  nearby?: boolean;

  /**
   * Le module peut produire des opportunités.
   */
  opportunities?: boolean;

  /**
   * Le module possède un feed.
   */
  feed?: boolean;

  /**
   * Le module possède une page détail.
   */
  details?: boolean;

  /**
   * Le module permet la création de contenu.
   */
  creation?: boolean;

  /**
   * Le module peut être utilisé comme source
   * de recommandations.
   */
  recommendations?: boolean;

  /**
   * Le module peut produire des notifications.
   */
  notifications?: boolean;

  /**
   * Le module utilise la localisation.
   */
  location?: boolean;

  /**
   * Le module possède une fonctionnalité de recherche.
   */
  search?: boolean;
}

/**
 * ============================================================
 * MODULE HOME CONFIG
 * ============================================================
 *
 * Configuration spécifique du module dans Home.
 */
export interface ModuleHomeConfig {
  /**
   * Le module peut apparaître sur Home.
   */
  enabled: boolean;

  /**
   * Priorité d'affichage sur Home.
   *
   * Plus la valeur est élevée, plus le module
   * est prioritaire.
   */
  priority: number;

  /**
   * Afficher le module dans les suggestions.
   */
  showInSuggestions?: boolean;

  /**
   * Afficher le module dans les raccourcis.
   */
  showInQuickActions?: boolean;
}

/**
 * ============================================================
 * MODULE DEFINITION
 * ============================================================
 *
 * Définition complète et canonique d'un module.
 */
export interface ModuleDefinition {
  /**
   * Identifiant canonique.
   */
  id: ModuleId;

  /**
   * Label long affiché dans l'interface.
   */
  label: string;

  /**
   * Label court.
   */
  shortLabel: string;

  /**
   * Description du module.
   */
  description: string;

  /**
   * Icône utilisée dans l'interface.
   *
   * On conserve une string afin de ne pas coupler
   * la configuration au moteur d'icônes.
   */
  icon: string;

  /**
   * Route principale du module.
   */
  route: string;

  /**
   * Catégorie fonctionnelle.
   */
  category: ModuleCategory;

  /**
   * Module actif globalement.
   */
  enabled: boolean;

  /**
   * Le module possède un feed.
   */
  hasFeed: boolean;

  /**
   * Capacités du module.
   */
  capabilities: ModuleCapabilities;

  /**
   * Configuration spécifique à Home.
   */
  home: ModuleHomeConfig;

  /**
   * Types de publications produits par le module.
   *
   * IMPORTANT :
   * readonly permet d'accepter les tableaux déclarés
   * avec `as const` dans le registre des modules.
   *
   * Exemple :
   * readonly ["job"]
   * readonly ["annonce"]
   * readonly []
   */
  publicationTypes?: readonly string[];

  /**
   * Route de détail optionnelle.
   */
  detailRoute?: string;

  /**
   * Route de création optionnelle.
   */
  createRoute?: string;
}

/**
 * ============================================================
 * MODULE REGISTRY
 * ============================================================
 *
 * Registry complet.
 *
 * Chaque ModuleId doit obligatoirement posséder
 * une définition correspondante.
 */
export type ModuleRegistry = Record<ModuleId, ModuleDefinition>;

/**
 * ============================================================
 * MODULE FILTER
 * ============================================================
 *
 * Filtres disponibles pour rechercher des modules.
 */
export interface ModuleFilter {
  /**
   * Filtrer par catégorie.
   */
  category?: ModuleCategory;

  /**
   * Filtrer les modules globalement actifs/inactifs.
   */
  enabled?: boolean;

  /**
   * Filtrer les modules possédant un feed.
   */
  hasFeed?: boolean;

  /**
   * Filtrer les modules utilisant la proximité.
   */
  nearby?: boolean;

  /**
   * Filtrer les modules produisant des opportunités.
   */
  opportunities?: boolean;

  /**
   * Filtrer les modules activés sur Home.
   */
  homeEnabled?: boolean;
}

/**
 * ============================================================
 * MODULE OPTION
 * ============================================================
 *
 * Version simplifiée destinée aux sélecteurs,
 * menus, raccourcis et composants UI.
 */
export interface ModuleOption {
  /**
   * Identifiant du module.
   */
  id: ModuleId;

  /**
   * Label principal.
   */
  label: string;

  /**
   * Label court.
   */
  shortLabel: string;

  /**
   * Icône.
   */
  icon: string;

  /**
   * Route principale.
   */
  route: string;

  /**
   * Priorité Home.
   */
  priority: number;
}
