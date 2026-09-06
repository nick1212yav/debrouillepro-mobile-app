// src/features/sante/types/hospital.types.ts
import type { Id } from "@/convex/_generated/dataModel";

export type HospitalType =
  | "public"
  | "private"
  | "university"
  | "military"
  | "specialized";
export type HospitalService =
  | "urgences"
  | "cardiologie"
  | "neurologie"
  | "pediatrie"
  | "maternite"
  | "gynecologie"
  | "orthopedie"
  | "chirurgie-generale"
  | "ophtalmologie"
  | "dermatologie"
  | "psychiatrie"
  | "reanimation"
  | "radiologie"
  | "imagerie"
  | "laboratoire"
  | "bloc-operatoire"
  | "endoscopie"
  | "physiotherapie"
  | "nutrition"
  | "oncologie"
  | "hematologie"
  | "nephrologie"
  | "pneumologie"
  | "rhumatologie"
  | "medecine-interne";

export interface Hospital {
  _id: Id<"hospitals">;
  name: string;
  type: HospitalType;
  address: string;
  city: string;
  country: string;
  phone: string;
  email?: string;
  website?: string;
  hours: string;
  open: boolean;
  rating: number;
  reviewCount: number;
  priceRange: string;
  beds: number;
  occupiedBeds: number;
  doctors: number;
  specialties: number;
  description: string;
  services: HospitalService[];
  images: string[];
  coordinates?: { lat: number; lng: number };
  emergency: boolean;
  emergencyPhone?: string;
  ambulance: boolean;
  parking: boolean;
  pharmacy: boolean;
  cafeteria: boolean;
  wifi: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HospitalFilters {
  city?: string;
  emergency?: boolean;
  specialty?: HospitalService;
  minRating?: number;
  search?: string;
  limit?: number;
  offset?: number;
}
