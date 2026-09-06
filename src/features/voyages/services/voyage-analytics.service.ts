// src/features/voyages/services/voyage-analytics.service.ts
export class VoyageAnalyticsService {
  /**
   * Récupère les statistiques analytiques d'un voyage (Stubbed pour la compilation)
   */
  static useTripAnalytics(tripId: string) {
    return {
      analytics: undefined,
      isLoading: false,
    };
  }

  /**
   * Récupère les trajets les plus populaires de l'opérateur (Stubbed pour la compilation)
   */
  static usePopularTrips(limit: number = 10) {
    return {
      trips: undefined,
      isLoading: false,
    };
  }

  /**
   * Récupère les statistiques globales d'activité de l'opérateur (Stubbed pour la compilation)
   */
  static useGlobalStats() {
    return {
      stats: undefined,
      isLoading: false,
    };
  }
}
