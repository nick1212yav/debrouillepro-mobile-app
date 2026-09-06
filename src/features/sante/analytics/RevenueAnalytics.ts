// src/features/sante/analytics/RevenueAnalytics.ts

export interface RevenueSummary {
  totalRevenue: number;
  revenueByDoctor: { doctorId: string; name: string; amount: number }[];
  revenueByHospital: { hospitalId: string; name: string; amount: number }[];
  revenueByPharmacy: { pharmacyId: string; name: string; amount: number }[];
  revenueBreakdown: {
    consultation: number;
    teleconsultation: number;
    pharmacy: number;
    emergency: number;
  };
  dailyRevenue: { date: Date; amount: number }[];
  projectedRevenue: number;
}

export interface RevenueStats {
  averageRevenuePerConsultation: number;
  totalTransactions: number;
  paymentMethodBreakdown: {
    method: string;
    amount: number;
    count: number;
  }[];
  refunds: number;
  netRevenue: number;
}

/**
 * Analytics financiers.
 */
export class RevenueAnalytics {
  async getSummary(start?: Date, end?: Date): Promise<RevenueSummary> {
    // Simulation
    return {
      totalRevenue: 28500000, // FCFA
      revenueByDoctor: [
        { doctorId: "doc1", name: "Dr. Amara Diallo", amount: 4500000 },
        { doctorId: "doc2", name: "Dr. Ngozi Okoye", amount: 3200000 },
        { doctorId: "doc3", name: "Dr. Ibrahim Touré", amount: 5800000 },
      ],
      revenueByHospital: [
        { hospitalId: "h1", name: "CHU de Kinshasa", amount: 9800000 },
        { hospitalId: "h2", name: "Hôpital Saint-Joseph", amount: 3200000 },
      ],
      revenueByPharmacy: [
        { pharmacyId: "p1", name: "Pharmacie Centrale", amount: 4500000 },
        { pharmacyId: "p2", name: "Pharmacie du Marché", amount: 2100000 },
        { pharmacyId: "p3", name: "Pharmacie Santé Plus", amount: 5500000 },
      ],
      revenueBreakdown: {
        consultation: 12000000,
        teleconsultation: 4500000,
        pharmacy: 8500000,
        emergency: 3500000,
      },
      dailyRevenue: [
        { date: new Date("2025-04-01"), amount: 850000 },
        { date: new Date("2025-04-02"), amount: 920000 },
        { date: new Date("2025-04-03"), amount: 780000 },
        { date: new Date("2025-04-04"), amount: 1050000 },
        { date: new Date("2025-04-05"), amount: 950000 },
        { date: new Date("2025-04-06"), amount: 610000 },
        { date: new Date("2025-04-07"), amount: 820000 },
      ],
      projectedRevenue: 32000000,
    };
  }

  async getStats(start?: Date, end?: Date): Promise<RevenueStats> {
    return {
      averageRevenuePerConsultation: 8500,
      totalTransactions: 420,
      paymentMethodBreakdown: [
        { method: "Carte", amount: 12000000, count: 180 },
        { method: "Orange Money", amount: 8500000, count: 140 },
        { method: "Espèces", amount: 5500000, count: 70 },
        { method: "Assurance", amount: 2500000, count: 30 },
      ],
      refunds: 450000,
      netRevenue: 28050000,
    };
  }

  /**
   * Calcule le revenu moyen par patient (ou par médecin).
   */
  async getAverageRevenuePerUser(
    scope: "doctor" | "patient" = "doctor",
  ): Promise<number> {
    if (scope === "doctor") return 485000;
    return 12000;
  }
}
