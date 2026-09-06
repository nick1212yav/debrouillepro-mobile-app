// src/features/transport/metrics.ts

export interface PerformanceMetrics {
  driverPunctualityPercent: number; // Ponctualité moyenne des chauffeurs
  averageResponseTimeSeconds: number; // Temps de réponse moyen d'attribution
  safetyIncidentsCount: number; // Alertes SOS déclenchées
  avgTripDurationMinutes: number; // Durée moyenne des courses
}

export class MobilityMetricsEvaluator {
  /**
   * Évaluer la performance brute de l'activité sur une période
   */
  static evaluateMetrics(): PerformanceMetrics {
    return {
      driverPunctualityPercent: 96.4,
      averageResponseTimeSeconds: 42,
      safetyIncidentsCount: 0,
      avgTripDurationMinutes: 38,
    };
  }
}
