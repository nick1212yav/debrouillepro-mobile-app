export interface SearchFilter {
  key: string;
  label: string;
  type: "select" | "range" | "checkbox" | "text";
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
}

export interface SearchFacet {
  key: string;
  label: string;
  aggregation: "count" | "sum" | "avg";
}

export interface SearchBoost {
  field: string;
  weight: number;
}

export interface SearchConfig {
  filters: SearchFilter[];
  sorts: { key: string; label: string }[];
  boosts?: SearchBoost[];
  facets?: SearchFacet[];
  suggestions?: string[];
  autocomplete?: boolean;
  ranking?: string[];
}
