/**
 * ============================================================
 * DÉBROUILLEPRO — MODULE CONSTANTS
 * ============================================================
 */

/**
 * Tous les modules canoniques de DébrouillePro.
 *
 * L'ordre ici est l'ordre fonctionnel général de la plateforme.
 * Le ranking Home possède ses propres priorités.
 */
export const MODULE_IDS = [
  "community",
  "network",
  "boutique",
  "services",
  "jobs",
  "health",
  "justice",
  "city",
  "voyages",
  "annonces",
  "pay",
  "education",
  "live",
] as const;

/**
 * Routes principales des modules.
 */
export const MODULE_ROUTES = {
  community: "/community",

  network: "/network",

  boutique: "/marketplace",

  services: "/services",

  jobs: "/jobs",

  health: "/sante",

  justice: "/justice",

  city: "/city",

  voyages: "/voyages",

  annonces: "/annonces",

  pay: "/pay",

  education: "/ecole",

  live: "/live",
} as const;

/**
 * Labels principaux.
 */
export const MODULE_LABELS = {
  community: "Communauté",

  network: "Réseau",

  boutique: "Boutique",

  services: "Services",

  jobs: "Emploi",

  health: "Santé",

  justice: "Justice",

  city: "Ville & Habitat",

  voyages: "Voyages",

  annonces: "Annonces",

  pay: "DébrouillePay",

  education: "Éducation",

  live: "Live",
} as const;

/**
 * Labels courts.
 */
export const MODULE_SHORT_LABELS = {
  community: "Communauté",

  network: "Réseau",

  boutique: "Boutique",

  services: "Services",

  jobs: "Jobs",

  health: "Santé",

  justice: "Justice",

  city: "City",

  voyages: "Voyages",

  annonces: "Annonces",

  pay: "Pay",

  education: "École",

  live: "Live",
} as const;

/**
 * Icônes utilisées par la configuration.
 *
 * Ce sont des identifiants de string.
 * Le composant UI choisira ensuite la librairie d'icônes.
 */
export const MODULE_ICONS = {
  community: "users",

  network: "network",

  boutique: "shopping-bag",

  services: "wrench",

  jobs: "briefcase",

  health: "heart-pulse",

  justice: "scale",

  city: "building-2",

  voyages: "plane",

  annonces: "megaphone",

  pay: "wallet",

  education: "graduation-cap",

  live: "radio",
} as const;

/**
 * Catégories fonctionnelles.
 */
export const MODULE_CATEGORIES = {
  community: "social",

  network: "social",

  boutique: "commerce",

  services: "services",

  jobs: "employment",

  health: "health",

  justice: "justice",

  city: "city",

  voyages: "travel",

  annonces: "commerce",

  pay: "finance",

  education: "education",

  live: "media",
} as const;

/**
 * Priorités Home par défaut.
 *
 * Elles restent surchargées si nécessaire par
 * la configuration Home.
 */
export const MODULE_HOME_PRIORITIES = {
  community: 95,

  network: 90,

  boutique: 85,

  services: 88,

  jobs: 100,

  health: 80,

  justice: 70,

  city: 78,

  voyages: 65,

  annonces: 92,

  pay: 82,

  education: 83,

  live: 75,
} as const;

/**
 * Types de publications utilisés par le feed.
 *
 * On utilise les valeurs déjà présentes dans l'architecture
 * Convex du projet.
 */
export const MODULE_PUBLICATION_TYPES = {
  community: ["community"],

  network: [],

  boutique: ["annonce"],

  services: ["service"],

  jobs: ["job"],

  health: ["sante"],

  justice: [],

  city: [],

  voyages: [],

  annonces: ["annonce"],

  pay: [],

  education: ["article"],

  live: ["video"],
} as const;

/**
 * Modules possédant actuellement un feed.
 */
export const MODULES_WITH_FEED = [
  "community",
  "boutique",
  "services",
  "jobs",
  "health",
  "annonces",
  "education",
  "live",
] as const;

/**
 * Modules pouvant alimenter la section Nearby.
 */
export const MODULES_WITH_NEARBY = [
  "boutique",
  "services",
  "jobs",
  "health",
  "city",
  "voyages",
  "annonces",
] as const;

/**
 * Modules pouvant alimenter la section Opportunities.
 */
export const MODULES_WITH_OPPORTUNITIES = [
  "jobs",
  "services",
  "boutique",
  "annonces",
  "education",
] as const;

/**
 * Modules activés par défaut.
 */
export const ENABLED_MODULE_IDS = [...MODULE_IDS] as const;

/**
 * Nombre total de modules.
 */
export const MODULE_COUNT = MODULE_IDS.length;
