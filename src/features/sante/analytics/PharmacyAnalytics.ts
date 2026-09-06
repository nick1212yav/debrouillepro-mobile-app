// src/features/sante/analytics/PharmacyAnalytics.ts

export interface PharmacyStats {
  totalPharmacies: number;
  openNow: number;
  averageRating: number;
  topMedications: { name: string; totalSold: number }[];
  totalOrdersLast30Days: number;
  averageDeliveryTime: number; // minutes
  stockAlertCount: number; // nombre de produits en rupture ou stock faible
}

export interface PharmacyPerformance {
  pharmacyId: string;
  name: string;
  rating: number;
  orders: number;
  revenue: number;
  stockLevel: "high" | "medium" | "low";
}

/**
 * Analytics pour les pharmacies.
 */
export class PharmacyAnalytics {
  async getGlobalStats(): Promise<PharmacyStats> {
    return {
      totalPharmacies: 15,
      openNow: 10,
      averageRating: 4.2,
      topMedications: [
        { name: "Paracétamol 500mg", totalSold: 540 },
        { name: "Amoxicilline 250mg", totalSold: 380 },
        { name: "Ibuprofène 400mg", totalSold: 290 },
      ],
      totalOrdersLast30Days: 420,
      averageDeliveryTime: 45,
      stockAlertCount: 6,
    };
  }

  async getPerformance(): Promise<PharmacyPerformance[]> {
    return [
      {
        pharmacyId: "p1",
        name: "Pharmacie Centrale",
        rating: 4.5,
        orders: 120,
        revenue: 3200000,
        stockLevel: "medium",
      },
      {
        pharmacyId: "p2",
        name: "Pharmacie du Marché",
        rating: 4.0,
        orders: 85,
        revenue: 2100000,
        stockLevel: "low",
      },
      {
        pharmacyId: "p3",
        name: "Pharmacie Santé Plus",
        rating: 4.8,
        orders: 150,
        revenue: 4500000,
        stockLevel: "high",
      },
    ];
  }
}
