// src/features/transport/analytics/TripAnalytics.ts
import type { TransportRoute } from "../types";

export interface FleetEfficiencyReport {
  totalRevenue: number;
  totalTripsCompleted: number;
  averageOccupancyRate: number;
  estimatedFuelConsumedLiters: number;
  carbonOffsetKg: number;
}

export class TripAnalytics {
  private static AVERAGE_FUEL_CONSUMPTION_L100 = 8.5; // Consommation moyenne de 8.5L/100km

  /**
   * Générer un rapport d'efficacité globale pour une liste de trajets [2]
   */
  static generateFleetReport(routes: TransportRoute[]): FleetEfficiencyReport {
    const completedTrips = routes.filter((r) => r.status === "completed");

    let totalRevenue = 0;
    let totalSeatsSold = 0;
    let totalSeatsCapacity = 0;
    let estimatedDistanceKm = 0;

    completedTrips.forEach((route) => {
      // Estimation de distance moyenne de trajet selon le tarif (approximation)
      const estimatedDistance = Math.max(5, route.pricePerSeat / 300);
      estimatedDistanceKm += estimatedDistance;

      const seatsSold = route.seats - route.seatsAvailable;
      totalSeatsSold += seatsSold;
      totalSeatsCapacity += route.seats;

      totalRevenue += seatsSold * route.pricePerSeat;
    });

    const averageOccupancyRate =
      totalSeatsCapacity > 0
        ? parseFloat(((totalSeatsSold / totalSeatsCapacity) * 100).toFixed(1))
        : 0;

    // Estimation du carburant consommé sur la flotte
    const estimatedFuelConsumedLiters = parseFloat(
      (
        (estimatedDistanceKm * this.AVERAGE_FUEL_CONSUMPTION_L100) /
        100
      ).toFixed(1),
    );

    // Économie carbone cumulée (calcul basé sur la réduction de voitures individuelles)
    const carbonOffsetKg = parseFloat(
      (totalSeatsSold * 0.18 * estimatedDistanceKm).toFixed(1),
    );

    return {
      totalRevenue,
      totalTripsCompleted: completedTrips.length,
      averageOccupancyRate,
      estimatedFuelConsumedLiters,
      carbonOffsetKg,
    };
  }
}
