// src/features/network/types/profile.types.ts
import type { Id } from "@/convex/_generated/dataModel";
import type { UserRole, UserAvailability } from "./network.types";

/**
 * Types pour le profil utilisateur dans le module Network
 */

export interface NetworkProfile {
  _id: Id<"users">;
  userId: string;
  name: string;
  avatar?: string | null;
  cover?: string | null;
  headline?: string;
  bio?: string;
  city?: string;
  country?: string;
  roles: UserRole[];
  interests: string[];
  verified: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
  rating?: number;
  reviewCount?: number;
  availability: UserAvailability;
  joinedAt: string;
  lastActive?: string;
  isFollowedByMe?: boolean;
  isFollowingMe?: boolean;
}

export interface ProfileVisibility {
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  showActivity: boolean;
}

export interface ProfileUpdatePayload {
  name?: string;
  headline?: string;
  bio?: string;
  city?: string;
  country?: string;
  roles?: UserRole[];
  interests?: string[];
  avatar?: string | null;
  cover?: string | null;
  availability?: UserAvailability;
  visibility?: ProfileVisibility;
}
