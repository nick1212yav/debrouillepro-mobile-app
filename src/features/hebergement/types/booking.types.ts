export type BookingStatusType =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "rejected";

export interface BookingGuests {
  adults: number;
  children: number;
}

export interface BookingPricing {
  subtotal: number;
  cleaningFee?: number;
  serviceFee?: number;
  discount?: number;
  deposit?: number;
  total: number;
  currency: string;
}

export interface AccommodationBooking {
  id: string;
  accommodationId: string;
  userId: string;
  checkIn: string;
  checkOut: string;
  guests: BookingGuests;
  nights: number;
  pricing: BookingPricing;
  status: BookingStatusType;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  createdAt: number;
  updatedAt?: number;
}
