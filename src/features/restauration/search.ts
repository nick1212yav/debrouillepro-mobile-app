// Import d'interface typée conforme à verbatimModuleSyntax
import type { RestaurantDetail } from "./types/restaurant.types";

import type { GeoCoordinates } from "./types/common.types";

export class RestaurationSearchEngine {
  /**
   * Calcule la distance physique entre deux coordonnées GPS (formule de Haversine)
   */
  public static calculateDistance(
    loc1: GeoCoordinates,
    loc2: GeoCoordinates,
  ): number {
    const R = 6371; // Rayon de la Terre en kilomètres
    const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
    const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.lat * Math.PI) / 180) *
        Math.cos((loc2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2)); // Distance en kilomètres
  }

  /**
   * Filtre et ordonne les restaurants par pertinence textuelle et proximité géographique
   */
  public static queryRestaurants(
    restaurants: RestaurantDetail[],
    query: string,
    userLocation?: GeoCoordinates,
    maxDistanceKm: number = 10,
  ): RestaurantDetail[] {
    const cleanQuery = query.toLowerCase().trim();

    return restaurants
      .filter((restaurant) => {
        const matchesText =
          restaurant.name.toLowerCase().includes(cleanQuery) ||
          restaurant.cuisine.toLowerCase().includes(cleanQuery) ||
          restaurant.location.toLowerCase().includes(cleanQuery);

        if (!matchesText && cleanQuery !== "") return false;

        if (userLocation && restaurant.coordinates) {
          const distance = this.calculateDistance(
            userLocation,
            restaurant.coordinates,
          );
          if (distance > maxDistanceKm) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (userLocation && a.coordinates && b.coordinates) {
          const distA = this.calculateDistance(userLocation, a.coordinates);
          const distB = this.calculateDistance(userLocation, b.coordinates);
          return distA - distB;
        }
        return b.rating - a.rating;
      });
  }
}
