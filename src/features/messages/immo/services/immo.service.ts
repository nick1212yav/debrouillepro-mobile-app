// src/features/messages/immo/services/immo.service.ts

import type { Id } from "@/../convex/_generated/dataModel";

export type PropertyId = Id<"properties">;

export type PropertyType =
  | "appartement"
  | "maison"
  | "villa"
  | "studio"
  | "bureau"
  | "terrain"
  | "chambre"
  | "entrepot";

export type TransactionType = "location" | "vente";

export type PropertyStatus = "available" | "rented" | "sold" | "archived";

export interface Property {
  _id: PropertyId;
  _creationTime: number;

  title: string;
  description: string;

  type: PropertyType;
  transactionType: TransactionType;

  price: number;
  currency: string;

  surface?: number;
  rooms?: number;
  bathrooms?: number;

  images: string[];
  videos?: string[];

  city: string;
  neighborhood?: string;
  address?: string;

  latitude?: number;
  longitude?: number;

  amenities: string[];

  phone?: string;

  ownerId: Id<"users">;

  status: PropertyStatus;
  featured: boolean;

  ownerName?: string;
  ownerAvatar?: string;
  ownerPhone?: string;
}

export interface PropertyMedia {
  _id: string;
  propertyId: PropertyId;

  type?: string;
  url?: string;

  [key: string]: unknown;
}

export interface PropertyWithMedia extends Property {
  media?: PropertyMedia[];
}

export interface PropertyRequest {
  propertyId: PropertyId;
  message: string;
  visitDate?: string;
}

export interface PropertyRequestResult {
  id: string;
}

/**
 * Formatage du prix utilisé dans les messages.
 */
export function formatPropertyPrice(price: number, currency: string): string {
  return (
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price) + ` ${currency.toUpperCase()}`
  );
}

/**
 * Libellé humain du type de bien.
 */
export function getPropertyTypeLabel(type: PropertyType): string {
  const labels: Record<PropertyType, string> = {
    appartement: "Appartement",
    maison: "Maison",
    villa: "Villa",
    studio: "Studio",
    bureau: "Bureau",
    terrain: "Terrain",
    chambre: "Chambre",
    entrepot: "Entrepôt",
  };

  return labels[type];
}

/**
 * Libellé humain de la transaction.
 */
export function getTransactionTypeLabel(type: TransactionType): string {
  return type === "location" ? "À louer" : "À vendre";
}

/**
 * Image principale du bien.
 */
export function getPropertyCoverImage(property: Property): string | null {
  return property.images?.[0] ?? property.videos?.[0] ?? null;
}
