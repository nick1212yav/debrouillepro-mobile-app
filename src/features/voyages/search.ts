// src/features/voyages/search.ts
import type { SearchEngine } from "@/core/sdk/engines/SearchEngine";
import type { VoyageTrip } from "./types";
import { api } from "@/convex/_generated/api";

export const voyagesSearch: SearchEngine = {
  id: "voyages",

  search: async (params: {
    query?: string;
    from?: string;
    to?: string;
    date?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }) => {
    // Cette fonction est appelée par le SDK, mais les appels réels sont faits via Convex
    // dans les services. Ici on définit juste la configuration.
    return {
      results: [],
      total: 0,
      hasMore: false,
    };
  },

  index: async (item: any) => {
    return true;
  },

  remove: async (id: string) => {
    return true;
  },

  refresh: async () => {
    return true;
  },
};

export const voyagesSearchFields = {
  trip: ["from", "to", "operator", "type", "amenities"],
  destination: ["name", "country", "continent", "description", "highlights"],
};

export const voyagesSearchFilters = {
  available: {
    id: "available",
    label: "Disponible",
    type: "boolean",
  },
  priceRange: {
    id: "priceRange",
    label: "Prix",
    type: "range",
    min: 0,
    max: 1000000,
  },
  type: {
    id: "type",
    label: "Type de transport",
    type: "multiselect",
    options: ["Bus", "Minibus", "Avion", "Train", "Bateau"],
  },
  amenities: {
    id: "amenities",
    label: "Équipements",
    type: "multiselect",
    options: ["Wi-Fi", "Climatisation", "USB", "Repas", "Bagage inclus"],
  },
};
