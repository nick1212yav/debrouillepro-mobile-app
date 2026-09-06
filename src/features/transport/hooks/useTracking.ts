// src/features/transport/hooks/useTracking.ts
import { useState, useEffect } from "react";
import type { Coordinates, TrackingData } from "../types";

export function useTracking(bookingId: string | null) {
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    setIsLoading(true);
    let tick = 0;
    const totalTicks = 30; // 30 étapes avant l'arrivée

    const interval = setInterval(() => {
      const progress = Math.min(tick / totalTicks, 1);

      // Coordonnées de départ (ex: Kinshasa Gombe) vers l'arrivée (ex: Lemba)
      const origin: Coordinates = { lat: -4.325, lng: 15.322 };
      const destination: Coordinates = { lat: -4.35, lng: 15.3 };

      const currentPosition: Coordinates = {
        lat: origin.lat + (destination.lat - origin.lat) * progress,
        lng: origin.lng + (destination.lng - origin.lng) * progress,
      };

      setTracking({
        routeId: bookingId as any,
        currentPosition,
        speedKmh: progress === 1 ? 0 : Math.round(35 + Math.random() * 15),
        bearing: 115,
        etaMinutes: Math.max(0, Math.round(15 * (1 - progress))),
        distanceRemainingKm: parseFloat((5.1 * (1 - progress)).toFixed(1)),
        updatedAt: new Date().toISOString(),
      });

      setIsLoading(false);
      tick++;
    }, 3000); // Mise à jour toutes les 3 secondes

    return () => clearInterval(interval);
  }, [bookingId]);

  return { tracking, isLoading };
}
