import type { ModuleMetric } from "@/core/sdk/types";

export const metrics: ModuleMetric[] = [
  {
    key: "price",
    label: "Prix",
    icon: "💰",
    format: (v) => `${v}`,
    unit: "",
  },
  {
    key: "surface",
    label: "Surface",
    icon: "📐",
    unit: "m²",
  },
  {
    key: "rooms",
    label: "Pièces",
    icon: "🛏️",
  },
  {
    key: "city",
    label: "Ville",
    icon: "📍",
  },
];
