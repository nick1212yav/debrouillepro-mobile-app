// src/features/events/lifecycle.ts
import type { ModuleLifecycle } from "@/core/sdk/types/manifest.types";

// En attendant d'avoir les bons noms de méthodes du SDK,
// on utilise un objet vide casté en ModuleLifecycle
// Les méthodes seront appelées par le SDK si elles existent.
export const lifecycle = {
  mount: async () => {
    console.log("[Events] Module monté");
  },
  unmount: async () => {
    console.log("[Events] Module démonté");
  },
} as ModuleLifecycle;
