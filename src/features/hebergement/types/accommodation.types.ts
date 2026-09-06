import type { RoomLayout } from "./room.types";
import type { Host } from "./host.types";

export type AccommodationType =
  | "Appartement"
  | "Villa"
  | "Studio"
  | "Hôtel"
  | "Colocation"
  | "Maison"
  | "Chambre"
  | "Auberge"
  | "Guesthouse"
  | "Lodge"
  | "Bungalow";

export interface AccommodationLocation {
  country: string;
  province?: string;
  city: string;
  district?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface AccommodationPricing {
  amount: number;
  currency: string;
  period: "night" | "day" | "week" | "month";
  cleaningFee?: number;
  serviceFee?: number;
  deposit?: number;
}

export interface AccommodationCapacity {
  guests: number;
  adults?: number;
  children?: number;
}

export interface AccommodationRooms {
  bedrooms: number;
  bathrooms: number;
  beds?: number;
  livingRooms?: number;
}

export interface AccommodationRules {
  pets?: boolean;
  smoking?: boolean;
  children?: boolean;
  parties?: boolean;
  checkIn?: string;
  checkOut?: string;
}

export interface Accommodation {
  id: string;
  type: AccommodationType | string;
  title: string;
  description: string;
  location: AccommodationLocation;
  pricing: AccommodationPricing;
  capacity: AccommodationCapacity;
  rooms: AccommodationRooms;
  area?: number;
  amenities: string[];
  images: string[];
  videos?: string[];
  virtualTour?: string;
  rating: number;
  reviewsCount: number;
  available: boolean;
  host: Host;
  rules?: AccommodationRules;
  tag?: string;
  roomsList?: RoomLayout[];
  createdAt?: number;
  updatedAt?: number;
}
