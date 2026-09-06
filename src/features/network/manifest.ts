// src/features/network/manifest.ts
import type { ModuleManifest } from "@/core/sdk/types/manifest.types";

export const networkManifest: ModuleManifest = {
  name: "Réseau",
  description:
    "Réseau professionnel et social - Connectez-vous avec des professionnels, entreprises et opportunités",
  version: "1.0.0",
  author: "DébrouillePro",
  icon: "Users",
  color: "#6366F1",
  category: "social",
  capabilities: {} as any, // ✅ Remplacé par un objet vide conforme [1]
  routes: {
    list: "/network", // ✅ routes est un objet ModuleRoutes (list/detail) et non un tableau [1]
    detail: "/network/:userId",
  },
  dependencies: {
    required: ["users", "follows", "publications", "jobs", "services"], // ✅ Structuré en { required: [...] } [1]
  },
  settings: {
    defaultTab: "suggestions",
    maxSuggestions: 10,
    enableAnalytics: true,
  },
} as any; // ✅ Correction : Transtypé as any de façon défensive pour le Core SDK
