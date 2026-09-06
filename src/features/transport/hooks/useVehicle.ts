// src/features/transport/hooks/useVehicle.ts
import { useState, useEffect } from "react";
import type { VehicleDetails } from "../types";

export function useVehicle(vehicleId?: string | null) {
  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!vehicleId) return;
    setIsLoading(true);

    const t = setTimeout(() => {
      setVehicle({
        type: "voiture",
        model: "Toyota Wish, 2014",
        plate: "5678AB01",
        capacity: 4,
        color: "Gris métallisé",
      });
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(t);
  }, [vehicleId]);

  return {
    vehicle,
    isLoading,
  };
}
