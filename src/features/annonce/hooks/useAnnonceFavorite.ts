import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

export function useAnnonceFavorite(
  annonceId: string,
  initialFavorited = false,
) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  // ✅ Utiliser toggleFavorite de publications (existe maintenant)
  const toggle = useMutation(api.publications.toggleFavorite);

  const handleToggle = async () => {
    setLoading(true);
    try {
      // ✅ Corrigé : publicationId au lieu de propertyId
      const { favorited } = await toggle({
        publicationId: annonceId as Id<"publications">,
      });
      setIsFavorited(favorited);
      toast.success(favorited ? "Ajouté aux favoris ❤️" : "Retiré des favoris");
      return favorited;
    } catch (error) {
      toast.error("Erreur lors de l'opération");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { isFavorited, loading, toggle: handleToggle };
}
