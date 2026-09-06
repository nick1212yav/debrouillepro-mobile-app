// src/features/sante/hooks/useDoctorAvailability.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useDoctorAvailability(
  doctorId: Id<"medicalProfessionals"> | null,
) {
  const availability = useQuery(
    api.health.getAvailability,
    doctorId ? { professionalId: doctorId } : "skip",
  );
  return { availability, isLoading: availability === undefined };
}
