// src/features/agri/constants/agri.units.ts
import type { AgriUnit } from "../types/product.types"; // ✅ Corrigé

export const AGRI_UNITS: {
  value: AgriUnit;
  label: string;
  pluralLabel: string;
}[] = [
  { value: "kg", label: "Kilogramme", pluralLabel: "Kilogrammes" },
  { value: "tonne", label: "Tonne", pluralLabel: "Tonnes" },
  { value: "sac", label: "Sac", pluralLabel: "Sacs" },
  { value: "botte", label: "Botte", pluralLabel: "Bottes" },
  { value: "piece", label: "Pièce", pluralLabel: "Pièces" },
  { value: "litre", label: "Litre", pluralLabel: "Litres" },
  { value: "hectare", label: "Hectare", pluralLabel: "Hectares" },
];
