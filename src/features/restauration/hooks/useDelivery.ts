import { useState, useEffect } from "react";
import { DeliveryService } from "../services/DeliveryService";
import type { DeliveryTracker } from "../types/delivery.types";
import type { GeoCoordinates } from "../types/common.types";

export function useDelivery(orderId?: string) {
  const [tracker, setTracker] = useState<DeliveryTracker | null>(null);
  const [coordinates, setCoordinates] = useState<GeoCoordinates | null>(null);
  const [speed, setSpeed] = useState<number>(0);

  useEffect(() => {
    if (!orderId) return;

    const activeTracker = DeliveryService.getTracker(orderId);
    if (activeTracker) {
      setTracker(activeTracker);
      setCoordinates(activeTracker.currentCoordinates);
    }

    const locationHandler = DeliveryService.getLocationHandler(orderId);
    if (!locationHandler) return;

    // Écoute du flux géographique réel
    const unsubscribe = locationHandler.onLocationUpdate(
      (newCoordinates, currentSpeed) => {
        setCoordinates(newCoordinates);
        setSpeed(currentSpeed);

        // Mise à jour de l'état consolidé
        setTracker((prev) =>
          prev
            ? {
                ...prev,
                currentCoordinates: newCoordinates,
                speedKmh: currentSpeed,
              }
            : null,
        );
      },
    );

    return () => {
      unsubscribe();
    };
  }, [orderId]);

  return { tracker, coordinates, speed };
}
