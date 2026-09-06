import { UIService } from "@/core/sdk/ui/UIService";

// src/features/sante/services/prescription.service.ts
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useCreatePrescription() {
  const mutate = useMutation(api.health.addPrescription);
  return async (data: any) => {
    try {
      const result = await mutate(data);
      UIService.openToast("Ordonnance créée", "success");
      return result;
    } catch (e) {
      UIService.openToast("Erreur", "error");
      throw e;
    }
  };
}

export function useUpdatePrescription() {
  const mutate = useMutation(api.health.updatePrescription);
  return async (data: any) => {
    try {
      const result = await mutate(data);
      UIService.openToast("Ordonnance mise à jour", "success");
      return result;
    } catch (e) {
      UIService.openToast("Erreur", "error");
      throw e;
    }
  };
}

// Ajout de la fonction download utilisée dans actions.ts
export async function download(prescriptionId: string) {
  UIService.openToast("Téléchargement de l'ordonnance...", "info");
  // Implémentez ici la logique de téléchargement (PDF, etc.)
  return new Promise((resolve) => setTimeout(resolve, 500));
}
