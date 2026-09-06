// src/features/profile/types/index.ts

import type { Id } from "@/convex/_generated/dataModel";

export type ProfileTab = "apercu" | "activite" | "recents" | "classement";

export interface UserProfile {
  _id: Id<"users">;
  _creationTime: number;
  uid: string;
  tokenIdentifier: string;
  email?: string;
  phone?: string;
  name: string;
  avatar?: string;
  bio?: string;
  roles: string[];
  permissions?: string[];
  emailVerified: boolean;
  onboardingCompleted: boolean;
  reputationScore: number;
  city?: string;
  country?: string;
  language?: string;
  profession?: string;
  interests?: string[];
  website?: string;
}

export interface FollowStats {
  followerCount: number;
  followingCount: number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  level: string;
  totalXp: number;
  rank: number;
}
