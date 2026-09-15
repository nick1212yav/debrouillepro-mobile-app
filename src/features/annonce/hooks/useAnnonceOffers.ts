import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
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
      toast.success("Offre envoyée");
    } catch (error) {
      toast.error("Erreur lors de l'envoi");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { makeOffer, loading };
}
