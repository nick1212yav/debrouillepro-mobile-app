// src/features/publications/config/index.ts

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
import { marketplaceConfig } from "./modules/marketplace.config";
import { videoConfig } from "./modules/video.config";
import { articleConfig } from "./modules/article.config";
import { sondageConfig } from "./modules/sondage.config";

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
 * ============================================================================
 *
 * 27 types canoniques alignés avec :
 *   - convex/schema.ts          → publications.type
 *   - features/publications/types/index.ts → PublicationType
 *
 * Aucun alias ici. Les correspondances UX (emploi → job, logement → immo,
 * tourisme → voyages, culture → evenement, tech → media) sont gérées par
 * les mappings côté frontend, jamais par la base.
 * ========================================================================== */

export const PUBLICATION_CONFIG: Record<PublicationType, PublicationConfig> = {
  /* ─── Vie quotidienne ─────────────────────────────────────────────── */

  immo: immoConfig,
  hebergement: hebergementConfig,
  restauration: restaurationConfig,
  service: serviceConfig,

  /* ─── Travail & finances ──────────────────────────────────────────── */

  job: jobConfig,
  finance: financeConfig,
  business: businessConfig,
  marketplace: marketplaceConfig,

  /* ─── Mobilité ────────────────────────────────────────────────────── */

  transport: transportConfig,
  voyages: voyagesConfig,

  /* ─── Santé & bien-être ───────────────────────────────────────────── */

  sante: santeConfig,

  /* ─── Éducation ───────────────────────────────────────────────────── */

  education: educationConfig,

  /* ─── Communauté & social ─────────────────────────────────────────── */

  community: communityConfig,
  groupes: groupesConfig,
  network: networkConfig,
  evenement: evenementConfig,

  /* ─── Médias & création ───────────────────────────────────────────── */

  media: mediaConfig,
  video: videoConfig,
  article: articleConfig,
  creator: creatorConfig,
  sondage: sondageConfig,

  /* ─── Agriculture & environnement ─────────────────────────────────── */

  agri: agriConfig,
  environnement: environnementConfig,
  energie: energieConfig,

  /* ─── Gouvernance ─────────────────────────────────────────────────── */

  justice: justiceConfig,
  ong: ongConfig,

  /* ─── Annonces ────────────────────────────────────────────────────── */

  annonce: annonceConfig,
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
