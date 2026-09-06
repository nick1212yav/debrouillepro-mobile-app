// src/features/transport/types/booking.types.ts
import type { Id } from "@/convex/_generated/dataModel";
import type { BookingStatus } from "./index";

export interface BookingDetails {
  bookingId: Id<"transportBookings">;
  passengerId: Id<"users">;
  passengerName: string;
  passengerAvatar?: string;
  routeId: Id<"transportRoutes">;
  selectedSeats: number[];
  basePrice: number;
  taxAmount: number;
  totalPaid: number;
  currency: string;
  status: BookingStatus;
  createdAt: string;
}
