// src/features/sante/hooks/useDoctorStories.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useDoctorStories(doctorId: Id<"medicalProfessionals"> | null) {
  const stories = useQuery(
    api.health.getStories,
    doctorId ? { professionalId: doctorId } : "skip",
  );
  return { stories, isLoading: stories === undefined };
}
