import type { AccommodationBooking } from "../types/booking.types";

export class BookingPolicy {
  static maxStayNights = 90; // Séjour maximum de 90 jours
  static minStayNights = 1;

  static canBook(
    booking: Partial<AccommodationBooking>,
    maxGuestsAllowed: number,
  ): { allowed: boolean; reason?: string } {
    if (!booking.checkIn || !booking.checkOut) {
      return {
        allowed: false,
        reason: "Les dates d'arrivée et de départ doivent être définies.",
      };
    }

    const start = new Date(booking.checkIn);
    const end = new Date(booking.checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (nights < this.minStayNights) {
      return {
        allowed: false,
        reason: `Le séjour minimum est de ${this.minStayNights} nuit.`,
      };
    }

    if (nights > this.maxStayNights) {
      return {
        allowed: false,
        reason: `Le séjour maximum est de ${this.maxStayNights} nuits.`,
      };
    }

    if (booking.guests) {
      const totalGuests = booking.guests.adults + booking.guests.children;
      if (totalGuests > maxGuestsAllowed) {
        return {
          allowed: false,
          reason: `La capacité maximale autorisée pour ce logement est de ${maxGuestsAllowed} personnes.`,
        };
      }
    }

    return { allowed: true };
  }
}
