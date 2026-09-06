// src/features/transport/analytics/UserAnalytics.ts
import type { TransportBooking } from "../types";

export interface UserMobilityPattern {
  preferredVehicleType: string;
  averageWeeklySpendingFcfa: number;
  frequentRoutes: string[];
  totalTripsTaken: number;
}

export class UserAnalytics {
  /**
   * Modéliser les habitudes de déplacement de l'utilisateur [2]
   */
  static analyzeUserHistory(bookings: TransportBooking[]): UserMobilityPattern {
    const totalTripsTaken = bookings.length;
    let totalSpending = 0;
    const routesMap: Record<string, number> = {};

    bookings.forEach((booking) => {
      totalSpending += booking.totalAmount;
      if (booking.origin && booking.destination) {
        const routeKey = `${booking.origin} → ${booking.destination}`;
        routesMap[routeKey] = (routesMap[routeKey] || 0) + 1;
      }
    });

    // Tri des itinéraires les plus récurrents [2]
    const frequentRoutes = Object.entries(routesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map((entry) => entry[0]);

    // Calcul de la dépense hebdomadaire approximée
    const averageWeeklySpendingFcfa =
      totalTripsTaken > 0
        ? parseFloat((totalSpending / 4).toFixed(0)) // Estimé sur un mois type de 4 semaines
        : 0;

    return {
      preferredVehicleType: "taxi", // Valeur par défaut
      averageWeeklySpendingFcfa,
      frequentRoutes:
        frequentRoutes.length > 0
          ? frequentRoutes
          : ["Aucun trajet récurrent pour le moment [2]"],
      totalTripsTaken,
    };
  }
}
