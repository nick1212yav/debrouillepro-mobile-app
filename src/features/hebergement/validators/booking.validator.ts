import type { BookingGuests } from "../types/booking.types";

export interface BookingValidationData {
  checkIn: string;
  checkOut: string;
  guests: BookingGuests;
}

export const validateBooking = (
  data: BookingValidationData,
): { success: boolean; errors?: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!data.checkIn) {
    errors.checkIn = "La date d'arrivée est obligatoire.";
  }

  if (!data.checkOut) {
    errors.checkOut = "La date de départ est obligatoire.";
  }

  if (data.checkIn && data.checkOut) {
    const start = new Date(data.checkIn);
    const end = new Date(data.checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      errors.checkIn = "La date d'arrivée ne peut pas être dans le passé.";
    }

    if (end <= start) {
      errors.checkOut =
        "La date de départ doit être strictement supérieure à la date d'arrivée.";
    }
  }

  if (!data.guests || data.guests.adults < 1) {
    errors.guests = "Au moins un adulte doit être enregistré.";
  }

  return {
    success: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};
