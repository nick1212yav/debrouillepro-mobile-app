// src/features/network/types/index.ts
import type { Id } from "@/convex/_generated/dataModel";
import type { NetworkUser } from "./network.types";

export * from "./network.types";
export * from "./profile.types";
export * from "./experience.types";
export * from "./education.types";
export * from "./skill.types";
export * from "./company.types";
export * from "./opportunity.types";

// ✅ Déclaration unifiée de NetworkProfile (avec la propriété joinedAt requise) [1]
export interface NetworkProfile extends NetworkUser {
  headline?: string;
  company?: string;
  website?: string;
  experiences?: any[];
  educations?: any[];
  skills?: any[];
  recommendations?: any[];
  joinedAt?: string;
}

// Interface de certification professionnelle [1]
export interface NetworkCertification {
  _id: Id<"networkCertifications">;
  userId: Id<"users">;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}
