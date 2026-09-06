// src/features/sante/types/analytics.types.ts
import type { AppointmentStats } from "./appointment.types";

export interface DoctorStatistics {
  patients: number;
  appointments: number;
  yearsExperience: number;
  satisfactionScore: number;
  responseRate: number;
  averageResponseTime: number;
  completedConsultations: number;
  cancellationRate: number;
}

export interface RevenueStats {
  totalRevenue: number;
  averageRevenuePerConsultation: number;
  totalTransactions: number;
  paymentMethodBreakdown: { method: string; amount: number; count: number }[];
  refunds: number;
  netRevenue: number;
}

export interface HealthAnalytics {
  doctorStats: DoctorStatistics;
  appointmentStats: AppointmentStats;
  revenueStats: RevenueStats;
}
