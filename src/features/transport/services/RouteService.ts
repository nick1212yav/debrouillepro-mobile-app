// src/features/transport/services/RouteService.ts
import { GeocodingService } from "../utils/geocoding";
import {
  RouteOptimizer,
  type OptimizedRouteResult,
} from "../ai/RouteOptimizer";
import type { Coordinates } from "../types";

export interface CompleteRouteInfo extends OptimizedRouteResult {
  originCoords: Coordinates;
  destinationCoords: Coordinates;
}

export class RouteService {
  /**
   * Modéliser un itinéraire complet optimisé par IA à partir de simples adresses de départ et d'arrivée [2]
   */
  static async calculateItinerary(
    originAddress: string,
    destinationAddress: string,
    departureTime = "12:00",
  ): Promise<CompleteRouteInfo | null> {
    const originCoords = await GeocodingService.geocodeAddress(originAddress);
    const destinationCoords =
      await GeocodingService.geocodeAddress(destinationAddress);

    if (!originCoords || !destinationCoords) {
      return null;
    }

    // Appel à l'optimiseur de trajet IA
    const optimizedData = await RouteOptimizer.optimizeRoute(
      originCoords,
      destinationCoords,
      [], // Pas d'arrêts intermédiaires de base
      departureTime,
    );

    return {
      ...optimizedData,
      originCoords,
      destinationCoords,
    };
  }
}
