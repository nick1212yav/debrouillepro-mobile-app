export interface MarketConditions {
  currentHour: number; // 0 à 23
  activeOrdersInQueue: number;
  availableDriversCount: number;
  isWeatherRaining: boolean;
  ingredientCostTrend: "stable" | "increasing" | "decreasing";
}

export class PriceOptimizer {
  private static readonly MAX_MARKUP = 1.3; // Maximum +30%
  private static readonly MIN_MARKDOWN = 0.85; // Minimum -15%

  /**
   * Calcule le prix optimal ajusté dynamiquement pour un plat
   */
  public static calculateDynamicPrice(
    basePrice: number,
    conditions: MarketConditions,
  ): { finalPrice: number; multiplier: number; reason: string } {
    let multiplier = 1.0;
    const reasons: string[] = [];

    // 1. Analyse des heures de forte affluence (Midi : 12h-14h et Soirée : 19h-21h30)
    const isPeakHour =
      (conditions.currentHour >= 12 && conditions.currentHour <= 14) ||
      (conditions.currentHour >= 19 && conditions.currentHour <= 21);

    if (isPeakHour) {
      multiplier += 0.08;
      reasons.push("Heure d'affluence élevée");
    }

    // 2. Surcharge liée à la météo (la pluie augmente la demande de livraison de 20%)
    if (conditions.isWeatherRaining) {
      multiplier += 0.1;
      reasons.push("Forte demande sous intempéries");
    }

    // 3. Pression sur la chaîne de livraison
    if (
      conditions.availableDriversCount < 3 &&
      conditions.activeOrdersInQueue > 10
    ) {
      multiplier += 0.07;
      reasons.push("Capacité de livraison sous haute tension");
    }

    // 4. Promotions heures creuses (Heure creuse l'après-midi : 15h-17h)
    const isOffPeakHour =
      conditions.currentHour >= 15 && conditions.currentHour <= 17;
    if (isOffPeakHour && conditions.activeOrdersInQueue < 3) {
      multiplier -= 0.1;
      reasons.push("Avantage heures creuses");
    }

    // En encadre le multiplicateur de prix pour préserver l'éthique commerciale
    if (multiplier > this.MAX_MARKUP) multiplier = this.MAX_MARKUP;
    if (multiplier < this.MIN_MARKDOWN) multiplier = this.MIN_MARKDOWN;

    // Arrondi mathématique à l'entier le plus proche (par tranche de 50 ou 100 FCFA pour l'Afrique de l'Ouest)
    const adjustedRawPrice = basePrice * multiplier;
    const finalPrice = Math.round(adjustedRawPrice / 50) * 50;

    return {
      finalPrice,
      multiplier: Number(multiplier.toFixed(2)),
      reason:
        reasons.length > 0
          ? reasons.join(", ")
          : "Conditions de marché standards",
    };
  }
}
