// src/features/sante/hooks/usePrescriptions.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Prescription } from "../types/prescription.types";

export function usePrescriptions(patientId?: string, doctorId?: string) {
  const hasFilter = !!(patientId || doctorId);
  const prescriptions = useQuery(
    api.health.getPrescriptions,
    hasFilter
      ? {
          patientId: patientId as Id<"users"> | undefined,
          doctorId: doctorId as Id<"medicalProfessionals"> | undefined,
        }
      : "skip",
  );
  return {
    prescriptions: prescriptions as Prescription[] | null | undefined,
    isLoading: prescriptions === undefined,
  };
}
