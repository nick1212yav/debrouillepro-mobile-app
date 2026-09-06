// src/features/agri/subtypes.ts
import type { AgriCategory } from "./types/product.types";

export const AGRI_SUBTYPES: Record<AgriCategory, string[]> = {
  cereales: ["Maïs", "Riz", "Blé", "Sorgho", "Haricot"],
  legumes: ["Tomate", "Oignon", "Chou", "Carotte", "Piment"],
  fruits: ["Banane", "Mangue", "Orange", "Ananas", "Avocat"],
  intrants: [
    "Semences",
    "Engrais NPK",
    "Produits phytosanitaires",
    "Aliments animaux",
  ],
  materiel: ["Tracteur", "Motopompe", "Pulvérisateur", "Outils manuels"],
  conseil: ["Agronome", "Formation sol", "Élevage", "Accompagnement"],
};
