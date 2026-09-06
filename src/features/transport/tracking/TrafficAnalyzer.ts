// src/features/transport/tracking/TrafficAnalyzer.ts

export type TrafficCondition = "fluid" | "moderate" | "congested" | "blocked";

export class TrafficAnalyzer {
  /**
   * Analyser l'intensité de trafic en direct [2]
   */
  static analyzeTrafficDensity(
    realSpeedKmh: number,
    expectedSpeedKmh: number,
  ): {
    condition: TrafficCondition;
    delayFactor: number;
    delayLabel: string;
  } {
    if (realSpeedKmh <= 0) {
      return {
        condition: "blocked",
        delayFactor: 2.2,
        delayLabel: "Embouteillage total / Blocage [2]",
      };
    }

    const ratio = realSpeedKmh / expectedSpeedKmh;

    if (ratio >= 0.85) {
      return {
        condition: "fluid",
        delayFactor: 1.0,
        delayLabel: "Trafic parfaitement fluide [2]",
      };
    }

    if (ratio >= 0.5) {
      return {
        condition: "moderate",
        delayFactor: 1.25,
        delayLabel: "Trafic modéré / Ralentissements légers",
      };
    }

    return {
      condition: "congested",
      delayFactor: 1.8,
      delayLabel: "Trafic fortement congestionné [2]",
    };
  }
}
