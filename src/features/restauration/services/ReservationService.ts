import type { TableReservation } from "../types/reservation.types";
import { TableSection } from "../types/enums";
import { ReservationValidator } from "../validators/reservation.validator";
import { RestaurantService } from "./RestaurantService";
import { NotificationService } from "./NotificationService";

export class ReservationService {
  private static bookings: TableReservation[] = [];

  /**
   * Réserve une table de restaurant après contrôle de disponibilité
   */
  public static async bookTable(data: {
    restaurantId: number;
    userId: string;
    bookingDate: string;
    bookingTime: string;
    guestsCount: number;
    section: TableSection;
    specialRequest?: string;
  }) {
    const validation = ReservationValidator.validate({
      date: data.bookingDate,
      time: data.bookingTime,
      guests: data.guestsCount,
      section: data.section,
    });
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const restaurant = await RestaurantService.getById(data.restaurantId);
    if (!restaurant) {
      return {
        success: false,
        errors: { global: "Établissement sélectionné invalide." },
      };
    }

    const activeConflicts = this.bookings.filter(
      (b) =>
        b.restaurantId === data.restaurantId &&
        b.bookingDate === data.bookingDate &&
        b.bookingTime === data.bookingTime &&
        b.section === data.section &&
        !b.isCancelled,
    );

    if (activeConflicts.length >= 10) {
      return {
        success: false,
        errors: {
          global: `L'espace '${data.section}' est complet pour cet horaire.`,
        },
      };
    }

    const reservation: TableReservation = {
      id: `RES-${Date.now().toString().slice(-5)}-${Math.floor(10 + Math.random() * 90)}`,
      restaurantId: data.restaurantId,
      userId: data.userId,
      tableNumber: Math.floor(1 + Math.random() * 30),
      bookingDate: data.bookingDate,
      bookingTime: data.bookingTime,
      guestsCount: data.guestsCount,
      section: data.section,
      specialRequest: data.specialRequest,
      isCancelled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.bookings.push(reservation);

    await NotificationService.sendSMS(
      data.userId,
      `Réservation confirmée le ${data.bookingDate} à ${data.bookingTime} chez ${restaurant.name}.`,
    );

    return { success: true, reservation };
  }

  /**
   * Annule une réservation existante
   */
  public static async cancelBooking(id: string): Promise<boolean> {
    const booking = this.bookings.find((b) => b.id === id);
    if (!booking) return false;

    booking.isCancelled = true;
    return true;
  }
}
