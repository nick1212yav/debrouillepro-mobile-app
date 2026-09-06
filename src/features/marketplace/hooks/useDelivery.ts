// src/features/marketplace/hooks/useDelivery.ts
import { useState } from "react";

export function useDelivery() {
  const [options, setOptions] = useState([
    { id: "standard", label: "Standard", cost: 0, days: 3 },
    { id: "express", label: "Express", cost: 5000, days: 1 },
  ]);

  const estimate = (productId: string, location: string) => {
    // Simulation
    return options;
  };

  return { options, estimate, isLoading: false };
}
