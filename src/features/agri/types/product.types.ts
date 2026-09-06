// src/features/agri/types/product.types.ts
export type AgriCategory =
  | "cereales"
  | "legumes"
  | "fruits"
  | "intrants"
  | "materiel"
  | "conseil";

export type AgriUnit =
  | "kg"
  | "tonne"
  | "sac"
  | "botte"
  | "piece"
  | "litre"
  | "hectare";

export type AgriQuality = "premium" | "bonne" | "standard" | "recolte" | "bio";

export type AgriCondition = "frais" | "seche" | "conserve" | "surgeler";

export interface AgriProductQuantity {
  available: number;
  unit: AgriUnit;
  minimumOrder?: number;
}

export interface AgriProductAvailability {
  status: "available" | "limited" | "sold_out" | "pre_order";
  harvestDate?: string;
  season?: string;
}

// ✅ Ré-export propre pour résoudre instantanément les 24 erreurs d'imports décentralisés
export type { AgriProduct } from "./agri.types";
