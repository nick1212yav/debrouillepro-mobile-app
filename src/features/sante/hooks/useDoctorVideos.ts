// src/features/sante/hooks/useDoctorVideos.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useDoctorVideos(doctorId: Id<"medicalProfessionals"> | null) {
  const videos = useQuery(
    api.health.getVideos,
    doctorId ? { professionalId: doctorId } : "skip",
  );
  return { videos, isLoading: videos === undefined };
}
