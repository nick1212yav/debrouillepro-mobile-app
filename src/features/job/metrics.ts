import type { ModuleMetric } from "../../core/sdk/types";

export const metrics: ModuleMetric[] = [
  {
    key: "salary",
    label: "Salaire",
    icon: "💰",
    format: (v: any) => `${v}`,
    unit: "USD",
  },
  {
    key: "contract",
    label: "Contrat",
    icon: "📄",
  },
  {
    key: "city",
    label: "Ville",
    icon: "📍",
  },
  {
    key: "deadline",
    label: "Date limite",
    icon: "⏰",
    format: (v: any) => new Date(v).toLocaleDateString(),
  },
];
