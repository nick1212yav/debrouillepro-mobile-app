// src/features/network/types/education.types.ts
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Types pour les formations
 */

export interface NetworkEducation {
  _id: string;
  userId: Id<"users">;
  school: string;
  degree: string;
  field: string;
  location?: string;
  startDate: string; // ISO date string
  endDate?: string;
  current: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NetworkEducationCreatePayload {
  school: string;
  degree: string;
  field?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface NetworkEducationUpdatePayload extends Partial<NetworkEducationCreatePayload> {
  id: string;
}
