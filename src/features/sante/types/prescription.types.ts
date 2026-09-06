// src/features/sante/types/prescription.types.ts
import type { Id } from "@/convex/_generated/dataModel";

export type PrescriptionStatus =
  | "active"
  | "expired"
  | "cancelled"
  | "dispensed";

export interface Prescription {
  _id: Id<"prescriptions">;
  patientId: Id<"users">;
  patientName: string;
  doctorId: Id<"medicalProfessionals">;
  doctorName: string;
  date: Date;
  validUntil: Date;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity?: number;
    instructions?: string;
  }[];
  notes?: string;
  status: PrescriptionStatus;
  pharmacyId?: Id<"pharmacies">;
  dispensedAt?: Date;
  refills: number;
  refillsRemaining: number;
  createdAt: Date;
  updatedAt: Date;
}
