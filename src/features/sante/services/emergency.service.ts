// src/features/sante/services/emergency.service.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { EMERGENCY_NUMBERS } from "../constants/emergency";
import type { EmergencyNumber } from "../types/emergency.types";

export function useEmergencyCenters(lat?: number, lng?: number, radius = 10) {
  const centers = useQuery(
    api.health.getNearbyEmergencyCenters,
    lat !== undefined && lng !== undefined ? { lat, lng, radius } : "skip",
  );
  return { centers, isLoading: centers === undefined };
}

export function useShareEmergencyLocation() {
  const mutate = useMutation(api.health.shareEmergencyLocation);
  return async (lat: number, lng: number) => {
    try {
      await mutate({ lat, lng });
      toast.success("Position partagée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
      throw e;
    }
  };
}

export function getEmergencyNumbers(): EmergencyNumber[] {
  return EMERGENCY_NUMBERS;
}
