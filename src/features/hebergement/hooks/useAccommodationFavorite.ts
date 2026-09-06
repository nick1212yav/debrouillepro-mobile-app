import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";

export function useAccommodationFavorite() {
  const [localFavorites, setLocalFavorites] = useState<string[]>([]);

  const favIds = useQuery(api.localServices.listMyFavorites, {
    itemType: "hebergement",
  });
  const toggleFavMut = useMutation(api.localServices.toggleFavorite);

  const isFavorite = (id: string): boolean => {
    if (favIds !== undefined) {
      return favIds.includes(Number(id));
    }
    return localFavorites.includes(id);
  };

  const toggleFavorite = async (
    id: string,
    name?: string,
  ): Promise<boolean> => {
    try {
      const numericId = Number(id);
      await toggleFavMut({
        itemId: numericId,
        itemType: "hebergement",
        itemName: name || "Hébergement",
      });
      return !isFavorite(id);
    } catch (err) {
      let added = false;
      setLocalFavorites((prev) => {
        if (prev.includes(id)) {
          added = false;
          return prev.filter((x) => x !== id);
        } else {
          added = true;
          return [...prev, id];
        }
      });
      return added;
    }
  };

  return { isFavorite, toggleFavorite };
}
