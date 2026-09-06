// src/features/transport/ai/DriverMatcher.ts
import { RouteOptimizer } from "./RouteOptimizer";
import type { Coordinates, DriverProfile } from "../types";

export interface MatchedDriver {
  driver: DriverProfile;
  distanceKm: number;
  etaMinutes: number;
  suitabilityScore: number; // Score d'affinité d'attribution
}

export class DriverMatcher {
  /**
   * Rechercher et classer les meilleurs conducteurs pour une attribution [2]
   */
  static findBestMatch(
    passengerCoords: Coordinates,
    availableDrivers: { profile: DriverProfile; coords: Coordinates }[],
  ): MatchedDriver[] {
    const matches: MatchedDriver[] = availableDrivers.map((driverData) => {
      // Calculer la distance réelle
      const distanceKm = RouteOptimizer.calculateDistance(
        passengerCoords,
        driverData.coords,
      );

      // Estimer le temps d'arrivée (ETA) à 35 km/h de vitesse moyenne d'approche
      const etaMinutes = Math.max(1, Math.round((distanceKm / 35) * 60));

      // Calculer le score d'affinité d'attribution (Qualité de service + Distance) [2]
      // Un score plus élevé est plus adapté
      const distancePenalty = distanceKm * 15; // Moins de distance = meilleur score
      const ratingBonus = driverData.profile.rating * 20; // Meilleure note = meilleur score
      const verifiedBonus = driverData.profile.verified ? 15 : 0;

      const suitabilityScore = Math.round(
        100 - distancePenalty + ratingBonus + verifiedBonus,
      );

      return {
        driver: driverData.profile,
        distanceKm,
        etaMinutes,
        suitabilityScore,
      };
    });

    // Classer les conducteurs du plus adapté au moins adapté [2]
    return matches.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  }
}
