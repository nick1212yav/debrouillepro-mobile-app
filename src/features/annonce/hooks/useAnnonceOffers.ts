import { UIService } from "@/core/sdk/ui/UIService";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useAnnonceOffers(annonceId: string) {
  const [loading, setLoading] = useState(false);
  const createOffer = useMutation(api.publications.createOffer);

  const makeOffer = async (amount: number, message?: string) => {
    setLoading(true);
    try {
      // ✅ Corrigé : publicationId et message obligatoire (on met une valeur par défaut)
      await createOffer({
        publicationId: annonceId as Id<"publications">,
        amount,
        message: message || "Offre d'achat",
      });
      UIService.openToast("Offre envoyée", "success");
    } catch (error) {
      UIService.openToast("Erreur lors de l'envoi", "error");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { makeOffer, loading };
}
