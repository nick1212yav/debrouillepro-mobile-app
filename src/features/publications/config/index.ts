import type { PublicationConfig, PublicationType } from "../types";

import { communityConfig } from "./modules/community.config";
import { evenementConfig } from "./modules/evenement.config";
import { jobConfig } from "./modules/job.config";
import { immoConfig } from "./modules/immo.config";
import { serviceConfig } from "./modules/service.config";
import { santeConfig } from "./modules/sante.config";
import { transportConfig } from "./modules/transport.config";
import { voyagesConfig } from "./modules/voyages.config";
import { educationConfig } from "./modules/education.config";
import { justiceConfig } from "./modules/justice.config";
import { annonceConfig } from "./modules/annonce.config";
import { agriConfig } from "./modules/agri.config";
import { environnementConfig } from "./modules/environnement.config";
import { energieConfig } from "./modules/energie.config";
import { ongConfig } from "./modules/ong.config";
import { restaurationConfig } from "./modules/restauration.config";
import { hebergementConfig } from "./modules/hebergement.config";
import { mediaConfig } from "./modules/media.config";
import { financeConfig } from "./modules/finance.config";
import { networkConfig } from "./modules/network.config";
import { businessConfig } from "./modules/business.config";
import { creatorConfig } from "./modules/creator.config";
import { groupesConfig } from "./modules/groupes.config";

/* ============================================================================
 * DEFAULT CONFIG
 * ========================================================================== */

const DEFAULT_CONFIG: PublicationConfig = {
  type: "community",
  label: "Publication",
  color: "#6366F1",
  gradient: "from-indigo-500 to-purple-600",
  badge: "Publication",
  icon: communityConfig.icon,
  cta: communityConfig.cta,
  actions: communityConfig.actions,
  detailRoute: "/publication/:id",
  createRoute: "/publication/creer",
  placeholder: "Publier",
  aiCategory: "general",
  trackCtaClicks: true,
};

/* ============================================================================
 * PUBLICATION CONFIGURATION
 * ========================================================================== */

export const PUBLICATION_CONFIG: Record<PublicationType, PublicationConfig> = {
  /* --------------------------------------------------------------------------
   * Core
   * ------------------------------------------------------------------------ */

  community: communityConfig,
  evenement: evenementConfig,

  /* --------------------------------------------------------------------------
   * Emploi
   * ------------------------------------------------------------------------ */

  job: jobConfig,
  emploi: jobConfig,

  /* --------------------------------------------------------------------------
   * Immobilier
   * ------------------------------------------------------------------------ */

  immo: immoConfig,
  logement: immoConfig,

  /* --------------------------------------------------------------------------
   * Services
   * ------------------------------------------------------------------------ */

  service: serviceConfig,

  /* --------------------------------------------------------------------------
   * Santé
   * ------------------------------------------------------------------------ */

  sante: santeConfig,

  /* --------------------------------------------------------------------------
   * Transport & voyages
   * ------------------------------------------------------------------------ */

  transport: transportConfig,
  voyages: voyagesConfig,
  tourisme: voyagesConfig,

  /* --------------------------------------------------------------------------
   * Éducation / justice
   * ------------------------------------------------------------------------ */

  education: educationConfig,
  justice: justiceConfig,

  /* --------------------------------------------------------------------------
   * Annonces / agriculture
   * ------------------------------------------------------------------------ */

  annonce: annonceConfig,
  agri: agriConfig,
  environnement: environnementConfig,

  /* --------------------------------------------------------------------------
   * Énergie / ONG
   * ------------------------------------------------------------------------ */

  energie: energieConfig,
  ong: ongConfig,

  /* --------------------------------------------------------------------------
   * Commerce / restauration / hébergement
   * ------------------------------------------------------------------------ */

  restauration: restaurationConfig,
  hebergement: hebergementConfig,
  marketplace: serviceConfig,

  /* --------------------------------------------------------------------------
   * Media
   * ------------------------------------------------------------------------ */

  media: mediaConfig,

  /**
   * Vidéo et article utilisent actuellement la configuration Media.
   *
   * On garde des entrées explicites afin que le type PublicationType
   * reste exhaustif et que Record<PublicationType, PublicationConfig>
   * soit garanti par TypeScript.
   */
  video: {
    ...mediaConfig,
    type: "video",
    label: "Vidéo",
    badge: "Vidéo",
    placeholder: "Partager une vidéo",
    aiCategory: "video",
  },

  article: {
    ...mediaConfig,
    type: "article",
    label: "Article",
    badge: "Article",
    placeholder: "Publier un article",
    aiCategory: "article",
  },

  /* --------------------------------------------------------------------------
   * Finance / réseau / business
   * ------------------------------------------------------------------------ */

  finance: financeConfig,
  network: networkConfig,
  business: businessConfig,
  creator: creatorConfig,

  /* --------------------------------------------------------------------------
   * Communauté / contenu spécialisé
   * ------------------------------------------------------------------------ */

  sport: communityConfig,
  culture: mediaConfig,
  tech: serviceConfig,

  /* --------------------------------------------------------------------------
   * Sondages
   * ------------------------------------------------------------------------ */

  sondage: {
    ...communityConfig,
    type: "sondage",
    label: "Sondage",
    badge: "Sondage",
    placeholder: "Créer un sondage",
    aiCategory: "poll",
  },

  /* --------------------------------------------------------------------------
   * Premium / Boost
   * ------------------------------------------------------------------------ */

  premium: serviceConfig,
  boost: serviceConfig,

  /* --------------------------------------------------------------------------
   * Engagement / fidélité
   * ------------------------------------------------------------------------ */

  reputation: communityConfig,
  recompenses: communityConfig,
  parrainage: communityConfig,

  /* --------------------------------------------------------------------------
   * Sécurité
   * ------------------------------------------------------------------------ */

  sos: communityConfig,

  /* --------------------------------------------------------------------------
   * Groupes
   * ------------------------------------------------------------------------ */

  groupes: groupesConfig,
};

/* ============================================================================
 * HELPERS
 * ========================================================================== */

export function getPublicationConfig(type: PublicationType): PublicationConfig {
  return PUBLICATION_CONFIG[type] ?? DEFAULT_CONFIG;
}

export function getModuleByType(type: PublicationType): string {
  return PUBLICATION_CONFIG[type]?.label ?? "Publication";
}

export function getModuleColor(type: PublicationType): string {
  return PUBLICATION_CONFIG[type]?.color ?? "#6366F1";
}

export function getModuleIcon(type: PublicationType): React.ElementType {
  return PUBLICATION_CONFIG[type]?.icon ?? communityConfig.icon;
}

export function getModuleBadge(type: PublicationType): string {
  return PUBLICATION_CONFIG[type]?.badge ?? "Publication";
}
