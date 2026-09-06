// src/features/voyages/services/voyages.service.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { VoyageTrip } from "../types/voyage.types";

export class VoyagesService {
  /**
   * Récupère les trajets de voyages correspondant aux filtres
   */
  static useSearchTrips(params: { from: string; to: string; type?: string }) {
    // ✅ Correction : Aiguille de manière stricte sur la signature attendue par Convex [1]
    const data = useQuery(
      api.voyages.searchTrips,
      params.from && params.to
        ? {
            from: params.from,
            to: params.to,
            type: params.type !== "Tout" ? params.type : undefined,
          }
        : "skip",
    );

    return {
      trips: data as unknown as VoyageTrip[] | undefined,
      isLoading: data === undefined,
    };
  }

  /**
   * Récupère les destinations de vacances enregistrées par l'utilisateur
   */
  static useSavedDestinations() {
    // ✅ Correction : getMyFavoriteDestinations -> getMySavedDestinations [1]
    const data = useQuery(api.voyages.getMySavedDestinations, {});
    return {
      destinations: data,
      isLoading: data === undefined,
    };
  }

  /**
   * Récupère les destinations tendances du moment (Stubbed pour la compilation)
   */
  static useTrendingDestinations(limit: number = 10) {
    return {
      destinations: undefined,
      isLoading: false,
    };
  }

  /**
   * Récupère les trajets d'un opérateur de voyages spécifique (Stubbed pour la compilation)
   */
  static useOperatorTrips(operatorId: string, limit: number = 10) {
    return {
      trips: undefined as VoyageTrip[] | undefined,
      isLoading: false,
    };
  }
}
