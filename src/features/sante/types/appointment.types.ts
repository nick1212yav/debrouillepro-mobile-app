// src/features/sante/types/appointment.types.ts
import type { Id } from "@/convex/_generated/dataModel";

export type AppointmentType =
  | "consultation"
  | "teleconsultation"
  | "emergency"
  | "follow-up";
export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no-show"
  | "rescheduled";

export interface Appointment {
  _id: Id<"medicalAppointments">;
  doctorId: Id<"medicalProfessionals">;
  doctorName: string;
  doctorSpecialty: string;
  patientId: Id<"users">;
  patientName: string;
  date: Date;
  slot: string;
  durationMinutes: number;
  type: AppointmentType;
  status: AppointmentStatus;
  address?: string;
  notes?: string;
  reminder: boolean;
  paymentId?: string;
  paymentStatus: "paid" | "pending" | "failed" | "refunded";
  amount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppointmentFilters {
  patientId?: Id<"users">;
  doctorId?: Id<"medicalProfessionals">;
  status?: AppointmentStatus;
  type?: AppointmentType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AppointmentStats {
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
  rescheduled: number;
  averageDuration: number;
  averageLeadTime: number; // heures
  conversionRate: number;
  teleconsultationRate: number;
  mostBookedSpecialty: string;
}
