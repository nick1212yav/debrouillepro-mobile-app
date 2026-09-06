// src/features/sante/analytics/AppointmentAnalytics.ts

export interface AppointmentStats {
  totalAppointments: number;
  completed: number;
  cancelled: number;
  noShow: number;
  conversionRate: number; // 0-1
  averageDurationMinutes: number;
  averageLeadTimeHours: number; // délai moyen entre réservation et rendez-vous
  mostBookedSpecialty: string;
  teleconsultationRate: number;
}

export interface AppointmentTrend {
  date: Date;
  count: number;
  completed: number;
  cancelled: number;
}

/**
 * Analytics pour les rendez-vous.
 */
export class AppointmentAnalytics {
  async getGlobalStats(start?: Date, end?: Date): Promise<AppointmentStats> {
    return {
      totalAppointments: 320,
      completed: 280,
      cancelled: 25,
      noShow: 15,
      conversionRate: 0.875,
      averageDurationMinutes: 30,
      averageLeadTimeHours: 48,
      mostBookedSpecialty: "Médecin Généraliste",
      teleconsultationRate: 0.35,
    };
  }

  async getTrends(
    period: "day" | "week" | "month" = "week",
  ): Promise<AppointmentTrend[]> {
    // Simule des données de tendances
    return [
      { date: new Date("2025-04-01"), count: 12, completed: 10, cancelled: 2 },
      { date: new Date("2025-04-02"), count: 18, completed: 16, cancelled: 1 },
      { date: new Date("2025-04-03"), count: 15, completed: 13, cancelled: 1 },
      { date: new Date("2025-04-04"), count: 22, completed: 20, cancelled: 0 },
      { date: new Date("2025-04-05"), count: 20, completed: 18, cancelled: 1 },
      { date: new Date("2025-04-06"), count: 10, completed: 8, cancelled: 0 },
      { date: new Date("2025-04-07"), count: 14, completed: 12, cancelled: 1 },
    ];
  }

  /**
   * Retourne le taux d'annulation par spécialité.
   */
  async getCancellationRateBySpecialty(): Promise<Record<string, number>> {
    return {
      "Médecin Généraliste": 0.08,
      Cardiologue: 0.05,
      Pédiatre: 0.1,
      Dentiste: 0.12,
      Gynécologue: 0.06,
    };
  }
}
