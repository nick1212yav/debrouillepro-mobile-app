// src/features/sante/hooks/useDoctor.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doctor } from "../types/doctor.types";

export function useDoctor(id: string | null) {
  // Interrogation asynchrone via la résolution multi-stratégie du backend [2]
  const doctor = useQuery(api.health.getProfessional, id ? { id } : "skip");

  return {
    doctor: doctor as Doctor | null | undefined,
    isLoading: doctor === undefined,
  };
}
