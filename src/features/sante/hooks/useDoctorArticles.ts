// src/features/sante/hooks/useDoctorArticles.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useDoctorArticles(doctorId: Id<"medicalProfessionals"> | null) {
  const articles = useQuery(
    api.health.getArticles,
    doctorId ? { professionalId: doctorId } : "skip",
  );
  return { articles, isLoading: articles === undefined };
}
