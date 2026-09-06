// src/features/transport/constants/status.ts
import type { TripStatus, BookingStatus } from "../types";

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  active: "Actif",
  completed: "Terminé",
  cancelled: "Annulé",
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  cancelled: "Annulé",
};
