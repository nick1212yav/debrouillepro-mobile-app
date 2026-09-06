// src/features/agri/constants/agri.status.ts
export const AGRI_STATUS = [
  {
    value: "available" as const,
    label: "En Stock",
    color: "text-green-400 bg-green-500/10 border-green-500/20",
  },
  {
    value: "limited" as const,
    label: "Stock Limité",
    color: "text-amber-400 bg-orange-500/10 border-orange-500/20",
  },
  {
    value: "sold_out" as const,
    label: "Épuisé",
    color: "text-red-400 bg-red-500/10 border-red-500/20",
  },
  {
    value: "pre_order" as const,
    label: "Pré-commande",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
];
