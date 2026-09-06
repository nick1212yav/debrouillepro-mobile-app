// src/features/sante/hooks/useEmergency.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { EmergencyCenter } from "../types/emergency.types";

export function useEmergency(lat?: number, lng?: number, radius = 10) {
  const centers = useQuery(
    api.health.getNearbyEmergencyCenters,
    lat !== undefined && lng !== undefined ? { lat, lng, radius } : "skip",
  );
  return {
    centers: centers as EmergencyCenter[] | null | undefined,
    isLoading: centers === undefined,
  };
}
