// src/features/publications/types/index.ts

import type { Id } from "@/convex/_generated/dataModel";

/* ============================================================================
 * PUBLICATION TYPES
 * ========================================================================== */

/**
 * Types de publications canoniques de DébrouillePro.
 *
 * Ce contrat est aligné à l'identique avec :
 *   - convex/schema.ts          → publications.type
 *   - config/index.ts           → registre central
 *   - config/modules/*          → configurations par type
 *
 * Ne JAMAIS ajouter un type ici sans avoir :
 *   1. étendu `publications.type` dans le schema Convex
 *   2. créé la config correspondante dans `config/modules/`
 *   3. vérifié qu'un producteur réel existe (form / sheet / mutation)
 *
 * Les modules qui ne produisent PAS de publications (Pay, Wallet, SOS,
 * Premium, Boost, Réputation, Récompenses, Parrainage, Sport autonome,
 * Settings, Messages, etc.) ne doivent PAS apparaître ici.
 *
 * Les aliases UX (emploi → job, logement → immo, tourisme → voyages,
 * culture → evenement, tech → media) sont gérés par les mappings côté
 * frontend, JAMAIS par la base.
 */
export type PublicationType =
  | "agri"
  | "annonce"
  | "article"
  | "business"
  | "community"
  | "creator"
  | "education"
  | "energie"
  | "environnement"
  | "evenement"
  | "finance"
  | "groupes"
  | "hebergement"
  | "immo"
  | "job"
  | "justice"
  | "marketplace"
  | "media"
  | "network"
  | "ong"
  | "restauration"
  | "sante"
  | "service"
  | "sondage"
  | "transport"
  | "video"
  | "voyages";

/* ============================================================================
 * AUTHOR
 * ========================================================================== */

export interface PublicationAuthor {
  id: Id<"users">;
  name: string;
  avatar?: string;
}

/* ============================================================================
 * PUBLICATION
 * ========================================================================== */

export interface Publication {
  _id: Id<"publications">;
  _creationTime: number;

  authorId: Id<"users">;
  author: PublicationAuthor;

  type: PublicationType;

  title: string;
  description: string;

  price?: string;
  location?: string;
  category?: string;

  /** URLs des images résolues par le backend */
  images: string[];

  tags: string[];

  likeCount: number;
  viewCount: number;
  commentCount: number;

  shareCount?: number;
  bookmarkCount?: number;

  status: "active" | "sold" | "closed";

  meta?: string;

  likedByMe: boolean;
  isMine: boolean;

  votedOptionId?: string | null;

  ctaClicks?: number;
  contacts?: number;
  calls?: number;
  bookings?: number;
  conversions?: number;
}

/* ============================================================================
 * PUBLICATION ACTION
 * ========================================================================== */

export interface PublicationAction {
  id: string;
  label: string;
  icon: React.ElementType;

  primary?: boolean;
  color?: string;
  showCount?: boolean;

  countKey?:
    | "likeCount"
    | "commentCount"
    | "viewCount"
    | "shareCount"
    | "bookmarkCount";

  requiresAuth?: boolean;
  requiresVerification?: boolean;
  roles?: string[];
}

/* ============================================================================
 * CTA
 * ========================================================================== */

export interface PublicationCTAConfig {
  label: string;
  icon?: React.ElementType;
  color?: string;

  action: string;

  route?: string;
  module?: PublicationType;

  requiresAuth?: boolean;
  requiresVerification?: boolean;
  requiresPayment?: boolean;
  requiresBooking?: boolean;

  aiCategory?: string;
  aiPrompt?: string;

  permissions?: string[];
}

/* ============================================================================
 * PUBLICATION CONFIGURATION
 * ========================================================================== */

export interface PublicationConfig {
  type: PublicationType;

  label: string;
  color: string;
  gradient: string;
  badge: string;

  icon: React.ElementType;

  cta: PublicationCTAConfig;
  actions: PublicationAction[];

  detailRoute: string;
  createRoute: string;

  placeholder: string;

  aiCategory?: string;
  aiPrompt?: string;

  paymentSupported?: boolean;
  priceRequired?: boolean;
  bookingRequired?: boolean;
  walletRequired?: boolean;

  trackCtaClicks?: boolean;
  trackContacts?: boolean;
  trackCalls?: boolean;
  trackBookings?: boolean;
  trackConversions?: boolean;
}
