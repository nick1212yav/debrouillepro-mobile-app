// src/features/sante/types/vaccination.types.ts

import type { AuditFields } from "./common.types";

export type VaccinationStatus = "pending" | "completed" | "overdue";

export interface Vaccination extends AuditFields {
  name: string;
  patientId: string;
  date: string;
  status: VaccinationStatus;
  location?: string;
  nextDose?: string;
  administeredBy?: string;
  batchNumber?: string;
  sideEffects?: string;
}
