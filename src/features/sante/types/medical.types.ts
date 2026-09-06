// src/features/sante/types/medical.types.ts
import type { Id } from "@/convex/_generated/dataModel";

export interface Education {
  id: string;
  institution: string;
  degree: string;
  year?: string;
  country?: string;
}

export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  year?: string;
  validUntil?: Date;
}

export interface Award {
  id: string;
  title: string;
  year: string;
  organization?: string;
  description?: string;
}

export interface Badge {
  id: string;
  label: string;
  icon: "verified" | "top" | "expert" | "recommended" | "emergency";
  color?: string;
  description?: string;
}

export type MedicalRecordType =
  | "visit"
  | "lab"
  | "imaging"
  | "vaccination"
  | "prescription"
  | "surgery"
  | "hospitalization";

export interface MedicalRecord {
  _id: Id<"medicalRecords">;
  patientId: Id<"users">;
  doctorId?: Id<"medicalProfessionals">;
  type: MedicalRecordType;
  title: string;
  date: Date;
  doctor?: string;
  summary: string;
  details?: Record<string, any>;
  attachments?: string[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Vaccination {
  id: string;
  name: string;
  date: Date;
  nextDose?: Date;
  status: "completed" | "pending" | "overdue";
  administeredBy?: string;
  location?: string;
  batchNumber?: string;
  sideEffects?: string[];
}
