// src/features/voyages/hooks/useVoyageReviews.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Récupère les avis pour un voyage donné.
 * Pour l'instant, le backend ne stocke pas les avis individuels,
 * donc on retourne un tableau vide. Plus tard, on connectera à une table.
 */
export function useVoyageReviews(tripId: Id<"trips"> | null | undefined) {
  // Pour l'instant, on retourne un tableau vide car les avis individuels
  // ne sont pas encore implémentés dans le schéma Convex.
  // Quand ils le seront, on utilisera :
  // const reviews = useQuery(api.voyages.getTripReviews, { tripId });
  const reviews: any[] = [];

  return {
    reviews,
    isLoading: false,
    isEmpty: true,
  };
}
