// src/features/transport/types/index.ts
import type { Id } from "@/convex/_generated/dataModel";

export type VehicleType =
  | "voiture"
  | "bus"
  | "moto"
  | "taxi"
  | "minibus"
  | "camion"
  | "livraison";
export type TripStatus = "active" | "completed" | "cancelled";
export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface DriverProfile {
  userId: string;
  name: string;
  avatar?: string;
  phone: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
}

export interface VehicleDetails {
  type: VehicleType;
  model: string;
  plate: string;
  color?: string;
  capacity: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TransportRoute {
  _id: Id<"transportRoutes">;
  _creationTime: number;
  origin: string;
  destination: string;
  departureTime: string;
  vehicleType: VehicleType;
  seats: number;
  seatsAvailable: number;
  pricePerSeat: number;
  currency: string;
  driverId: string;
  driverName: string;
  driverPhone?: string;
  driverRating?: number;
  vehicleModel?: string;
  vehiclePlate?: string;
  description?: string;
  status: TripStatus;
  coordinates?: {
    origin: Coordinates;
    destination: Coordinates;
  };
}

export interface TransportBooking {
  _id: Id<"transportBookings">;
  _creationTime: number;
  routeId: Id<"transportRoutes">;
  userId: Id<"users">;
  seats: number;
  totalAmount: number;
  currency: string;
  status: BookingStatus;
  origin?: string;
  destination?: string;
  departureTime?: string;
}

export interface TrackingData {
  routeId: Id<"transportRoutes">;
  currentPosition: Coordinates;
  speedKmh: number;
  bearing: number;
  etaMinutes: number;
  distanceRemainingKm: number;
  updatedAt: string;
}
