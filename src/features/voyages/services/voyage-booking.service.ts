// src/features/voyages/services/voyage-booking.service.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export class VoyageBookingService {
  /**
   * Récupère l'historique de réservations d'un utilisateur
   */
  static useMyBookings() {
    const data = useQuery(api.voyages.getMyBookings, {});
    return {
      bookings: data,
      isLoading: data === undefined,
    };
  }

  /**
   * Récupère le détail d'une réservation (Stubbed pour la compilation)
   */
  static useBooking(bookingId: string) {
    return {
      booking: undefined,
      isLoading: false,
    };
  }

  /**
   * Récupère l'état d'occupation des sièges du véhicule de transport (Stubbed pour la compilation)
   */
  static useSeatAvailability(tripId: string) {
    return {
      seats: undefined,
      isLoading: false,
    };
  }
}
