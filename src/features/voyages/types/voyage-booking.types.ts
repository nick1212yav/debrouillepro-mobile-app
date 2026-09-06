// src/features/voyages/types/voyage-booking.types.ts
import type { Id } from "@/convex/_generated/dataModel";
import type { VoyageTrip } from "./voyage.types";

/**
 * Statut d'une réservation
 */
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "refunded";

/**
 * Informations sur un passager
 */
export interface Passenger {
  name: string;
  phone?: string;
  email?: string;
  documentId?: string;
  documentType?: "passport" | "national_id" | "driver_license";
}

/**
 * Détails d'une réservation
 */
export interface VoyageBooking {
  _id: Id<"tripBookings">;
  tripId: Id<"trips">;
  userId: Id<"users">;
  seats: number;
  seatNumbers: string[];
  totalPrice: number;
  currency: string;
  status: BookingStatus;
  passengerName: string;
  passengerPhone?: string;
  passengerEmail?: string;
  bookedAt: string;
  trip?: VoyageTrip; // peuplé lors des requêtes
}

/**
 * État du tunnel de réservation
 */
export interface VoyageBookingState {
  tripId: Id<"trips"> | null;
  seats: number;
  seatNumbers: string[];
  passenger: Passenger;
  step: "form" | "summary" | "payment" | "success";
}

/**
 * Formulaire de réservation
 */
export interface VoyageBookingFormData {
  passengerName: string;
  passengerPhone?: string;
  passengerEmail?: string;
  seats: number;
  seatNumbers: string[];
  specialRequests?: string;
}

/**
 * Résultat d'une réservation
 */
export interface VoyageBookingResult {
  bookingId: Id<"tripBookings">;
  status: BookingStatus;
  totalPrice: number;
  currency: string;
  booking: VoyageBooking;
}
