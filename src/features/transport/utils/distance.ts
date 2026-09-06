// src/features/transport/utils/distance.ts
import type { Coordinates } from "../types";

// Calcul de distance sphérique (Formule de Haversine)
export function getDistanceKm(
  coord1: Coordinates,
  coord2: Coordinates,
): number {
  const R = 6371; // Rayon moyen de la terre en km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// Estimation du temps de parcours théorique (vitesse moyenne de 35 km/h en ville)
export function estimateTravelTimeMinutes(
  distanceKm: number,
  isPeakHour = false,
): number {
  const averageSpeedKmh = isPeakHour ? 20 : 35; // Ralentissements d'heures de pointe
  const timeHours = distanceKm / averageSpeedKmh;
  return Math.max(1, Math.round(timeHours * 60));
}

// Formatage panafricain des monnaies (FCFA, USD)
export function formatMobilityPrice(amount: number, currency: string): string {
  if (currency === "FCFA") {
    return `${amount.toLocaleString("fr-FR")} FCFA`;
  }
  if (currency === "USD") {
    return `$${amount.toLocaleString("en-US")}`;
  }
  return `${amount.toLocaleString()} ${currency}`;
}
