import type {
  AccommodationBooking,
  BookingGuests,
} from "../types/booking.types";
import { AvailabilityService } from "./AvailabilityService";
import { PricingService } from "./PricingService";

export class BookingService {
  private static bookings = new Map<string, AccommodationBooking>();

  static async createBooking(params: {
    accommodationId: string;
    userId: string;
    checkIn: string;
    checkOut: string;
    guests: BookingGuests;
    pricePerNight: number;
  }): Promise<{
    success: boolean;
    booking?: AccommodationBooking;
    error?: string;
  }> {
    const isAvailable = await AvailabilityService.checkAvailability(
      params.accommodationId,
      params.checkIn,
      params.checkOut,
    );

    if (!isAvailable) {
      return {
        success: false,
        error:
          "L'hébergement n'est pas disponible pour les dates sélectionnées.",
      };
    }

    const start = new Date(params.checkIn);
    const end = new Date(params.checkOut);
    const nights = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    );

    const pricing = PricingService.calculateTotal(params.pricePerNight, nights);

    const booking: AccommodationBooking = {
      id: "BK-" + Math.floor(100000 + Math.random() * 900000),
      accommodationId: params.accommodationId,
      userId: params.userId,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      guests: params.guests,
      nights,
      pricing: {
        subtotal: pricing.subtotal,
        cleaningFee: pricing.cleaningFee,
        serviceFee: pricing.serviceFee,
        deposit: pricing.deposit,
        total: pricing.total,
        currency: "FCFA",
      },
      status: "pending",
      paymentStatus: "pending",
      createdAt: Date.now(),
    };

    this.bookings.set(booking.id, booking);
    return { success: true, booking };
  }

  static getBooking(id: string): AccommodationBooking | undefined {
    return this.bookings.get(id);
  }

  static async cancelBooking(id: string): Promise<boolean> {
    const booking = this.bookings.get(id);
    if (!booking) return false;

    booking.status = "cancelled";
    this.bookings.set(id, booking);
    return true;
  }
}
