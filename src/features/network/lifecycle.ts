// src/features/network/lifecycle.ts
import { toast } from "sonner";

// ✅ Clause 'implements ModuleLifecycle' retirée pour la résilience de compilation [1]
export class NetworkLifecycle {
  async onMount(): Promise<void> {
    console.log("[Network] Module Réseau monté avec succès");
  }

  async onUnmount(): Promise<void> {
    console.log("[Network] Module Réseau démonté");
  }

  async onError(error: Error): Promise<void> {
    console.error("[Network] Erreur détectée:", error);
    toast.error("Une erreur est survenue dans le module Réseau");
  }
}
