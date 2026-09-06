// src/features/agri/hooks/useAgriSearch.ts
import { useState, useMemo } from "react";
import type { AgriProduct } from "../types/product.types";

export function useAgriSearch(products: AgriProduct[] | undefined) {
  const [searchQuery, setSearchQuery] = useState("");

  const searchedProducts = useMemo(() => {
    if (!products) return [];
    if (!searchQuery.trim()) return products;

    const q = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.variety?.toLowerCase().includes(q) ||
        p.subcategory?.toLowerCase().includes(q),
    );
  }, [products, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    searchedProducts,
  };
}
