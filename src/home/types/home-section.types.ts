import type { ModuleId } from "@/config/modules/moduleRegistry";
import type { RecommendationItem } from "./home-recommendation.types";

/**
 * ============================================================
 * HOME — SECTION TYPES
 * ============================================================
 */

export type HomeSectionType =
  | "for_you"
  | "nearby"
  | "opportunities"
  | "trending"
  | "stories"
  | "continue"
  | "recommendations";

/**
 * Actions disponibles dans une section.
 */
export type HomeActionType =
  | "open"
  | "navigate"
  | "search"
  | "create"
  | "see_all"
  | "refresh"
  | "dismiss"
  | "share";

/**
 * Action Home.
 *
 * IMPORTANT :
 * aucune fonction n'est stockée ici.
 * L'exécution est faite par HomeActionEngine.
 */
export interface HomeAction {
  id: string;

  label: string;

  actionType: HomeActionType;

  actionPayload?: Record<string, unknown>;

  icon?: string;

  route?: string;

  enabled?: boolean;

  destructive?: boolean;
}

/**
 * Métadonnées d'une section.
 */
export interface HomeSectionMetadata {
  id?: string;

  moduleId?: ModuleId;

  source?: string;

  algorithm?: string;

  generatedAt?: number | Date;

  expiresAt?: number | Date;

  personalized?: boolean;

  nearby?: boolean;

  reason?: string;

  metadata?: Record<string, unknown>;
}

/**
 * Élément générique de feed.
 */
export interface FeedItem {
  id?: string;

  _id?: string;

  type:
    | "publication"
    | "job"
    | "community"
    | "event"
    | "module"
    | "service"
    | "action"
    | "feed"
    | "product"
    | "user"
    | "property"
    | "story";

  moduleId?: ModuleId;

  title?: string;

  description?: string;

  image?: string;

  imageUrl?: string;

  route?: string;

  url?: string;

  authorId?: string;

  authorName?: string;

  authorAvatar?: string;

  createdAt?: number | Date;

  updatedAt?: number | Date;

  score?: number;

  metadata?: Record<string, unknown>;
}

/**
 * Élément représentant un module suggéré.
 */
export interface ModuleCardItem {
  id: string;

  type: "module";

  moduleId: ModuleId;

  label: string;

  title: string;

  description?: string;

  icon?: string;

  image?: string;

  route: string;

  enabled?: boolean;

  priority?: number;

  metadata?: Record<string, unknown>;
}

/**
 * Élément d'une section Home.
 *
 * `recommendation` est explicitement présent ici.
 * Cela corrige les erreurs :
 *
 * "recommendation has no overlap"
 */
export type HomeSectionItem = FeedItem | RecommendationItem | ModuleCardItem;

/**
 * Données d'une section.
 */
export interface HomeSectionData {
  items: HomeSectionItem[];

  isLoading: boolean;

  type: HomeSectionType;

  title: string;

  subtitle?: string;

  icon?: string;

  actions?: HomeAction[];

  error?: string | null;

  metadata?: HomeSectionMetadata;
}

/**
 * Section complète.
 */
export interface HomeSection {
  id: string;

  type: HomeSectionType;

  title: string;

  subtitle?: string;

  icon?: string;

  description?: string;

  items: HomeSectionItem[];

  data?: HomeSectionData;

  actions?: HomeAction[];

  metadata?: HomeSectionMetadata;

  priority?: number;

  visible?: boolean;

  personalized?: boolean;

  isLoading?: boolean;

  error?: string | null;
}

/**
 * Configuration d'une section.
 */
export interface HomeSectionConfig {
  id: string;

  type: HomeSectionType;

  title: string;

  subtitle?: string;

  icon?: string;

  enabled: boolean;

  priority: number;

  maxItems: number;

  personalized?: boolean;

  requiresLocation?: boolean;

  requiresAuthentication?: boolean;

  actions?: HomeAction[];
}

/**
 * Résultat d'une section.
 */
export interface HomeSectionBuildResult {
  section: HomeSection;

  generatedAt: Date;

  itemCount: number;

  source?: string;

  reason?: string;
}
