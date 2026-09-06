// src/features/agri/constants/agri.categories.ts
import type { AgriCategory } from "../types/product.types"; // ✅ Modifié avec 'import type' pour verbatimModuleSyntax

export const CATEGORY_LABELS: Record<AgriCategory, string> = {
  cereales: "Céréales",
  legumes: "Légumes",
  fruits: "Fruits",
  intrants: "Intrants",
  materiel: "Matériel",
  conseil: "Conseil",
};

export const CATEGORY_ICONS: Record<AgriCategory, string> = {
  cereales: "🌾",
  legumes: "🥬",
  fruits: "🍎",
  intrants: "🧪",
  materiel: "🚜",
  conseil: "🧑‍🌾",
};

export const CATEGORY_COLORS: Record<AgriCategory, string> = {
  cereales: "#F59E0B",
  legumes: "#22C55E",
  fruits: "#EF4444",
  intrants: "#8B5CF6",
  materiel: "#3B82F6",
  conseil: "#10B981",
};
