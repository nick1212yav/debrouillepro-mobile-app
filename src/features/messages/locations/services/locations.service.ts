// src/features/messages/locations/services/locations.service.ts

import type { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";

export type ConversationId = Id<"conversations">;

export type MessageId = Id<"messages">;

export type LocationMode = "current" | "live";

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
}

export interface SharedLocation {
  type: "location";

  mode: LocationMode;

  latitude: number;
  longitude: number;

  accuracy?: number;

  altitude?: number | null;

  heading?: number | null;

  speed?: number | null;

  label?: string;

  address?: string;

  city?: string;

  country?: string;

  /**
   * Présent uniquement pour une
   * localisation en direct.
   */
  trackingId?: string;

  startedAt?: number;

  expiresAt?: number;

  isActive?: boolean;
}

export interface LocationMessage {
  _id: MessageId;

  conversationId: ConversationId;

  senderId: Id<"users">;

  text: string;

  type: "location";

  status: "sent" | "delivered" | "read" | "failed";

  reactions?: Array<{
    emoji: string;
    count: number;
  }>;

  metadata?: SharedLocation;

  createdAt?: number;

  _creationTime?: number;
}

/**
 * API Convex du module Locations.
 *
 * `convex/locations.ts` fournit ces fonctions.
 */
export const locationsApi = {
  send: api.locations.send,
  startLive: api.locations.startLive,
  updateLive: api.locations.updateLive,
  stopLive: api.locations.stopLive,
  getLive: api.locations.getLive,
} as const;

/**
 * Validation côté client.
 */
export function isValidCoordinates(
  latitude: number,
  longitude: number,
): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Transforme les coordonnées GPS natives
 * en structure partageable.
 */
export function normalizeCoordinates(
  position: GeolocationPosition,
): Coordinates {
  return {
    latitude: position.coords.latitude,

    longitude: position.coords.longitude,

    accuracy: position.coords.accuracy,

    altitude: position.coords.altitude,

    heading: position.coords.heading,

    speed: position.coords.speed,
  };
}

/**
 * URL universelle Google Maps.
 */
export function getGoogleMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${latitude},${longitude}`,
  )}`;
}

/**
 * URL OpenStreetMap.
 *
 * Utile pour une prévisualisation légère
 * sans dépendance cartographique supplémentaire.
 */
export function getOpenStreetMapUrl(
  latitude: number,
  longitude: number,
): string {
  const delta = 0.005;

  const left = longitude - delta;
  const right = longitude + delta;
  const top = latitude + delta;
  const bottom = latitude - delta;

  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
}

/**
 * URL d'une image de carte OSM.
 *
 * Elle peut être utilisée par un renderer
 * externe si nécessaire.
 */
export function getMapPreviewUrl(
  latitude: number,
  longitude: number,
  zoom = 15,
): string {
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=${zoom}&size=600x300&maptype=mapnik&markers=${latitude},${longitude},red-pushpin`;
}

/**
 * Texte d'affichage d'un emplacement.
 */
export function getLocationMessageText(location: SharedLocation): string {
  if (location.mode === "live") {
    return "📡 Position en direct";
  }

  if (location.label) {
    return `📍 ${location.label}`;
  }

  if (location.address) {
    return `📍 ${location.address}`;
  }

  return "📍 Emplacement partagé";
}

/**
 * Formate la durée d'une localisation Live.
 */
export function formatLiveDuration(seconds: number): string {
  if (seconds <= 60) {
    return `${Math.max(1, Math.round(seconds))} s`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remainingMinutes} min`;
}
