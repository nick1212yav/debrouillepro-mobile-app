// src/features/sante/analytics/HospitalAnalytics.ts

export interface HospitalStats {
  totalHospitals: number;
  totalBeds: number;
  occupiedBeds: number;
  occupancyRate: number; // 0-1
  emergencyVisitsLast30Days: number;
  averageWaitTime: number; // minutes
  topServices: { service: string; count: number }[];
  averageRating: number;
}

export interface HospitalPerformance {
  hospitalId: string;
  name: string;
  beds: number;
  occupancyRate: number;
  emergencyVisits: number;
  rating: number;
}

/**
 * Analytics pour les hôpitaux.
 */
export class HospitalAnalytics {
  async getGlobalStats(): Promise<HospitalStats> {
    return {
      totalHospitals: 8,
      totalBeds: 420,
      occupiedBeds: 315,
      occupancyRate: 0.75,
      emergencyVisitsLast30Days: 680,
      averageWaitTime: 22,
      topServices: [
        { service: "Urgences", count: 8 },
        { service: "Cardiologie", count: 6 },
        { service: "Maternité", count: 5 },
        { service: "Pédiatrie", count: 4 },
      ],
      averageRating: 4.3,
    };
  }

  async getPerformance(): Promise<HospitalPerformance[]> {
    return [
      {
        hospitalId: "h1",
        name: "CHU de Kinshasa",
        beds: 120,
        occupancyRate: 0.82,
        emergencyVisits: 280,
        rating: 4.2,
      },
      {
        hospitalId: "h2",
        name: "Hôpital Saint-Joseph",
        beds: 80,
        occupancyRate: 0.65,
        emergencyVisits: 150,
        rating: 3.8,
      },
      {
        hospitalId: "h3",
        name: "Clinique Ngaliema",
        beds: 60,
        occupancyRate: 0.7,
        emergencyVisits: 90,
        rating: 4.5,
      },
    ];
  }

  /**
   * Calcule le temps d'attente moyen aux urgences.
   */
  async getEmergencyWaitTime(hospitalId?: string): Promise<number> {
    return 18; // minutes
  }
}
