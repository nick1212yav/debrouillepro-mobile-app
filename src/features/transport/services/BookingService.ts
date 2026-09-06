// src/features/transport/services/BookingService.ts
import type { TransportRoute } from "../types";

export class BookingService {
  // Valider si une réservation peut être initiée [1]
  static validateBookingRequest(
    route: TransportRoute,
    requestedSeats: number,
  ): {
    isValid: boolean;
    reason?: string;
  } {
    if (route.status !== "active") {
      return {
        isValid: false,
        reason: "Ce trajet n'est plus actif ou a déjà été complété [2].",
      };
    }

    if (route.seatsAvailable < requestedSeats) {
      return {
        isValid: false,
        reason: `Nombre de sièges insuffisant. Seulement ${route.seatsAvailable} places restantes [2].`,
      };
    }

    return { isValid: true };
  }

  // Calculer le montant total de la réservation
  static calculateTotalCost(pricePerSeat: number, seats: number): number {
    return parseFloat((pricePerSeat * seats).toFixed(2));
  }
}
