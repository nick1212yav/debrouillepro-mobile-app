// src/features/sante/hooks/useHospitals.ts
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

export function useHospitals(filters?: HospitalFilters) {
  const hospitals = useQuery(api.health.listHospitals, filters ?? "skip");
  return {
    hospitals: hospitals as Hospital[] | null | undefined,
    isLoading: hospitals === undefined,
  };
}
