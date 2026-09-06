// src/features/sante/hooks/useMedicalRecords.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { MedicalRecord } from "../types/medical.types";

export function useMedicalRecords(patientId?: Id<"users">) {
  const records = useQuery(
    api.health.getMedicalRecords,
    patientId ? { patientId } : "skip",
  );
  return {
    records: records as MedicalRecord[] | null | undefined,
    isLoading: records === undefined,
  };
}
