// src/features/transport/adapter.ts
import type { TransportRoute, TransportBooking, VehicleType } from "./types";

export const adapter = {
  /**
   * Adapter un document brut de trajet Convex vers le type structuré TransportRoute [1]
   */
  adaptRoute(rawRoute: any): TransportRoute {
    return {
      _id: rawRoute._id,
      _creationTime: rawRoute._creationTime,
      origin: rawRoute.origin || "Lieu de départ inconnu",
      destination: rawRoute.destination || "Destination inconnue",
      departureTime: rawRoute.departureTime || "--:--",
      vehicleType: (rawRoute.vehicleType as VehicleType) || "voiture",
      seats: rawRoute.seats ?? 0,
      seatsAvailable: rawRoute.seatsAvailable ?? 0,
      pricePerSeat: rawRoute.pricePerSeat ?? 0,
      currency: rawRoute.currency || "FCFA",
      driverId: rawRoute.driverId || "",
      driverName: rawRoute.driverName || "Chauffeur Anonyme [2]",
      driverPhone: rawRoute.driverPhone,
      driverRating: rawRoute.driverRating ?? 5.0,
      vehicleModel: rawRoute.vehicleModel,
      vehiclePlate: rawRoute.vehiclePlate,
      description: rawRoute.description,
      status: rawRoute.status || "active",
      coordinates:
        rawRoute.latitude && rawRoute.longitude
          ? {
              origin: { lat: rawRoute.latitude, lng: rawRoute.longitude },
              destination: { lat: rawRoute.latitude, lng: rawRoute.longitude },
            }
          : undefined,
    };
  },

  /**
   * Adapter une liste de trajets
   */
  adaptRoutes(rawRoutes: any[]): TransportRoute[] {
    if (!Array.isArray(rawRoutes)) return [];
    return rawRoutes.map(this.adaptRoute);
  },

  /**
   * Adapter un document brut de réservation Convex vers le type structuré TransportBooking [1]
   */
  adaptBooking(rawBooking: any): TransportBooking {
    return {
      _id: rawBooking._id,
      _creationTime: rawBooking._creationTime,
      routeId: rawBooking.routeId,
      userId: rawBooking.userId,
      seats: rawBooking.seats ?? 1,
      totalAmount: rawBooking.totalAmount ?? 0,
      currency: rawBooking.currency || "FCFA",
      status: rawBooking.status || "pending",
      origin: rawBooking.origin,
      destination: rawBooking.destination,
      departureTime: rawBooking.departureTime,
    };
  },
};
