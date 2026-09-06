// src/features/transport/analytics/RevenueAnalytics.ts

export interface RevenueBreakdown {
  totalGrossRevenueFcfa: number; // Chiffre d'affaires brut
  platformCommissionsFcfa: number; // Commissions perçues par DébrouillePro
  driverNetEarningsFcfa: number; // Revenu net redistribué aux chauffeurs
  averageTicketValueFcfa: number; // Panier moyen d'une course
}

export class RevenueAnalytics {
  private static COMMISSION_RATE = 0.12; // 12% de commission plateforme [2]

  /**
   * Calculer l'analyse financière brute et nette pour un volume d'affaires donné [2]
   */
  static calculateRevenueBreakdown(
    grossAmount: number,
    totalTrips: number,
  ): RevenueBreakdown {
    const platformCommissionsFcfa = parseFloat(
      (grossAmount * this.COMMISSION_RATE).toFixed(0),
    );
    const driverNetEarningsFcfa = grossAmount - platformCommissionsFcfa;
    const averageTicketValueFcfa =
      totalTrips > 0 ? parseFloat((grossAmount / totalTrips).toFixed(0)) : 0;

    return {
      totalGrossRevenueFcfa: grossAmount,
      platformCommissionsFcfa,
      driverNetEarningsFcfa,
      averageTicketValueFcfa,
    };
  }
}
