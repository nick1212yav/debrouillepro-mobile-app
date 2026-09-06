// src/features/transport/ai/FareEstimator.ts
import type { VehicleType } from "../types";

export interface FareEstimationResult {
  basePrice: number;
  dynamicMultiplier: number;
  estimatedDurationMinutes: number;
  totalEstimatedFare: number;
  surgeReason?: string;
}

export class FareEstimator {
  // Coefficients de coût de base selon le type de véhicule
  private static VEHICLE_BASE_RATES: Record<
    VehicleType,
    { base: number; perKm: number }
  > = {
    moto: { base: 300, perKm: 150 }, // Moto-taxi (Wewa/Zémidjan) : Économe et agile [2]
    taxi: { base: 1000, perKm: 400 }, // Taxi classique
    voiture: { base: 800, perKm: 300 }, // Covoiturage standard
    minibus: { base: 500, perKm: 200 }, // Minibus (Kombi/Esprit de vie)
    bus: { base: 300, perKm: 100 }, // Bus public
    camion: { base: 5000, perKm: 1200 }, // Fret / Transport de marchandises
    livraison: { base: 600, perKm: 250 }, // Livraison de colis
  };

  /**
   * Estimer dynamiquement le prix d'un trajet [2]
   */
  static estimateFare(
    distanceKm: number,
    vehicleType: VehicleType,
    hour: number,
    isRaining = false,
    city = "Kinshasa",
  ): FareEstimationResult {
    const rate = this.VEHICLE_BASE_RATES[vehicleType];

    // Calcul de la distance et de la durée théorique de base (moyenne de 35 km/h)
    const baseSpeedKmh = vehicleType === "moto" ? 45 : 35;
    const estimatedDurationMinutes = Math.max(
      2,
      Math.round((distanceKm / baseSpeedKmh) * 60),
    );

    // Tarification de base
    const basePrice = rate.base + distanceKm * rate.perKm;

    // Facteurs de majoration dynamique (Surge Pricing) [2]
    let dynamicMultiplier = 1.0;
    let surgeReason = "";

    // 1. Heures d'affluence (Heures de pointe) [2]
    if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19)) {
      dynamicMultiplier += 0.35; // +35% pendant l'affluence du matin et du soir [2]
      surgeReason = "Forte demande sur le réseau routier [2]";
    }

    // 2. Météo difficile (Pluie)
    if (isRaining) {
      dynamicMultiplier += 0.25; // +25% car le trafic ralentit fortement sous la pluie [2]
      surgeReason = surgeReason
        ? `${surgeReason} & Intempéries`
        : "Ralentissements causés par la pluie [2]";
    }

    // 3. Coefficient régional d'ajustement économique
    let cityAdjuster = 1.0;
    if (city.toLowerCase() === "dakar" || city.toLowerCase() === "abidjan") {
      cityAdjuster = 1.15; // Ajustement du pouvoir d'achat pour l'Afrique de l'Ouest
    }

    // Calcul du tarif final
    const finalFare = parseFloat(
      (basePrice * dynamicMultiplier * cityAdjuster).toFixed(0),
    );

    return {
      basePrice,
      dynamicMultiplier,
      estimatedDurationMinutes,
      totalEstimatedFare: finalFare,
      surgeReason: surgeReason || undefined,
    };
  }
}
