import type { Doc } from "@/convex/_generated/dataModel";

// ─── Types de base ──────────────────────────────────────────────

export type Property = Doc<"properties"> & {
  ownerName?: string;
  ownerAvatar?: string;
  ownerPhone?: string;
};

export type ImmoPublication = Doc<"publications"> & {
  meta?: {
    propertyId?: string;
    type?: string;
    transactionType?: string;
    price?: number;
    currency?: string;
    surface?: number;
    rooms?: number;
    bathrooms?: number;
    city?: string;
    neighborhood?: string;
    amenities?: string[];
    images?: string[];
    videos?: string[];
    status?: string;
    phone?: string;
  };
  author?: { name?: string; avatar?: string } | null;
};

// ─── Enums ──────────────────────────────────────────────────────

export const PROPERTY_TYPES = [
  "appartement",
  "maison",
  "villa",
  "studio",
  "bureau",
  "terrain",
  "chambre",
  "entrepot",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const TRANSACTION_TYPES = ["location", "vente"] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const PROPERTY_STATUS = [
  "available",
  "rented",
  "sold",
  "archived",
] as const;

export type PropertyStatus = (typeof PROPERTY_STATUS)[number];

export const AMENITIES = [
  "Piscine",
  "Garage",
  "Jardin",
  "Climatisation",
  "Chauffage",
  "Cuisine équipée",
  "Balcon",
  "Terrasse",
  "Ascenseur",
  "Sécurité 24h",
  "Parking",
  "Internet",
  "Câble",
  "Meublé",
  "Vue sur mer",
  "Proche école",
  "Proche transport",
  "Proche commerces",
] as const;

export type Amenity = (typeof AMENITIES)[number];

// ─── Métriques IA ──────────────────────────────────────────────

export interface PropertyScore {
  overall: number;
  priceScore: number;
  locationScore: number;
  amenitiesScore: number;
  conditionScore: number;
  potentialScore: number;
}

export interface NeighborhoodInfo {
  name: string;
  safety: number;
  schools: number;
  hospitals: number;
  shops: number;
  restaurants: number;
  transport: number;
  internet: number;
  electricity: number;
  water: number;
}

// ─── Médias avancés ────────────────────────────────────────────

export interface PropertyMedia {
  id: string;
  type: "photo" | "video" | "drone" | "360" | "plan" | "pdf" | "audio";
  url: string;
  thumbnail?: string;
  duration?: number;
  width?: number;
  height?: number;
  size?: number;
  order: number;
  isCover: boolean;
  title?: string;
  description?: string;
}

// ─── Documents ──────────────────────────────────────────────────

export interface PropertyDocument {
  id: string;
  type:
    | "title"
    | "contract"
    | "plan"
    | "diagnostic"
    | "certificate"
    | "receipt";
  url: string;
  title: string;
  size: number;
  uploadedAt: number;
}

// ─── Visites ────────────────────────────────────────────────────

export interface PropertyVisit {
  id: string;
  propertyId: string;
  userId: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  message?: string;
  createdAt: number;
}

// ─── Propriétaire ──────────────────────────────────────────────

export interface PropertyOwner {
  id: string;
  name: string;
  avatar?: string;
  phone?: string;
  email?: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  memberSince: number;
}

// ─── Statistiques ──────────────────────────────────────────────

export interface PropertyStats {
  views: number;
  favorites: number;
  visits: number;
  contacts: number;
  conversionRate: number;
  dailyViews: number[];
  weeklyViews: number[];
  monthlyViews: number[];
}
