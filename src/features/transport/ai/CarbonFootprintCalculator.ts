// src/features/transport/ai/CarbonFootprintCalculator.ts
import type { VehicleType } from "../types";

export interface CarbonImpactReport {
  emissionsSingleDriverKg: number; // Émissions si le client roulait seul
  emissionsSharedTripKg: number; // Émissions réelles du trajet partagé
  netSavedKg: number; // Économie nette
  greenAlternativeEquivalent: string; // Équivalent écologique (ex: arbres plantés)
}

export class CarbonFootprintCalculator {
  // Émissions moyennes de CO2 par kilomètre par type de véhicule (kg CO2/km) [2]
  private static CO2_FACTORS: Record<VehicleType, number> = {
    moto: 0.08, // Très faible empreinte [2]
    taxi: 0.18,
    voiture: 0.16,
    minibus: 0.28,
    bus: 0.65, // Élevé de base, mais divisé par 40+ passagers [2]
    camion: 0.95,
    livraison: 0.14,
  };

  /**
   * Calculer l'impact écologique d'un trajet de transport [2]
   */
  static calculateImpact(
    distanceKm: number,
    vehicleType: VehicleType,
    passengerCount: number,
  ): CarbonImpactReport {
    const factor = this.CO2_FACTORS[vehicleType] || 0.16;

    // Émissions d'un trajet seul dans une voiture standard
    const emissionsSingleDriverKg = parseFloat((distanceKm * 0.18).toFixed(2));

    // Émissions réelles partagées par passager
    let emissionsSharedTripKg = 0;
    if (vehicleType === "bus" || vehicleType === "minibus") {
      const realShareCount =
        vehicleType === "bus"
          ? Math.max(15, passengerCount)
          : Math.max(8, passengerCount);
      emissionsSharedTripKg = parseFloat(
        ((distanceKm * factor) / realShareCount).toFixed(2),
      );
    } else {
      emissionsSharedTripKg = parseFloat(
        ((distanceKm * factor) / Math.max(1, passengerCount)).toFixed(2),
      );
    }

    const netSavedKg = parseFloat(
      Math.max(0, emissionsSingleDriverKg - emissionsSharedTripKg).toFixed(2),
    );

    // Conversion en équivalent d'absorption carbone (1 arbre absorbe environ 22kg de CO2 par an)
    const treeAbsorptionDays = Math.round(netSavedKg / (22 / 365));
    const greenAlternativeEquivalent =
      netSavedKg > 0
        ? `Équivaut à l'absorption de carbone d'un arbre pendant ${treeAbsorptionDays} jour(s) [2].`
        : "Empreinte écologique neutre [2].";

    return {
      emissionsSingleDriverKg,
      emissionsSharedTripKg,
      netSavedKg,
      greenAlternativeEquivalent,
    };
  }
}
