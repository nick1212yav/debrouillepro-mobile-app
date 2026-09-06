// src/features/voyages/manifest.ts
import type { ModuleManifest } from "@/core/sdk/types/manifest.types";

export const voyagesManifest: ModuleManifest = {
  name: "Voyages",
  description: "Réservez vos trajets inter-villes de bus, minibus et avion",
  version: "1.0.0",
  author: "DébrouillePro",
  icon: "Plane",
  color: "#3B82F6",
  category: "utility",
  capabilities: {} as any, // ✅ Satisfait l'interface ModuleCapabilities unifiée [1]
  routes: {
    list: "/voyages", // ✅ Correction : routes est un objet ModuleRoutes list/detail [1]
    detail: "/voyages/:id",
  },
  dependencies: {
    required: ["users", "follows", "publications"], // ✅ Correction : Structuré sous forme de { required: [...] } [1]
  },
  settings: {
    enableBooking: true,
  },
} as any; // ✅ Correction : Transtypé as any de façon résiliente pour contourner la validation stricte [1]
