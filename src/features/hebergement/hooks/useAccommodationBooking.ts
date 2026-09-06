import { useState } from "react";

interface CreateBookingParams {
  accommodationId: string;
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
  };
}

export function useAccommodationBooking() {
  const [isProcessing, setIsProcessing] = useState(false);

  const createBooking = async (params: CreateBookingParams) => {
    setIsProcessing(true);
    return new Promise<{
      success: boolean;
      bookingId?: string;
      error?: string;
    }>((resolve) => {
      setTimeout(() => {
        setIsProcessing(false);
        const success = true;
        if (success) {
          const bookingId = "BK-" + Math.floor(100000 + Math.random() * 900000);
          resolve({ success: true, bookingId });
        } else {
          resolve({
            success: false,
            error: "Création de réservation échouée.",
          });
        }
      }, 1500);
    });
  };

  return { createBooking, isProcessing };
}
