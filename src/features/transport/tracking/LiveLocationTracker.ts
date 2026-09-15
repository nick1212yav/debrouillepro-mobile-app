// src/features/transport/tracking/LiveLocationTracker.ts
import type { Coordinates } from "../types";

export type LocationCallback = (position: {
  coords: Coordinates;
  speed: number | null;
  heading: number | null;
  timestamp: string;
}) => void;

export class LiveLocationTracker {
  private static watchId: number | null = null;

  /**
   * Commencer l'écoute active des coordonnées GPS du périphérique mobile [2]
   */
  static startTracking(
    onLocationUpdate: LocationCallback,
    onError: (err: GeolocationPositionError) => void,
  ): boolean {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      console.warn(
        "La géolocalisation matérielle n'est pas disponible sur cet appareil [2].",
      );
      return false;
    }

    if (this.watchId !== null) {
      this.stopTracking(); // Éviter les écoutes matérielles multiples
    }

    // ✅ Utilisation de l'interface native correcte PositionOptions
    const options: PositionOptions = {
      enableHighAccuracy: true, // GPS de haute précision requis pour le suivi de course [2]
      timeout: 5000,
      maximumAge: 0,
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        onLocationUpdate({
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          speed: position.coords.speed
            ? parseFloat((position.coords.speed * 3.6).toFixed(1))
            : 0,
          heading: position.coords.heading,
          timestamp: new Date(position.timestamp).toISOString(),
        });
      },
      (error) => {
        onError(error);
      },
      options,
    );

    return true;
  }

  /**
   * Arrêter l'écoute du capteur GPS matériel pour économiser la batterie du mobile [2]
   */
  static stopTracking(): void {
    if (typeof window !== "undefined" && this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}
