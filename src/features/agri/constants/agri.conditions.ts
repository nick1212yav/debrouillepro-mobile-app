// src/features/agri/constants/agri.conditions.ts
import type { AgriCondition } from "../types/product.types"; // ✅ Corrigé

export const AGRI_CONDITIONS: {
  value: AgriCondition;
  label: string;
  desc: string;
}[] = [
  {
    value: "frais",
    label: "Frais / Récolté",
    desc: "Produits de récolte récente prêts à la consommation immédiate",
  },
  {
    value: "seche",
    label: "Séché / Déshydraté",
    desc: "Produits déshydratés garantissant une conservation de longue durée",
  },
  {
    value: "conserve",
    label: "Conserve / Conditionné",
    desc: "Produits mis sous bocaux, bouteilles ou emballages hermétiques",
  },
  {
    value: "surgeler",
    label: "Surgelé / Congelé",
    desc: "Produits stabilisés par congélation industrielle ou artisanale",
  },
];
