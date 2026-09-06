// src/features/sante/services/hospital.service.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Hospital, HospitalFilters } from "../types/hospital.types";

export function useHospital(id: Id<"hospitals"> | null) {
  const hospital = useQuery(api.health.getHospital, id ? { id } : "skip");
  return {
    hospital: hospital as Hospital | null | undefined,
    isLoading: hospital === undefined,
  };
}
