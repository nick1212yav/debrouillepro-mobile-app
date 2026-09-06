// src/features/sante/types/doctor.types.ts
import type { Id } from "@/convex/_generated/dataModel";
import type { Education, Certificate, Award, Badge } from "./medical.types";

export type DoctorSpecialty =
  | "generaliste"
  | "cardiologue"
  | "pediatre"
  | "gynecologue"
  | "dentiste"
  | "ophtalmologue"
  | "dermatologue"
  | "psychiatre"
  | "neurologue"
  | "chirurgien"
  | "orthopediste"
  | "orl"
  | "urologue"
  | "endocrinologue"
  | "gastro-enterologue"
  | "pneumologue"
  | "rhumatologue"
  | "allergologue"
  | "nutritionniste"
  | "psychologue";

export type DoctorStatus = "active" | "inactive" | "pending" | "suspended";

export interface Doctor {
  _id: Id<"medicalProfessionals">;
  userId: string;
  name: string;
  specialty: DoctorSpecialty;
  rating: number;
  reviewCount: number;
  fees: number;
  currency: string;
  online: boolean;
  verified: boolean;
  distance?: number;
  address?: string;
  city?: string;
  country?: string;
  coordinates?: { lat: number; lng: number };
  phone?: string;
  email?: string;
  website?: string;
  videoUrl?: string;
  bio?: string;
  experience: number;
  education: Education[];
  specialities: string[];
  languages: string[];
  certificates: Certificate[];
  awards: Award[];
  insurances: string[];
  schedule: string;
  images: string[];
  badges: Badge[];
  patients: number;
  appointments: number;
  isLiked: boolean;
  isFollowing: boolean;
  isLive: boolean;
  liveUrl?: string;
  status: DoctorStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface DoctorFilters {
  specialty?: DoctorSpecialty;
  city?: string;
  online?: boolean;
  available?: boolean;
  minRating?: number;
  maxDistance?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface DoctorAvailability {
  available: string; // "today", "tomorrow", ...
  slots: string[];
  waitTime?: string;
  date?: Date;
}
