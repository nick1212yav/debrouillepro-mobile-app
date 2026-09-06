import { useState, useCallback } from "react";
import { ReservationService } from "../services/ReservationService";
import { TableSection } from "../types/enums";

export function useReservation() {
  const [isProcessing, setIsProcessing] = useState(false);

  const reserveTable = useCallback(
    async (data: {
      restaurantId: number;
      userId: string;
      bookingDate: string;
      bookingTime: string;
      guestsCount: number;
      section: TableSection;
      specialRequest?: string;
    }) => {
      setIsProcessing(true);
      try {
        return await ReservationService.bookTable(data);
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  const cancelReservation = useCallback(
    async (bookingId: string): Promise<boolean> => {
      setIsProcessing(true);
      try {
        return await ReservationService.cancelBooking(bookingId);
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  return { reserveTable, cancelReservation, isProcessing };
}
