// src/features/sante/types/common.types.ts

/**
 * Types de base partagés par toutes les entités du module Santé
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Address {
  street: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
  coordinates?: Coordinates;
}

export interface Contact {
  phone?: string;
  email?: string;
  website?: string;
}

export interface Rating {
  average: number;
  count: number;
  distribution?: { [key: number]: number };
}

export interface Badge {
  id: string;
  label: string;
  icon: "verified" | "emergency" | "top" | "expert" | "recommended";
  color?: string;
}

export interface OpeningHours {
  day: string;
  open: string; // e.g., "09:00"
  close: string; // e.g., "18:00"
  closed?: boolean;
}

export interface AuditFields {
  id: string; // identifiant frontend
  _id?: string; // identifiant Convex
  _creationTime?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}
