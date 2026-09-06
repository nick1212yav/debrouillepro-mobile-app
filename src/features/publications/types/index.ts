import type { Id } from "@/convex/_generated/dataModel";

/* ============================================================================
 * PUBLICATION TYPES
 * ========================================================================== */

/**
 * Types de publications supportés par l'interface.
 *
 * Ce contrat doit rester compatible avec les valeurs renvoyées
 * par Convex et utilisées par le LiveFeed.
 */
export type PublicationType =
  | "community"
  | "evenement"
  | "job"
  | "emploi"
  | "immo"
  | "logement"
  | "service"
  | "sante"
  | "transport"
  | "voyages"
  | "education"
  | "justice"
  | "annonce"
  | "agri"
  | "environnement"
  | "energie"
  | "ong"
  | "restauration"
  | "hebergement"
  | "media"
  | "finance"
  | "network"
  | "business"
  | "creator"
  | "tourisme"
  | "sport"
  | "culture"
  | "tech"
  | "marketplace"
  | "premium"
  | "boost"
  | "groupes"
  | "reputation"
  | "recompenses"
  | "parrainage"
  | "sos"
  | "video"
  | "article"
  | "sondage";

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
