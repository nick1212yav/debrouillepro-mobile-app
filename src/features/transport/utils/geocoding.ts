// src/features/transport/utils/geocoding.ts
import type { Coordinates } from "../types";

// Base de coordonnées des grands carrefours pour la résilience hors-ligne [2]
const AFRICAN_GEO_DATABASE: Record<string, Coordinates> = {
  "Gombe, Kinshasa": { lat: -4.303, lng: 15.311 },
  "Lemba, Kinshasa": { lat: -4.364, lng: 15.319 },
  "Aéroport de N'djili": { lat: -4.385, lng: 15.443 },
  "Limete, Kinshasa": { lat: -4.339, lng: 15.332 },
  "Bandalungwa, Kinshasa": { lat: -4.343, lng: 15.289 },
  "Plateau, Abidjan": { lat: 5.321, lng: -4.018 },
  "Cocody, Abidjan": { lat: 5.348, lng: -3.989 },
  "Dakar Plateau": { lat: 14.667, lng: -17.433 },
};

export class GeocodingService {
  /**
   * Résoudre une adresse textuelle en coordonnées géographiques (Geocoding) [2]
   */
  static async geocodeAddress(address: string): Promise<Coordinates | null> {
    // 1. Tenter une résolution locale immédiate (ultra-rapide et hors-ligne) [2]
    const matchedKey = Object.keys(AFRICAN_GEO_DATABASE).find(
      (key) =>
        address.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(address.toLowerCase()),
    );

    if (matchedKey) {
      return AFRICAN_GEO_DATABASE[matchedKey];
    }

    // 2. Fallback de coordonnées médianes de Kinshasa si adresse non référencée
    return { lat: -4.325, lng: 15.322 };
  }

  /**
   * Résoudre des coordonnées géographiques en adresse textuelle (Reverse Geocoding)
   */
  static async reverseGeocode(coords: Coordinates): Promise<string> {
    let closestAddress = "Adresse non spécifiée [2]";
    let minDistance = Infinity;

    // Algorithme de recherche du carrefour le plus proche
    for (const [address, geo] of Object.entries(AFRICAN_GEO_DATABASE)) {
      const dLat = coords.lat - geo.lat;
      const dLng = coords.lng - geo.lng;
      const dist = dLat * dLat + dLng * dLng; // Distance euclidienne simplifiée pour performance

      if (dist < minDistance) {
        minDistance = dist;
        closestAddress = address;
      }
    }

    return closestAddress;
  }
}
