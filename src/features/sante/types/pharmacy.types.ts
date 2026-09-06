// src/features/sante/types/pharmacy.types.ts
import type { Id } from "@/convex/_generated/dataModel";

export type PharmacyService =
  | "vente"
  | "ordonnances"
  | "livraison"
  | "conseil"
  | "tension"
  | "glycemie"
  | "pansements"
  | "hygiene"
  | "parapharmacie"
  | "orthopedie"
  | "dietetique"
  | "telemedecine"
  | "vaccination"
  | "depistage"
  | "location-materiel";

export interface PharmacyProduct {
  id: string;
  name: string;
  dosage: string;
  price: number;
  currency: string;
  stock: number;
  prescriptionRequired: boolean;
  category: string;
  image?: string;
  description?: string;
  manufacturer?: string;
  barcode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Pharmacy {
  _id: Id<"pharmacies">;
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email?: string;
  hours: string;
  open: boolean;
  rating: number;
  reviewCount: number;
  services: PharmacyService[];
  images: string[];
  latitude?: number;
  longitude?: number;
  delivery: boolean;
  deliveryRadius?: number;
  deliveryFee?: number;
  onlineOrders: boolean;
  acceptsInsurance: boolean;
  insurances?: string[];
  products: PharmacyProduct[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PharmacyFilters {
  city?: string;
  openNow?: boolean;
  minRating?: number;
  services?: PharmacyService[];
  delivery?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}
