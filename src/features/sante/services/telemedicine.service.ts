import { UIService } from "@/core/sdk/ui/UIService";

// src/features/sante/services/telemedicine.service.ts
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Démarrer une téléconsultation
 */
export function useStartTeleconsultation() {
  const mutate = useMutation(api.health.startTeleconsultation);
  return async (id: string) => {
    try {
      const result = await mutate({ id: id as any });
      UIService.openToast("Téléconsultation démarrée", "success");
      return result;
    } catch (e) {
      UIService.openToast(e instanceof Error ? e.message : "Erreur", "error");
      throw e;
    }
  };
}

/**
 * Terminer une téléconsultation
 * Note : Si l'API Convex accepte 'notes', on peut les passer, mais actuellement le type ne l'accepte pas.
 * On conserve notes en paramètre pour l'usage futur, mais on ne le passe pas dans la mutation.
 */
export function useCompleteTeleconsultation() {
  const mutate = useMutation(api.health.completeTeleconsultation);
  return async (id: string, _notes?: string) => {
    try {
      // On ne passe que l'ID, car le type Convex n'accepte peut-être pas 'notes'
      await mutate({ id: id as any });
      UIService.openToast("Téléconsultation terminée", "success");
    } catch (e) {
      UIService.openToast(e instanceof Error ? e.message : "Erreur", "error");
      throw e;
    }
  };
}

/**
 * Fonction exportée pour actions.ts (utilise le client Convex)
 * À implémenter si nécessaire.
 */
export async function startTeleconsultation(id: string) {
  // À implémenter avec le client Convex
  throw new Error("Utilisez le client Convex directement dans les actions.");
}
