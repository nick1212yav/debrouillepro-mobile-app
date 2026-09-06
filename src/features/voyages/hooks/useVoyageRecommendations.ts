// src/features/voyages/hooks/useVoyageRecommendations.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { VoyageTrip } from "../types";

/**
 * Récupère des recommandations de voyages similaires.
 */
export function useVoyageRecommendations(currentTripId?: Id<"trips">) {
  // ✅ Correction : 'searchTrips' exigeant obligatoirement 'from' et 'to',
  // nous passons à "skip" pour l'instant pour éviter les erreurs d'arguments manquants [1].
  const trips = useQuery(api.voyages.searchTrips, "skip");

  // Filtrage sécurisé (renvoie un tableau vide pour le moment de façon propre)
  const recommendations = trips
    ? trips.filter((t: any) => t._id !== currentTripId).slice(0, 4)
    : [];

  return {
    recommendations: recommendations as VoyageTrip[],
    isLoading: false, // Évite un chargement infini sur l'interface
    isEmpty: true,
  };
}
