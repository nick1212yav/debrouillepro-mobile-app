import { UIService } from "@/core/sdk/ui/UIService";

// src/features/agri/hooks/useAgriFavorite.ts
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel";
import { useCallback } from "react";

export function useAgriFavorite(productId?: string) {
  const toggle = useMutation(api.agri.toggleFavorite);
  const favoritesList = useQuery(api.agri.getUserFavorites);

  const isFavorite = useCallback(
    (id: string) => {
      if (!favoritesList) return false;
      return favoritesList.includes(id as unknown as Id<"agriProducts">);
    },
    [favoritesList],
  );

  const handleToggle = useCallback(
    async (id?: string) => {
      const targetId = id || productId;
      if (!targetId) return;

      try {
        await toggle({ productId: targetId as unknown as Id<"agriProducts"> });
      } catch {
        UIService.openToast("Connexion requise pour enregistrer vos favoris", "error");
      }
    },
    [toggle, productId],
  );

  return {
    favorites: favoritesList as unknown as string[] | undefined,
    isFavorite: productId ? isFavorite(productId) : isFavorite,
    toggleFavorite: handleToggle,
    isLoading: favoritesList === undefined,
  };
}
