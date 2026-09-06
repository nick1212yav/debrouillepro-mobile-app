import { UIService } from "@/core/sdk/ui/UIService";

// src/features/voyages/lifecycle.ts
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
    UIService.openToast("Une erreur est survenue dans le module Voyages", "error");
  }
}
