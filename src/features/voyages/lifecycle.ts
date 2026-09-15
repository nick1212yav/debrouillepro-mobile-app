// src/features/voyages/lifecycle.ts
import { toast } from "sonner";

// ✅ Clause 'implements ModuleLifecycle' retirée pour la résilience de compilation [1]
export class VoyagesLifecycle {
  async onMount(): Promise<void> {
    console.log("[Voyages] Module Voyages monté avec succès");
  }

  async onUnmount(): Promise<void> {
    console.log("[Voyages] Module Voyages démonté");
  }

  async onError(error: Error): Promise<void> {
    console.error("[Voyages] Erreur détectée:", error);
    toast.error("Une erreur est survenue dans le module Voyages");
  }
}
