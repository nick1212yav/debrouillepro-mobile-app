import { useState, useEffect, useCallback } from "react";

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("restauration_favorites");
    if (raw) {
      try {
        setFavorites(JSON.parse(raw));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  const toggleFavorite = useCallback(
    async (restaurantId: number): Promise<boolean> => {
      let next: number[];
      let isAdded = false;

      setFavorites((prev) => {
        if (prev.includes(restaurantId)) {
          next = prev.filter((id) => id !== restaurantId);
        } else {
          next = [...prev, restaurantId];
          isAdded = true;
        }
        localStorage.setItem("restauration_favorites", JSON.stringify(next));
        return next;
      });

      return isAdded;
    },
    [],
  );

  const isFavorite = useCallback(
    (restaurantId: number): boolean => {
      return favorites.includes(restaurantId);
    },
    [favorites],
  );

  return { favorites, toggleFavorite, isFavorite };
}
