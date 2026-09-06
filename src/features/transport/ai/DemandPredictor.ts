// src/features/transport/ai/DemandPredictor.ts
import type { Coordinates } from "../types";

export interface DemandForecast {
  coefficient: number; // Intensité de la demande (1.0 = normale, 2.0 = critique)
  estimatedWaitingMinutes: number; // Temps d'attente estimé pour le client
  zoneStatus: "tranquille" | "forte_demande" | "saturation";
}

export class DemandPredictor {
  /**
   * Prédire l'affluence d'une zone géographique spécifique [2]
   */
  static predictDemand(
    coords: Coordinates,
    hour: number,
    dayOfWeek: number, // 1 = Lundi, 7 = Dimanche
  ): DemandForecast {
    let coefficient = 1.0;

    // Heures d'affluence en semaine (Sortie de bureau, écoles) [2]
    const isWeekDay = dayOfWeek >= 1 && dayOfWeek <= 5;
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19);

    if (isWeekDay && isRushHour) {
      coefficient += 0.75;
    }

    // Majoration week-end nocturne (Sorties de clubs, restaurants) [2]
    const isWeekendNight =
      (dayOfWeek === 6 || dayOfWeek === 7) && (hour >= 21 || hour <= 2);
    if (isWeekendNight) {
      coefficient += 0.5;
    }

    // Détermination de l'état
    let zoneStatus: DemandForecast["zoneStatus"] = "tranquille";
    let estimatedWaitingMinutes = 5;

    if (coefficient >= 1.6) {
      zoneStatus = "saturation";
      estimatedWaitingMinutes = 18;
    } else if (coefficient >= 1.3) {
      zoneStatus = "forte_demande";
      estimatedWaitingMinutes = 10;
    }

    return {
      coefficient,
      estimatedWaitingMinutes,
      zoneStatus,
    };
  }
}
