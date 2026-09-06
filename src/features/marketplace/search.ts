// src/features/marketplace/search.ts
import type { SearchConfig } from "@/core/sdk/types/search.types";

export const searchConfig: SearchConfig = {
  filters: [
    {
      key: "category",
      label: "Catégorie",
      type: "select",
      options: [
        { value: "Alimentation", label: "Alimentation" },
        { value: "Artisanat", label: "Artisanat" },
        { value: "Tech", label: "Technologie" },
        { value: "Mode", label: "Mode" },
        { value: "Services", label: "Services" },
        { value: "Beauté", label: "Beauté & Santé" },
        { value: "Maison", label: "Maison & Jardin" },
        { value: "Véhicules", label: "Véhicules" },
        { value: "Autre", label: "Autre" },
      ],
    },
    {
      key: "minPrice",
      label: "Prix minimum",
      type: "range",
      min: 0,
    },
    {
      key: "maxPrice",
      label: "Prix maximum",
      type: "range",
      min: 0,
    },
    {
      key: "deliveryAvailable",
      label: "Livraison disponible",
      type: "checkbox",
    },
    {
      key: "inStock",
      label: "En stock",
      type: "checkbox",
    },
    {
      key: "rating",
      label: "Note minimum",
      type: "select",
      options: [
        { value: "1", label: "1★ et plus" },
        { value: "2", label: "2★ et plus" },
        { value: "3", label: "3★ et plus" },
        { value: "4", label: "4★ et plus" },
        { value: "5", label: "5★" },
      ],
    },
  ],
  sorts: [
    { key: "recent", label: "Plus récents" },
    { key: "price_asc", label: "Prix croissant" },
    { key: "price_desc", label: "Prix décroissant" },
    { key: "rating", label: "Meilleures notes" },
    { key: "popularity", label: "Popularité" },
  ],
  boosts: [
    { field: "title", weight: 5 },
    { field: "description", weight: 3 },
    { field: "tags", weight: 2 },
  ],
  autocomplete: true,
  suggestions: ["title", "category", "tags"],
};
