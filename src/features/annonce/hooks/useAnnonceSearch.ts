import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { AnnonceType } from "../types";
import { adaptAnnonce } from "../adapter";

interface SearchParams {
  type?: AnnonceType;
  search?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  negotiable?: boolean;
  delivery?: boolean;
  sort?: "recent" | "price_asc" | "price_desc" | "popularity";
  limit?: number;
}

export function useAnnonceSearch(params: SearchParams) {
  const results = useQuery(api.publications.searchAnnonces, {
    search: params.search,
    type: params.type,
    location: params.location,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    condition: params.condition,
    negotiable: params.negotiable,
    delivery: params.delivery,
    sort: params.sort || "recent",
    limit: params.limit || 20,
  });

  return {
    annonces: results?.map(adaptAnnonce) || [],
    loading: results === undefined,
  };
}
