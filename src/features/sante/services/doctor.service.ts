// src/features/sante/services/doctor.service.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Doctor, DoctorFilters } from "../types/doctor.types";

export function useDoctor(id: Id<"medicalProfessionals"> | null) {
  const doctor = useQuery(api.health.getProfessional, id ? { id } : "skip");
  return {
    doctor: doctor as Doctor | null | undefined,
    isLoading: doctor === undefined,
  };
}
