// src/features/transport/hooks/useDriver.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useDriver(driverId?: string | null) {
  const driver = useQuery(
    api.health.getProfessional, // Relie la table des pros / conducteurs unifiée [1]
    driverId ? { id: driverId as Id<"medicalProfessionals"> } : "skip",
  );

  return {
    driver,
    isLoading: driver === undefined,
  };
}
