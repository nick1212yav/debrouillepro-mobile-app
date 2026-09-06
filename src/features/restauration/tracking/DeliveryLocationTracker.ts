import type { GeoCoordinates } from "../types/common.types";

export type LocationUpdateListener = (
  coordinates: GeoCoordinates,
  speedKmh: number,
) => void;

export class DeliveryLocationTracker {
  private deliveryId: string;
  private currentPosition: GeoCoordinates;
  private lastUpdateTimestamp: number;
  private listeners: Set<LocationUpdateListener> = new Set();

  constructor(deliveryId: string, startCoordinates: GeoCoordinates) {
    this.deliveryId = deliveryId;
    this.currentPosition = startCoordinates;
    this.lastUpdateTimestamp = Date.now();
  }

  /**
   * Enregistre un observateur pour les mises à jour cartographiques en temps réel
   */
  public onLocationUpdate(listener: LocationUpdateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Réceptionne un nouveau point GPS, calcule la vitesse instantanée et notifie l'application
   */
  public pushNewCoordinates(newCoord: GeoCoordinates): void {
    const now = Date.now();
    const timeDeltaHours = (now - this.lastUpdateTimestamp) / 3600000; // MM vers heures

    let speedKmh = 0;
    if (timeDeltaHours > 0) {
      const distanceKm = this.calculateDistance(this.currentPosition, newCoord);
      speedKmh = Number((distanceKm / timeDeltaHours).toFixed(1));
    }

    // Filtrage des anomalies de calcul de vitesse (bruits GPS)
    if (speedKmh > 120) speedKmh = 50;

    this.currentPosition = newCoord;
    this.lastUpdateTimestamp = now;

    this.listeners.forEach((listener) => {
      try {
        listener(newCoord, speedKmh);
      } catch (err) {
        console.error(
          `[DeliveryLocationTracker] Erreur d'écouteur géographique pour le trajet ${this.deliveryId}:`,
          err,
        );
      }
    });
  }

  /**
   * Calcul géodésique interne simplifié de Haversine
   */
  private calculateDistance(c1: GeoCoordinates, c2: GeoCoordinates): number {
    const R = 6371;
    const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
    const dLng = ((c2.lng - c1.lng) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((c1.lat * Math.PI) / 180) *
        Math.cos((c2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  public getCurrentPosition(): GeoCoordinates {
    return this.currentPosition;
  }

  public getDeliveryId(): string {
    return this.deliveryId;
  }
}
