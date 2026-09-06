// src/features/network/types/experience.types.ts
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Types pour les expériences professionnelles
 */

export interface NetworkExperience {
  _id: string;
  userId: Id<"users">;
  title: string;
  company: string;
  companyLogo?: string;
  location?: string;
  startDate: string; // ISO date string
  endDate?: string;
  current: boolean;
  description?: string;
  achievements?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NetworkExperienceCreatePayload {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
  achievements?: string[];
}

export interface NetworkExperienceUpdatePayload extends Partial<NetworkExperienceCreatePayload> {
  id: string;
}
