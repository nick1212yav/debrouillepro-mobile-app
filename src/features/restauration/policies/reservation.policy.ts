import type { TableReservation } from "../types/reservation.types";

export class ReservationPolicy {
  private static readonly MINIMUM_PRE_BOOKING_HOURS = 2;
  private static readonly CANCELLATION_LEAD_HOURS = 4;

  public static isBookingLeadTimeValid(
    targetDateStr: string,
    targetTimeStr: string,
  ): boolean {
    const bookingDateTime = new Date(`${targetDateStr}T${targetTimeStr}:00`);
    const limitDateTime = new Date();
    limitDateTime.setHours(
      limitDateTime.getHours() + this.MINIMUM_PRE_BOOKING_HOURS,
    );

    return bookingDateTime >= limitDateTime;
  }

  public static isRefundableCancellation(
    reservation: TableReservation,
  ): boolean {
    const bookingDateTime = new Date(
      `${reservation.bookingDate}T${reservation.bookingTime}:00`,
    );
    const limitDateTime = new Date();
    limitDateTime.setHours(
      limitDateTime.getHours() + this.CANCELLATION_LEAD_HOURS,
    );

    return bookingDateTime >= limitDateTime;
  }

  public static validateGroupSize(
    guestsCount: number,
    sectionCapacity: number,
  ): boolean {
    return (
      guestsCount > 0 && guestsCount <= sectionCapacity && guestsCount <= 30
    );
  }
}
