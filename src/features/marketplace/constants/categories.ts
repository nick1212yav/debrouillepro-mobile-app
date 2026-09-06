// src/features/marketplace/constants/categories.ts

export const PRODUCT_CATEGORIES = [
  {
    id: "Alimentation",
    label: "Alimentation",
    icon: "🥗",
    description: "Produits alimentaires",
  },
  {
    id: "Artisanat",
    label: "Artisanat",
    icon: "🧶",
    description: "Fait main, artisanal",
  },
  {
    id: "Tech",
    label: "Technologie",
    icon: "📱",
    description: "Électronique, gadgets",
  },
  {
    id: "Mode",
    label: "Mode",
    icon: "👗",
    description: "Vêtements, accessoires",
  },
  {
    id: "Services",
    label: "Services",
    icon: "⚡",
    description: "Prestations de services",
  },
  {
    id: "Beauté",
    label: "Beauté & Santé",
    icon: "💄",
    description: "Cosmétiques, bien-être",
  },
  {
    id: "Maison",
    label: "Maison & Jardin",
    icon: "🏠",
    description: "Décoration, jardinage",
  },
  {
    id: "Véhicules",
    label: "Véhicules",
    icon: "🚗",
    description: "Voitures, motos",
  },
  { id: "Autre", label: "Autre", icon: "📦", description: "Autres catégories" },
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]["id"];

export const CATEGORY_DEFAULT = "Autre";
