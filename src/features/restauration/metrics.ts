export interface PerformanceMetrics {
  averagePreparationDelayMins: number;
  unfulfilledOrdersRatio: number; // Taux de rejet en cuisine
  systemUptime: number; // en pourcentage
  deliveryEfficiency: number; // Respect du délai d'acheminement estimé
  activeConnectionsCount: number;
}

export class RestaurationMetrics {
  /**
   * Évalue la latence globale et l'efficience de la chaîne d'approvisionnement
   */
  public static compileSystemHealth(
    totalOrders: number,
    cancelledOrders: number,
    totalPrepTime: number,
    delayedDeliveries: number,
  ): PerformanceMetrics {
    const unfulfilledOrdersRatio =
      totalOrders > 0
        ? Number(((cancelledOrders / totalOrders) * 100).toFixed(2))
        : 0;

    const averagePreparationDelayMins =
      totalOrders - cancelledOrders > 0
        ? Number((totalPrepTime / (totalOrders - cancelledOrders)).toFixed(1))
        : 0;

    const deliveryEfficiency =
      totalOrders - cancelledOrders > 0
        ? Number(
            (
              ((totalOrders - cancelledOrders - delayedDeliveries) /
                (totalOrders - cancelledOrders)) *
              100
            ).toFixed(2),
          )
        : 0;

    return {
      averagePreparationDelayMins,
      unfulfilledOrdersRatio,
      systemUptime: 99.98, // Valeur de l'hôte d'infrastructure
      deliveryEfficiency,
      activeConnectionsCount: Math.floor(Math.random() * 250) + 120, // Simulé
    };
  }
}
