// src/features/marketplace/utils/shipping.ts

export interface ShippingEstimate {
  cost: number;
  currency: string;
  estimatedDays: number;
  method: string;
}

/**
 * Estime les frais de livraison en fonction du poids, de la distance et du mode
 * @param weightKg - Poids en kg
 * @param distanceKm - Distance en km (estimation)
 * @param method - Mode de livraison ("standard", "express", "pickup")
 * @param baseRate - Tarif de base par kg
 * @param currency - Devise
 * @returns Estimation de livraison
 */
export function estimateShipping(
  weightKg: number,
  distanceKm: number,
  method: "standard" | "express" | "pickup" = "standard",
  baseRate: number = 500, // FCFA par kg
  currency: string = "FCFA",
): ShippingEstimate {
  const weightFactor = Math.max(1, weightKg);
  const distanceFactor = Math.max(1, distanceKm / 100);
  let cost = weightFactor * baseRate * distanceFactor;

  // Ajustements selon le mode
  switch (method) {
    case "express":
      cost *= 1.8;
      break;
    case "pickup":
      cost = 0;
      break;
    default:
      break;
  }

  // Estimation des jours
  let estimatedDays = 3;
  if (method === "express") estimatedDays = 1;
  if (method === "pickup") estimatedDays = 0;
  if (distanceKm > 500) estimatedDays += 2;
  if (distanceKm > 1000) estimatedDays += 3;

  return {
    cost: Math.round(cost),
    currency,
    estimatedDays,
    method,
  };
}

/**
 * Vérifie si la livraison est disponible pour une localisation
 * @param location - Localisation du vendeur
 * @param deliveryAreas - Liste des zones de livraison
 * @returns boolean
 */
export function isDeliveryAvailable(
  location: string,
  deliveryAreas: string[] = [],
): boolean {
  if (deliveryAreas.length === 0) return true;
  return deliveryAreas.some((area) =>
    location.toLowerCase().includes(area.toLowerCase()),
  );
}
