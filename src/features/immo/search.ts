import type { ModuleSearchConfig } from "@/core/sdk/types";

export const searchConfig: ModuleSearchConfig = {
  filters: [
    { key: "city", label: "Ville", type: "select" },
    { key: "priceMin", label: "Prix min", type: "range", min: 0, max: 1000000 },
    { key: "priceMax", label: "Prix max", type: "range", min: 0, max: 1000000 },
    {
      key: "surfaceMin",
      label: "Surface min",
      type: "range",
      min: 0,
      max: 1000,
    },
    { key: "rooms", label: "Pièces", type: "select" },
    {
      key: "type",
      label: "Type",
      type: "select",
      options: [
        { label: "Appartement", value: "appartement" },
        { label: "Maison", value: "maison" },
        { label: "Villa", value: "villa" },
        { label: "Studio", value: "studio" },
        { label: "Bureau", value: "bureau" },
        { label: "Terrain", value: "terrain" },
      ],
    },
    {
      key: "transactionType",
      label: "Transaction",
      type: "select",
      options: [
        { label: "Location", value: "location" },
        { label: "Vente", value: "vente" },
      ],
    },
  ],
  sorts: [
    { key: "date", label: "Date" },
    { key: "price", label: "Prix" },
    { key: "surface", label: "Surface" },
  ],
  boosts: [
    { field: "title", weight: 2.0 },
    { field: "description", weight: 1.5 },
  ],
  facets: [
    { key: "type", label: "Type", aggregation: "count" },
    { key: "city", label: "Ville", aggregation: "count" },
  ],
  suggestions: ["title", "city", "neighborhood"],
  autocomplete: true,
  ranking: ["relevance", "date"],
  aiRanking: true,
  semanticSearch: true,
  embeddingFields: ["title", "description", "city"],
  vectorFields: ["title", "description"],
};
