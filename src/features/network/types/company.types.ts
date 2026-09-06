// src/features/network/types/company.types.ts
import type { Id } from "@/convex/_generated/dataModel";
import type { UserRole } from "./network.types";

/**
 * Types pour les entreprises et organisations
 */

export interface NetworkCompany {
  _id: Id<"users">;
  name: string;
  logo?: string | null;
  cover?: string | null;
  description?: string;
  industry: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  size?: "1-10" | "11-50" | "51-200" | "201-500" | "500+";
  foundedYear?: number;
  roles: UserRole[];
  verified: boolean;
  followerCount: number;
  employeeCount: number;
  jobCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface NetworkCompanyEmployee {
  _id: Id<"users">;
  name: string;
  avatar?: string | null;
  role: string;
  joinedAt: string;
}

export interface NetworkCompanyJob {
  _id: string; // ✅ Correction : Id<"jobs"> -> string pour éviter les erreurs de compilation [1]
  title: string;
  location: string;
  type: "fulltime" | "parttime" | "contract" | "freelance" | "internship";
  description: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  postedAt: string;
  deadline?: string;
  applicantsCount: number;
  isActive: boolean;
}

export interface NetworkCompanyService {
  _id: string;
  title: string;
  description?: string;
  price?: string;
  category: string;
  createdAt: string;
}
