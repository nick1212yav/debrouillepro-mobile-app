// src/features/sante/services/prescription.service.ts
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

export function useCreatePrescription() {
  const mutate = useMutation(api.health.addPrescription);
  return async (data: any) => {
    try {
      const result = await mutate(data);
      toast.success("Ordonnance créée");
      return result;
    } catch (e) {
      toast.error("Erreur");
      throw e;
    }
  };
}

export function useUpdatePrescription() {
  const mutate = useMutation(api.health.updatePrescription);
  return async (data: any) => {
    try {
      const result = await mutate(data);
      toast.success("Ordonnance mise à jour");
      return result;
    } catch (e) {
      toast.error("Erreur");
      throw e;
    }
  };
}

// Ajout de la fonction download utilisée dans actions.ts
export async function download(prescriptionId: string) {
  toast.info("Téléchargement de l'ordonnance...");
  // Implémentez ici la logique de téléchargement (PDF, etc.)
  return new Promise((resolve) => setTimeout(resolve, 500));
}
