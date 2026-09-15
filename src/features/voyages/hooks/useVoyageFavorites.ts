// src/features/voyages/hooks/useVoyageFavorites.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

/**
 * Gère les favoris pour les voyages (destinations).
 */
export function useVoyageFavorites() {
  // ✅ Correction : getMyFavoriteDestinations -> getMySavedDestinations [1]
  const favorites = useQuery(api.voyages.getMySavedDestinations, {});

  // ✅ Correction : toggleFavoriteDestination -> toggleSaveDestination [1]
  const toggleFavorite = useMutation(api.voyages.toggleSaveDestination);

  const isFavorite = (destinationId: Id<"destinations">): boolean => {
    if (!favorites) return false;
    // ✅ Correction : l'API renvoie des documents destinations entiers, on compare sur fav._id [1]
    return favorites.some((fav: any) => fav && fav._id === destinationId);
  };

  const toggle = async (destinationId: Id<"destinations">) => {
    try {
      const added = await toggleFavorite({ destinationId });
      toast.success(added ? "Ajouté aux favoris" : "Retiré des favoris");
      return added;
    } catch {
      toast.error("Erreur lors de la modification des favoris");
      return false;
    }
  };

  return {
    favorites,
    isFavorite,
    toggle,
    isLoading: favorites === undefined,
  };
}
