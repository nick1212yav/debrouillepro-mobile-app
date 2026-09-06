// src/features/transport/search.ts
import type { TransportRoute } from "./types";

export interface TransportSearchQuery {
  origin?: string;
  destination?: string;
  vehicleType?: string;
  maxPrice?: number;
  availableOnly?: boolean;
}

export class TransportSearchEngine {
  /**
   * Filtrer et indexer les trajets correspondants en temps réel [1]
   */
  static searchRoutes(
    routes: TransportRoute[],
    query: TransportSearchQuery,
  ): TransportRoute[] {
    return routes.filter((route) => {
      // 1. Filtrer par point d'origine
      if (
        query.origin &&
        !route.origin.toLowerCase().includes(query.origin.toLowerCase())
      ) {
        return false;
      }

      // 2. Filtrer par point d'arrivée
      if (
        query.destination &&
        !route.destination
          .toLowerCase()
          .includes(query.destination.toLowerCase())
      ) {
        return false;
      }

      // 3. Filtrer par catégorie de locomotion
      if (query.vehicleType && route.vehicleType !== query.vehicleType) {
        return false;
      }

      // 4. Filtrer par prix maximal
      if (query.maxPrice && route.pricePerSeat > query.maxPrice) {
        return false;
      }

      // 5. Filtrer par disponibilité de places
      if (query.availableOnly && route.seatsAvailable <= 0) {
        return false;
      }

      return true;
    });
  }
}
