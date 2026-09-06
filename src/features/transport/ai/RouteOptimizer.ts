// src/features/transport/ai/RouteOptimizer.ts
import type { Coordinates } from "../types";

export interface OptimizedRouteResult {
  estimatedDurationMinutes: number;
  optimizedDistanceKm: number;
  stopsOrder: string[];
  co2SavedKg: number;
  trafficIntensity: "low" | "moderate" | "heavy";
  suggestedAlternativePath?: boolean;
}

export class RouteOptimizer {
  // Calcul de la distance à vol d'oiseau (Haversine Formula)
  static calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((coord1.lat * Math.PI) / 180) *
        Math.cos((coord2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  }

  // Optimisation de l'itinéraire en fonction de l'heure et des points GPS [2]
  static async optimizeRoute(
    origin: Coordinates,
    destination: Coordinates,
    intermediateStops: { name: string; coords: Coordinates }[],
    departureTime: string, // Format "HH:MM"
  ): Promise<OptimizedRouteResult> {
    const baseDistance = this.calculateDistance(origin, destination);

    // Détermination de l'intensité du trafic selon les heures de pointe typiques
    const [hour] = departureTime.split(":").map(Number);
    let trafficMultiplier = 1.0;
    let trafficIntensity: "low" | "moderate" | "heavy" = "low";

    if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19)) {
      trafficMultiplier = 1.7; // Trafic lourd à Kinshasa/Lagos pendant les heures de pointe [2]
      trafficIntensity = "heavy";
    } else if (hour >= 12 && hour <= 14) {
      trafficMultiplier = 1.3;
      trafficIntensity = "moderate";
    }

    // Calcul de la durée estimée de base (vitesse moyenne de 40km/h)
    const averageSpeedKmh = 40;
    const baseDurationHours = baseDistance / averageSpeedKmh;
    let estimatedDurationMinutes = Math.round(
      baseDurationHours * 60 * trafficMultiplier,
    );

    // Ajout d'un délai pour chaque arrêt intermédiaire
    const stopDelayMinutes = 8;
    estimatedDurationMinutes += intermediateStops.length * stopDelayMinutes;

    // Calcul CO2 économisé par rapport à un trajet individuel (facteur moyen d'économie verte de covoiturage)
    const co2SavedKg = parseFloat((baseDistance * 0.18 * 1.5).toFixed(1));

    // Tri simple des arrêts par distance la plus proche (Glouton/TSP simplifié)
    const sortedStops = [...intermediateStops].sort((a, b) => {
      const distA = this.calculateDistance(origin, a.coords);
      const distB = this.calculateDistance(origin, b.coords);
      return distA - distB;
    });

    return {
      estimatedDurationMinutes,
      optimizedDistanceKm: parseFloat((baseDistance * 1.1).toFixed(1)), // Ajustement réseau routier réel (+10%)
      stopsOrder: sortedStops.map((s) => s.name),
      co2SavedKg,
      trafficIntensity,
      suggestedAlternativePath: trafficIntensity === "heavy",
    };
  }
}
