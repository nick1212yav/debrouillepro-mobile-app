// src/features/network/types/network.types.ts
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Types de base pour le module Network
 */

export type UserRole =
  | "particulier"
  | "professionnel"
  | "entreprise"
  | "artisan"
  | "recruteur"
  | "etudiant"
  | "enseignant"
  | "fonctionnaire"
  | "entrepreneur"
  | "freelance"
  | "independant"
  | "autre";

export type UserAvailability = "available" | "limited" | "unavailable";

export interface NetworkUser {
  _id: Id<"users">;
  name: string;
  email?: string;
  avatar?: string | null;
  cover?: string | null;
  headline?: string;
  bio?: string;
  city?: string;
  country?: string;
  roles: UserRole[];
  interests: string[];
  verified: boolean;
  isFollowedByMe?: boolean;
  isFollowingMe?: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
  createdAt: string;
  updatedAt: string;
}

// ✅ Sécurité : L'interface NetworkProfile a été retirée de ce fichier
// pour être portée et exportée de façon centralisée par types/index.ts [1].

export interface NetworkStats {
  followerCount: number;
  followingCount: number;
  postCount: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  engagementRate: number;
}

export interface NetworkActivity {
  _id: string;
  type:
    | "post"
    | "follow"
    | "connection"
    | "job"
    | "service"
    | "comment"
    | "like";
  userId: Id<"users">;
  userName: string;
  userAvatar?: string;
  content: string;
  targetId?: string;
  createdAt: string;
}

export interface NetworkSearchFilters {
  type?: UserRole[];
  location?: string;
  industry?: string[];
  skills?: string[];
  availability?: UserAvailability;
  query?: string;
}
