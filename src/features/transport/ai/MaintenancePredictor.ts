// src/features/transport/ai/MaintenancePredictor.ts
import type { VehicleType } from "../types";

export interface MaintenanceAssessment {
  needsImmediateRepair: boolean;
  daysUntilNextService: number;
  remainingOilLifePercent: number;
  predictedFailureRisk: "low" | "medium" | "high";
  recommendedActions: string[];
}

export class MaintenancePredictor {
  // Durée de vie moyenne recommandée de l'huile moteur en kilomètres selon le véhicule [2]
  private static OIL_LIFE_KM: Record<VehicleType, number> = {
    moto: 3000, // Usure très rapide en ville [2]
    taxi: 8000,
    voiture: 10000,
    minibus: 7000,
    bus: 12000,
    camion: 15000,
    livraison: 8000,
  };

  /**
   * Évaluer l'état prédictif d'un véhicule de la flotte [2]
   */
  static predictMaintenance(
    vehicleType: VehicleType,
    currentMileageKm: number,
    lastServiceMileageKm: number,
    ageMonths: number,
    hoursOperatedPerDay: number,
  ): MaintenanceAssessment {
    const kmSinceLastService = currentMileageKm - lastServiceMileageKm;
    const maxOilKm = this.OIL_LIFE_KM[vehicleType] || 8000;

    // Calcul de la dégradation estimée de l'huile
    const oilDecay = kmSinceLastService / maxOilKm;
    const remainingOilLifePercent = Math.max(
      0,
      Math.round((1 - oilDecay) * 100),
    );

    // Facteurs de risque de panne (IA prédictive basé sur l'effort quotidien) [2]
    let riskFactor = 0;
    if (hoursOperatedPerDay > 10) riskFactor += 30; // Usure intensive de taxi/minibus [2]
    if (kmSinceLastService > maxOilKm) riskFactor += 40;
    if (ageMonths > 60) riskFactor += 15; // Plus de 5 ans

    let predictedFailureRisk: MaintenanceAssessment["predictedFailureRisk"] =
      "low";
    if (riskFactor >= 70) {
      predictedFailureRisk = "high";
    } else if (riskFactor >= 40) {
      predictedFailureRisk = "medium";
    }

    const recommendedActions: string[] = [];
    if (remainingOilLifePercent < 15) {
      recommendedActions.push("Vidange de l'huile moteur immédiate [2]");
    }
    if (kmSinceLastService > maxOilKm * 1.5) {
      recommendedActions.push("Remplacement des filtres à air et carburant");
    }
    if (hoursOperatedPerDay > 12 && kmSinceLastService > maxOilKm * 0.8) {
      recommendedActions.push("Inspection approfondie du système de freinage");
    }

    const needsImmediateRepair =
      predictedFailureRisk === "high" || remainingOilLifePercent === 0;
    const averageKmPerDay = 150; // Approximé
    const daysUntilNextService = Math.max(
      0,
      Math.round((maxOilKm - kmSinceLastService) / averageKmPerDay),
    );

    return {
      needsImmediateRepair,
      daysUntilNextService,
      remainingOilLifePercent,
      predictedFailureRisk,
      recommendedActions:
        recommendedActions.length > 0
          ? recommendedActions
          : ["Aucune action requise. Véhicule sain [2]"],
    };
  }
}
