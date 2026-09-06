// src/features/sante/hooks/useDoctors.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { DoctorFilters, Doctor } from "../types/doctor.types";

export function useDoctors(filters?: DoctorFilters) {
  const doctors = useQuery(api.health.listProfessionals, filters || {});
  return {
    doctors: doctors as Doctor[] | null | undefined,
    isLoading: doctors === undefined,
  };
}
