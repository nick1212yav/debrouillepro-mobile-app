import { useState, useCallback } from "react";

export type FavoriteItem = {
  id: string;
  module: string;
  title: string;
  subtitle?: string;
  image?: string;
  badge?: string;
  badgeColor?: string;
  savedAt: number;
};

const STORAGE_KEY = "debrouille_favorites";

function load(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FavoriteItem[]) : [];
  } catch {
    return [];
  }
}

function save(items: FavoriteItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(load);

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites]
  );

  const toggle = useCallback((item: FavoriteItem) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === item.id);
      const next = exists
        ? prev.filter((f) => f.id !== item.id)
        : [{ ...item, savedAt: Date.now() }, ...prev];
      save(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => f.id !== id);
      save(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setFavorites([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { favorites, isFavorite, toggle, remove, clearAll };
}
