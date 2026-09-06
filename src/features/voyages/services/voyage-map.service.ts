// src/features/voyages/services/voyage-map.service.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Service pour la cartographie des voyages.
 * Pour l'instant, un service de base. Plus tard, il pourra gérer
 * les coordonnées GPS, le tracking, etc.
 */
export class VoyageMapService {
  /**
   * Récupère les coordonnées d'une ville (si disponibles)
   * Pour l'instant, retourne null car le schéma Convex ne contient pas encore
   * les coordonnées des villes.
   */
  static useCityCoordinates(city: string) {
    // Pour l'instant, on retourne des coordonnées fictives si la ville est reconnue
    // Plus tard, on interrogera Convex pour les coordonnées réelles
    const mockCoordinates: Record<string, { lat: number; lng: number }> = {
      Dakar: { lat: 14.7167, lng: -17.4677 },
      Abidjan: { lat: 5.3599, lng: -4.0083 },
      Kinshasa: { lat: -4.3219, lng: 15.3154 },
      Lubumbashi: { lat: -11.6624, lng: 27.4773 },
      Nairobi: { lat: -1.2864, lng: 36.8172 },
      Lagos: { lat: 6.5244, lng: 3.3792 },
      Douala: { lat: 4.0511, lng: 9.7679 },
      Yaoundé: { lat: 3.848, lng: 11.5021 },
      Johannesburg: { lat: -26.2041, lng: 28.0473 },
      CapeTown: { lat: -33.9249, lng: 18.4241 },
    };

    const coords = mockCoordinates[city] || null;
    return {
      coordinates: coords,
      isLoading: false,
    };
  }

  /**
   * Calcule la distance approximative entre deux villes (vol d'oiseau)
   * en utilisant les coordonnées si disponibles.
   */
  static calculateDistance(city1: string, city2: string): number | null {
    const coords1 = this.useCityCoordinates(city1).coordinates;
    const coords2 = this.useCityCoordinates(city2).coordinates;
    if (!coords1 || !coords2) return null;

    const R = 6371; // Rayon de la Terre en km
    const dLat = ((coords2.lat - coords1.lat) * Math.PI) / 180;
    const dLng = ((coords2.lng - coords1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((coords1.lat * Math.PI) / 180) *
        Math.cos((coords2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Récupère les arrêts d'un itinéraire (si disponibles)
   */
  static useRouteStops(tripId: Id<"trips"> | null | undefined) {
    // Pour l'instant, retourne un tableau vide
    // Plus tard, on interrogera Convex
    const stops: any[] = [];
    return {
      stops,
      isLoading: false,
    };
  }

  /**
   * Génère une URL Google Maps pour le trajet
   */
  static getGoogleMapsUrl(from: string, to: string): string {
    const origin = encodeURIComponent(from);
    const destination = encodeURIComponent(to);
    return `https://www.google.com/maps/dir/${origin}/${destination}`;
  }
}
