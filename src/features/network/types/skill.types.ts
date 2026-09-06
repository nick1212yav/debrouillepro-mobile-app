// src/features/network/types/skill.types.ts
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Types pour les compétences
 */

export interface NetworkSkill {
  _id: string;
  userId: Id<"users">;
  name: string;
  endorsements: number;
  endorsedBy: Id<"users">[];
  createdAt: string;
  updatedAt: string;
}

export interface NetworkSkillCreatePayload {
  name: string;
}

export interface NetworkSkillUpdatePayload {
  id: string;
  name?: string;
}
