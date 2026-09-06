// src/features/transport/tracking/ETACalculator.ts
import { TrafficAnalyzer } from "./TrafficAnalyzer";

export class ETACalculator {
  /**
   * Calculer dynamiquement le temps d'arrivée théorique et réel [2]
   */
  static estimateETA(
    distanceRemainingKm: number,
    averageSpeedKmh: number,
    trafficSpeedKmh: number,
  ): {
    theoreticalMinutes: number;
    realMinutes: number;
    delayMinutes: number;
  } {
    // Calcul de base théorique
    const baseHours = distanceRemainingKm / Math.max(15, averageSpeedKmh);
    const theoreticalMinutes = Math.max(1, Math.round(baseHours * 60));

    // Détermination de l'impact du trafic réel sur le trajet
    const trafficAnalysis = TrafficAnalyzer.analyzeTrafficDensity(
      trafficSpeedKmh,
      averageSpeedKmh,
    );
    const realMinutes = Math.max(
      1,
      Math.round(theoreticalMinutes * trafficAnalysis.delayFactor),
    );
    const delayMinutes = Math.max(0, realMinutes - theoreticalMinutes);

    return {
      theoreticalMinutes,
      realMinutes,
      delayMinutes,
    };
  }
}
