import type { GeoCoordinates } from "./common.types";

export interface DeliveryTracker {
  deliveryId: string;
  orderId: string;
  courierId: string;
  courierName: string;
  courierPhone: string;
  vehiclePlate?: string;
  currentCoordinates: GeoCoordinates;
  destinationCoordinates: GeoCoordinates;
  etaMinutes: number;
  distanceRemainingKm: number;
  speedKmh: number;
}

export interface DeliveryRouteSpec {
  distanceKm: number;
  preparationTimeMins: number;
  trafficIntensity: "low" | "medium" | "heavy";
  weatherCondition: "clear" | "rainy" | "stormy";
  vehicleType: "moto" | "bicycle" | "car";
}
