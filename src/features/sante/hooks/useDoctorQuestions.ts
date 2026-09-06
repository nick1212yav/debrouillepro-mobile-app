// src/features/sante/hooks/useDoctorQuestions.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Question } from "../types/review.types";

export function useDoctorQuestions(
  doctorId: Id<"medicalProfessionals"> | null,
) {
  const questions = useQuery(
    api.health.getQuestions,
    doctorId ? { professionalId: doctorId } : "skip",
  );
  return {
    questions: questions as Question[] | null | undefined,
    isLoading: questions === undefined,
  };
}
