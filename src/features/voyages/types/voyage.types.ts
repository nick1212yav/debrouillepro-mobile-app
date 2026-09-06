// src/features/voyages/types/voyage.types.ts
import type { Doc, Id } from "@/convex/_generated/dataModel";

export type VoyageTrip = Doc<"trips">;

export type VoyageTransportType = "Bus" | "Minibus" | "Avion";

export type VoyageGalleryItem = {
  id: string;
  url: string;
  type?: "image" | "video";
  alt?: string;
};

export type VoyageStop = {
  city: string;
  time?: string;
  durationMinutes?: number;
};

export type VoyageRating = {
  rating: number;
  reviewCount: number;
};

export type VoyageBookingStep =
  | "passengers"
  | "seats"
  | "details"
  | "summary"
  | "payment"
  | "success";

// ✅ Ajouté : Type de destination conforme au schéma [1]
export interface VoyageDestination {
  _id: Id<"destinations">;
  _creationTime: number;
  name: string;
  country: string;
  continent: string;
  imageUrl: string;
  budget: string;
  rating: number;
  reviewCount: number;
  description: string;
  highlights: string[];
  trending: boolean;
  color: string;
  currency: string;
  language: string;
  flightHours: number;
}
