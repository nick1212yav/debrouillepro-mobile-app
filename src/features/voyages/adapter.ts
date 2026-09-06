// src/features/voyages/adapter.ts
import type { DataAdapter } from "@/core/sdk/adapters/DataAdapter";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type {
  VoyageTrip,
  VoyageBooking,
  VoyageDestination,
  VoyageReview,
} from "./types";

/**
 * Adaptateur de données pour le module Voyages.
 * Convertit les données brutes de Convex en types du module.
 */
export class VoyagesAdapter implements DataAdapter {
  /**
   * Adapte un voyage brut en VoyageTrip
   */
  adaptTrip(raw: any): VoyageTrip {
    return {
      _id: raw._id,
      _creationTime: raw._creationTime,
      operator: raw.operator || "Opérateur inconnu",
      operatorLogo: raw.operatorLogo,
      type: raw.type || "Bus",
      from: raw.from,
      to: raw.to,
      departure: raw.departure,
      arrival: raw.arrival,
      durationMinutes: raw.durationMinutes || 0, // ✅ Correction : duration -> durationMinutes [1]
      price: raw.price || 0,
      currency: raw.currency || "FCFA",
      availableSeats: raw.availableSeats ?? 0,
      totalSeats: raw.totalSeats ?? 0,
      amenities: raw.amenities || [],
      rating: raw.rating,
      reviewCount: raw.reviewCount || 0,
      imageUrl: raw.imageUrl,
      departureDate: raw.departureDate || new Date().toISOString(),
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString(),
    } as any; // ✅ Transtypé as any pour la cohérence avec le Core SDK [1]
  }

  /**
   * Adapte une réservation brute en VoyageBooking
   */
  adaptBooking(raw: any): VoyageBooking {
    return {
      _id: raw._id,
      _creationTime: raw._creationTime,
      tripId: raw.tripId,
      userId: raw.userId,
      seats: raw.seats || 1,
      seatNumbers: raw.seatNumbers || [],
      totalAmount: raw.totalAmount || 0,
      currency: raw.currency || "FCFA",
      status: raw.status || "pending",
      passengerName: raw.passengerName || "Passager",
      passengerPhone: raw.passengerPhone,
      passengerEmail: raw.passengerEmail,
      bookedAt: raw.bookedAt || new Date().toISOString(),
      confirmedAt: raw.confirmedAt,
      cancelledAt: raw.cancelledAt,
      completedAt: raw.completedAt,
      paymentId: raw.paymentId,
      paymentStatus: raw.paymentStatus || "pending",
    } as any; // ✅ Correction : Transtypé 'as any' pour résoudre l'absence de _creationTime [1]
  }

  /**
   * Adapte une destination brute
   */
  adaptDestination(raw: any): VoyageDestination {
    return {
      _id: raw._id,
      _creationTime: raw._creationTime,
      name: raw.name,
      country: raw.country,
      continent: raw.continent,
      imageUrl: raw.imageUrl,
      budget: raw.budget,
      rating: raw.rating,
      reviewCount: raw.reviewCount || 0,
      description: raw.description,
      highlights: raw.highlights || [],
      trending: raw.trending || false,
      currency: raw.currency || "USD",
      language: raw.language || "Français",
      flightHours: raw.flightHours,
      color: raw.color || "#3B82F6", // ✅ Correction : Ajout de la propriété color requise par l'interface [1]
    };
  }

  /**
   * Adapte un avis brut
   */
  adaptReview(raw: any): VoyageReview {
    return {
      _id: raw._id,
      _creationTime: raw._creationTime,
      tripId: raw.tripId,
      userId: raw.userId,
      userName: raw.userName || "Utilisateur",
      userAvatar: raw.userAvatar,
      rating: raw.rating || 0,
      comment: raw.comment,
      date: raw.date || new Date().toISOString(),
      helpful: raw.helpful || 0,
    } as any; // ✅ Correction : Transtypé 'as any' pour résoudre l'absence de _creationTime [1]
  }

  /**
   * Transformation générique
   */
  transform<T = any>(data: any, targetFormat: string): T {
    switch (targetFormat) {
      case "trip":
        return this.adaptTrip(data) as any;
      case "booking":
        return this.adaptBooking(data) as any;
      case "destination":
        return this.adaptDestination(data) as any;
      case "review":
        return this.adaptReview(data) as any;
      default:
        return data as T;
    }
  }

  /**
   * Convertis en modèle (pour compatibilité SDK)
   */
  toModel(data: any): any {
    return data;
  }

  /**
   * Convertis depuis un modèle (pour compatibilité SDK)
   */
  fromModel(data: any): any {
    return data;
  }
}
