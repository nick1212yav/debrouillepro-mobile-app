// src/features/marketplace/services/delivery.service.ts

export interface DeliveryEstimate {
  cost: number;
  days: number;
  method: string;
  tracking: boolean;
}

export class DeliveryService {
  /**
   * Estime les frais et délais de livraison
   */
  estimate(
    weight: number,
    distance: number,
    method: "standard" | "express" | "pickup",
  ): DeliveryEstimate {
    const baseCost = 1000;
    const weightFactor = weight * 500;
    const distanceFactor = distance / 100;

    let cost = baseCost + weightFactor * distanceFactor;
    let days = 3;

    switch (method) {
      case "express":
        cost *= 1.8;
        days = 1;
        break;
      case "pickup":
        cost = 0;
        days = 0;
        break;
      default:
        break;
    }

    return {
      cost: Math.round(cost),
      days,
      method,
      tracking: method !== "pickup",
    };
  }

  /**
   * Vérifie si la livraison est possible
   */
  isDeliverable(location: string, zones: string[]): boolean {
    if (zones.length === 0) return true;
    return zones.some((zone) =>
      location.toLowerCase().includes(zone.toLowerCase()),
    );
  }

  /**
   * Génère un numéro de suivi
   */
  generateTrackingNumber(): string {
    return `TRK-${Date.now().toString().slice(-6)}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  }
}

export const deliveryService = new DeliveryService();
