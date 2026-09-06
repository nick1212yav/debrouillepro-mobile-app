// src/features/agri/services/AgriDeliveryService.ts
import type { AgriProduct } from "../types/product.types";

export class AgriDeliveryService {
  // Coût de base estimatif de transport au kilomètre par tonne (ex: 1500 CDF/km/tonne)
  private static COST_PER_KM_PER_TONNE = 1500;

  /**
   * Estime le tarif de transport/expédition basé sur la distance et le poids de la commande.
   */
  static estimateDeliveryCost(
    product: AgriProduct,
    distanceKm: number,
    orderQuantity: number,
  ): { isAvailable: boolean; estimatedCost: number; currency: string } {
    if (!product.delivery.available) {
      return {
        isAvailable: false,
        estimatedCost: 0,
        currency: product.pricing.currency,
      };
    }

    if (product.delivery.radius && distanceKm > product.delivery.radius) {
      return {
        isAvailable: false,
        estimatedCost: 0,
        currency: product.pricing.currency,
      };
    }

    // Conversion de la quantité d'ordre en tonnes si spécifié en kilogrammes
    let quantityInTonnes = orderQuantity;
    if (product.pricing.priceUnit === "kg") {
      quantityInTonnes = orderQuantity / 1000;
    }

    // Calcul brut basé sur la distance et le poids volumétrique
    const rawCostInCDF =
      distanceKm * quantityInTonnes * this.COST_PER_KM_PER_TONNE;
    const finalCostInCDF = Math.max(rawCostInCDF, 5000); // Forfait d'expédition minimal de 5000 CDF

    if (product.pricing.currency === "USD") {
      const costInUSD = finalCostInCDF / 2850;
      return {
        isAvailable: true,
        estimatedCost: parseFloat(costInUSD.toFixed(2)),
        currency: "USD",
      };
    }

    return {
      isAvailable: true,
      estimatedCost: Math.round(finalCostInCDF),
      currency: "CDF",
    };
  }
}
