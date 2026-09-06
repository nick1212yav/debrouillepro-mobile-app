import type { ModuleSearchConfig } from "../../core/sdk/types";

export const searchConfig: ModuleSearchConfig = {
  filters: [
    { key: "city", label: "Ville", type: "select" },
    {
      key: "salaryMin",
      label: "Salaire min",
      type: "range",
      min: 0,
      max: 10000,
    },
    {
      key: "salaryMax",
      label: "Salaire max",
      type: "range",
      min: 0,
      max: 10000,
    },
    {
      key: "contract",
      label: "Type de contrat",
      type: "select",
      options: [
        { label: "CDI", value: "CDI" },
        { label: "CDD", value: "CDD" },
        { label: "Freelance", value: "Freelance" },
        { label: "Stage", value: "Stage" },
        { label: "Alternance", value: "Alternance" },
      ],
    },
    { key: "remote", label: "Télétravail", type: "checkbox" },
  ],
  sorts: [
    { key: "date", label: "Date" },
    { key: "salary", label: "Salaire" },
  ],
  boosts: [
    { field: "title", weight: 2.0 },
    { field: "skills", weight: 1.5 },
    { field: "company", weight: 1.2 },
  ],
  facets: [
    { key: "contract", label: "Contrat", aggregation: "count" },
    { key: "city", label: "Ville", aggregation: "count" },
  ],
  suggestions: ["title", "company", "city"],
  autocomplete: true,
  ranking: ["relevance", "date"],
  aiRanking: true,
  semanticSearch: true,
  embeddingFields: ["title", "description", "skills"],
  vectorFields: ["title", "description"],
};
