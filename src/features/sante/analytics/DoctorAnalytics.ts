// src/features/sante/analytics/DoctorAnalytics.ts

export interface DoctorStats {
  totalDoctors: number;
  averageRating: number;
  onlineCount: number;
  availableNowCount: number;
  topSpecialties: { specialty: string; count: number }[];
  averageFees: number;
  consultationsLast30Days: number;
  satisfactionScore: number; // 0-100
}

export interface DoctorPerformance {
  doctorId: string;
  name: string;
  specialty: string;
  rating: number;
  consultations: number;
  revenue: number;
  trend: "up" | "down" | "stable";
}

/**
 * Analytics pour les médecins.
 */
export class DoctorAnalytics {
  /**
   * Récupère les statistiques globales sur tous les médecins.
   * @param filter – filtre optionnel (spécialité, disponibilité, etc.)
   */
  async getGlobalStats(filter?: Record<string, any>): Promise<DoctorStats> {
    // Simulation – à remplacer par des appels Convex réels
    return {
      totalDoctors: 45,
      averageRating: 4.6,
      onlineCount: 12,
      availableNowCount: 8,
      topSpecialties: [
        { specialty: "Médecin Généraliste", count: 15 },
        { specialty: "Pédiatre", count: 8 },
        { specialty: "Cardiologue", count: 6 },
        { specialty: "Dentiste", count: 5 },
      ],
      averageFees: 8500,
      consultationsLast30Days: 320,
      satisfactionScore: 88,
    };
  }

  /**
   * Liste les performances individuelles des médecins, triées par note ou consultations.
   */
  async getPerformance(
    sortBy: "rating" | "consultations" | "revenue" = "rating",
  ): Promise<DoctorPerformance[]> {
    // Simulation
    const mock: DoctorPerformance[] = [
      {
        doctorId: "doc1",
        name: "Dr. Amara Diallo",
        specialty: "Généraliste",
        rating: 4.8,
        consultations: 45,
        revenue: 225000,
        trend: "up",
      },
      {
        doctorId: "doc2",
        name: "Dr. Ngozi Okoye",
        specialty: "Pédiatre",
        rating: 4.6,
        consultations: 32,
        revenue: 256000,
        trend: "stable",
      },
      {
        doctorId: "doc3",
        name: "Dr. Ibrahim Touré",
        specialty: "Cardiologue",
        rating: 4.9,
        consultations: 28,
        revenue: 420000,
        trend: "up",
      },
      {
        doctorId: "doc4",
        name: "Dr. Fatou Konaté",
        specialty: "Gynécologue",
        rating: 4.7,
        consultations: 38,
        revenue: 456000,
        trend: "down",
      },
    ];
    return mock.sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "consultations") return b.consultations - a.consultations;
      return b.revenue - a.revenue;
    });
  }

  /**
   * Calcule le taux d'occupation moyen des médecins (rendez-vous / créneaux).
   */
  async getOccupancyRate(start: Date, end: Date): Promise<number> {
    // Simulation – retourne un pourcentage
    return 0.72; // 72% d'occupation
  }
}
