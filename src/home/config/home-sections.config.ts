import type {
  HomeSectionConfig,
  HomeSectionType,
} from "../types/home-section.types";

/**
 * ============================================================
 * DÉBROUILLEPRO — HOME SECTIONS CONFIGURATION
 * ============================================================
 */

/**
 * Configuration de chaque section Home.
 */
export const HOME_SECTIONS_CONFIG: Record<HomeSectionType, HomeSectionConfig> =
  {
    /**
     * ----------------------------------------------------------
     * POUR VOUS
     * ----------------------------------------------------------
     */
    for_you: {
      id: "home-for-you",

      type: "for_you",

      title: "Pour vous",

      subtitle: "Sélection personnalisée pour vous",

      icon: "sparkles",

      enabled: true,

      priority: 100,

      maxItems: 10,

      personalized: true,

      requiresLocation: false,

      requiresAuthentication: false,

      actions: [
        {
          id: "for-you-see-all",

          label: "Voir tout",

          actionType: "see_all",

          route: "/discover",

          enabled: true,
        },
      ],
    },

    /**
     * ----------------------------------------------------------
     * OPPORTUNITÉS
     * ----------------------------------------------------------
     */
    opportunities: {
      id: "home-opportunities",

      type: "opportunities",

      title: "Opportunités",

      subtitle: "Ce qui peut vous aider à avancer",

      icon: "briefcase",

      enabled: true,

      priority: 95,

      maxItems: 10,

      personalized: true,

      requiresLocation: false,

      requiresAuthentication: false,

      actions: [
        {
          id: "opportunities-see-all",

          label: "Voir les opportunités",

          actionType: "see_all",

          route: "/opportunities",

          enabled: true,
        },
      ],
    },

    /**
     * ----------------------------------------------------------
     * À PROXIMITÉ
     * ----------------------------------------------------------
     */
    nearby: {
      id: "home-nearby",

      type: "nearby",

      title: "Près de vous",

      subtitle: "Services, commerces et opportunités à proximité",

      icon: "map-pin",

      enabled: true,

      priority: 90,

      maxItems: 10,

      personalized: true,

      requiresLocation: true,

      requiresAuthentication: false,

      actions: [
        {
          id: "nearby-see-all",

          label: "Explorer",

          actionType: "navigate",

          route: "/map",

          enabled: true,
        },
      ],
    },

    /**
     * ----------------------------------------------------------
     * TENDANCES
     * ----------------------------------------------------------
     */
    trending: {
      id: "home-trending",

      type: "trending",

      title: "Tendances",

      subtitle: "Ce qui attire l'attention en ce moment",

      icon: "trending-up",

      enabled: true,

      priority: 80,

      maxItems: 10,

      personalized: false,

      requiresLocation: false,

      requiresAuthentication: false,

      actions: [
        {
          id: "trending-see-all",

          label: "Voir les tendances",

          actionType: "see_all",

          route: "/discover?filter=trending",

          enabled: true,
        },
      ],
    },

    /**
     * ----------------------------------------------------------
     * STORIES
     * ----------------------------------------------------------
     */
    stories: {
      id: "home-stories",

      type: "stories",

      title: "Stories",

      subtitle: "Les nouveautés de votre réseau",

      icon: "play-circle",

      enabled: true,

      priority: 75,

      maxItems: 15,

      personalized: true,

      requiresLocation: false,

      requiresAuthentication: false,

      actions: [
        {
          id: "stories-see-all",

          label: "Voir tout",

          actionType: "see_all",

          route: "/stories",

          enabled: true,
        },
      ],
    },

    /**
     * ----------------------------------------------------------
     * CONTINUER
     * ----------------------------------------------------------
     */
    continue: {
      id: "home-continue",

      type: "continue",

      title: "Continuer",

      subtitle: "Reprenez là où vous vous êtes arrêté",

      icon: "play",

      enabled: true,

      priority: 70,

      maxItems: 8,

      personalized: true,

      requiresLocation: false,

      requiresAuthentication: true,

      actions: [],
    },

    /**
     * ----------------------------------------------------------
     * RECOMMANDATIONS
     * ----------------------------------------------------------
     */
    recommendations: {
      id: "home-recommendations",

      type: "recommendations",

      title: "Recommandé pour vous",

      subtitle: "Des contenus et opportunités sélectionnés par DébrouillePro",

      icon: "sparkles",

      enabled: true,

      priority: 65,

      maxItems: 8,

      personalized: true,

      requiresLocation: false,

      requiresAuthentication: false,

      actions: [
        {
          id: "recommendations-refresh",

          label: "Actualiser",

          actionType: "refresh",

          enabled: true,
        },
      ],
    },
  };

/**
 * Ordre par défaut des sections.
 *
 * Le HomeEngine peut ensuite modifier cet ordre
 * selon la personnalisation.
 */
export const HOME_SECTION_ORDER: HomeSectionType[] = [
  "for_you",
  "opportunities",
  "nearby",
  "trending",
  "stories",
  "continue",
  "recommendations",
];

/**
 * Sections activées par défaut.
 */
export const HOME_ENABLED_SECTIONS: HomeSectionType[] =
  HOME_SECTION_ORDER.filter((type) => HOME_SECTIONS_CONFIG[type].enabled);

/**
 * Sections nécessitant la localisation.
 */
export const HOME_LOCATION_SECTIONS: HomeSectionType[] =
  HOME_SECTION_ORDER.filter(
    (type) => HOME_SECTIONS_CONFIG[type].requiresLocation,
  );

/**
 * Sections nécessitant une authentification.
 */
export const HOME_AUTHENTICATED_SECTIONS: HomeSectionType[] =
  HOME_SECTION_ORDER.filter(
    (type) => HOME_SECTIONS_CONFIG[type].requiresAuthentication,
  );

/**
 * Sections personnalisées.
 */
export const HOME_PERSONALIZED_SECTIONS: HomeSectionType[] =
  HOME_SECTION_ORDER.filter((type) => HOME_SECTIONS_CONFIG[type].personalized);

/**
 * Retourne la configuration d'une section.
 */
export function getHomeSectionConfig(type: HomeSectionType): HomeSectionConfig {
  return HOME_SECTIONS_CONFIG[type];
}

/**
 * Vérifie si une section est activée.
 */
export function isHomeSectionEnabled(type: HomeSectionType): boolean {
  return HOME_SECTIONS_CONFIG[type].enabled;
}

/**
 * Vérifie si une section nécessite la localisation.
 */
export function homeSectionRequiresLocation(type: HomeSectionType): boolean {
  return HOME_SECTIONS_CONFIG[type].requiresLocation ?? false;
}

/**
 * Vérifie si une section nécessite une authentification.
 */
export function homeSectionRequiresAuthentication(
  type: HomeSectionType,
): boolean {
  return HOME_SECTIONS_CONFIG[type].requiresAuthentication ?? false;
}

/**
 * Retourne les sections triées par priorité.
 */
export function getHomeSectionsByPriority(): HomeSectionConfig[] {
  return Object.values(HOME_SECTIONS_CONFIG)
    .filter((section) => section.enabled)
    .sort((a, b) => b.priority - a.priority);
}
