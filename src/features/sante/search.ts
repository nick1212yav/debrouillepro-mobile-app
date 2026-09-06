// src/features/sante/search.ts
import type { SearchConfig } from "@/core/sdk/types/search.types";

// Type étendu pour inclure les propriétés spécifiques au module Santé
export interface SanteSearchConfig extends SearchConfig {
  entities: {
    type: string;
    label: string;
    icon: string;
    fields: string[];
    filters: {
      id: string;
      label: string;
      type: "select" | "string" | "boolean" | "number" | "multiselect";
      options?: string | { label: string; value: string }[];
      min?: number;
      max?: number;
    }[];
    sort: { id: string; label: string; order: "asc" | "desc" }[];
    defaultSort: string;
    resultComponent: string;
  }[];
  globalSearch: boolean;
  placeholder: string;
}

export const SANTE_SEARCH_CONFIG: SanteSearchConfig = {
  // Propriétés communes à SearchConfig (filters, sorts, boosts, facets, suggestions, etc.)
  filters: [
    // Filtres globaux (communs à toutes les recherches)
    { key: "city", label: "Ville", type: "text" },
    { key: "minRating", label: "Note minimum", type: "range", min: 0, max: 5 },
  ],
  sorts: [
    { key: "rating", label: "Meilleure note" },
    { key: "distance", label: "Distance" },
    { key: "name", label: "Nom" },
  ],
  boosts: [
    { field: "name", weight: 3 },
    { field: "specialty", weight: 2 },
    { field: "description", weight: 1 },
  ],
  facets: [
    { key: "specialty", label: "Spécialité", aggregation: "count" },
    { key: "city", label: "Ville", aggregation: "count" },
  ],
  suggestions: ["médecin", "hôpital", "pharmacie", "urgence"],
  autocomplete: true,
  ranking: ["rating", "distance"],

  // Propriétés étendues pour le module Santé
  entities: [
    {
      type: "doctor",
      label: "Médecins",
      icon: "👨‍⚕️",
      fields: ["name", "specialty", "city", "bio"],
      filters: [
        {
          id: "specialty",
          label: "Spécialité",
          type: "select",
          options: "specialties", // référence à une liste globale
        },
        { id: "city", label: "Ville", type: "string" },
        { id: "online", label: "En ligne", type: "boolean" },
        {
          id: "minRating",
          label: "Note minimum",
          type: "number",
          min: 0,
          max: 5,
        },
        { id: "maxDistance", label: "Distance max (km)", type: "number" },
      ],
      sort: [
        { id: "rating", label: "Note", order: "desc" },
        { id: "distance", label: "Distance", order: "asc" },
        { id: "fees", label: "Tarif", order: "asc" },
      ],
      defaultSort: "rating",
      resultComponent: "DoctorCard",
    },
    {
      type: "hospital",
      label: "Hôpitaux",
      icon: "🏥",
      fields: ["name", "city", "services", "description"],
      filters: [
        { id: "city", label: "Ville", type: "string" },
        { id: "emergency", label: "Urgences", type: "boolean" },
        {
          id: "service",
          label: "Service",
          type: "select",
          options: "hospitalServices",
        },
        {
          id: "minRating",
          label: "Note minimum",
          type: "number",
          min: 0,
          max: 5,
        },
      ],
      sort: [
        { id: "rating", label: "Note", order: "desc" },
        { id: "distance", label: "Distance", order: "asc" },
      ],
      defaultSort: "rating",
      resultComponent: "HospitalCard",
    },
    {
      type: "pharmacy",
      label: "Pharmacies",
      icon: "💊",
      fields: ["name", "city", "services"],
      filters: [
        { id: "city", label: "Ville", type: "string" },
        { id: "openNow", label: "Ouvert maintenant", type: "boolean" },
        {
          id: "services",
          label: "Services",
          type: "multiselect",
          options: "pharmacyServices",
        },
        {
          id: "minRating",
          label: "Note minimum",
          type: "number",
          min: 0,
          max: 5,
        },
      ],
      sort: [
        { id: "rating", label: "Note", order: "desc" },
        { id: "distance", label: "Distance", order: "asc" },
      ],
      defaultSort: "rating",
      resultComponent: "PharmacyCard",
    },
    {
      type: "laboratory",
      label: "Laboratoires",
      icon: "🧪",
      fields: ["name", "city", "testsList"],
      filters: [
        { id: "city", label: "Ville", type: "string" },
        { id: "openNow", label: "Ouvert maintenant", type: "boolean" },
        {
          id: "minRating",
          label: "Note minimum",
          type: "number",
          min: 0,
          max: 5,
        },
      ],
      sort: [
        { id: "rating", label: "Note", order: "desc" },
        { id: "distance", label: "Distance", order: "asc" },
      ],
      defaultSort: "rating",
      resultComponent: "LaboratoryCard",
    },
  ],
  globalSearch: true,
  placeholder: "Rechercher un médecin, un hôpital, une pharmacie...",
};
