// src/features/sante/hooks/useDoctorReviews.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Review } from "../types/review.types";

export function useDoctorReviews(doctorId: Id<"medicalProfessionals"> | null) {
  const reviews = useQuery(
    api.health.getReviews,
    doctorId ? { professionalId: doctorId } : "skip",
  );
  return {
    reviews: reviews as Review[] | null | undefined,
    isLoading: reviews === undefined,
  };
}
