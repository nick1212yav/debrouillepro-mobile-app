// src/features/voyages/hooks/useVoyage.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { VoyageTrip } from "../types";

/**
 * Récupère les détails d'un voyage spécifique via son ID.
 */
export function useVoyage(tripId: Id<"trips"> | null | undefined) {
  const trip = useQuery(api.voyages.getTrip, tripId ? { id: tripId } : "skip");

  return {
    trip: trip as VoyageTrip | undefined | null,
    isLoading: trip === undefined,
    isError: trip === null,
  };
}
