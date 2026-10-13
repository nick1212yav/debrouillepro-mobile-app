import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { adaptServiceProvider } from "../adapter";
import type { ServiceCategory } from "../types";

export interface ServiceSearchParams {
  category?: ServiceCategory;
  search?: string;
  verified?: boolean;
  limit?: number;

  /**
   * Pour les écrans de développement/preview autorisés uniquement.
   * Le backend doit vérifier l'autorisation avant d'accepter ce paramètre.
   */
  allowDemo?: boolean;
}

export function useServiceSearch(params: ServiceSearchParams = {}) {
  const docs = useQuery(api.services.search.searchServices, {
    ...(params.search === undefined ? {} : { search: params.search }),
    ...(params.category === undefined ? {} : { category: params.category }),
    ...(params.verified === undefined ? {} : { verified: params.verified }),
    ...(params.limit === undefined ? {} : { limit: params.limit }),
    ...(params.allowDemo === undefined ? {} : { allowDemo: params.allowDemo }),
  });

  if (docs === undefined) {
    return {
      providers: [],
      loading: true,
    };
  }

  return {
    providers: docs.map(adaptServiceProvider),
    loading: false,
  };
}
