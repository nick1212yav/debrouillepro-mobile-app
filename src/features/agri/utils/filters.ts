// src/features/agri/utils/filters.ts
import type { AgriProduct, AgriCategory } from "../types/product.types";

export class AgriFiltersUtils {
  /**
   * Filtre un tableau de récoltes par catégorie.
   */
  static filterByCategory(
    products: AgriProduct[],
    category: AgriCategory | null,
  ): AgriProduct[] {
    if (!category) return products;
    return products.filter((p) => p.category === category);
  }

  /**
   * Filtre un tableau de récoltes par ville de provenance.
   */
  static filterByLocation(
    products: AgriProduct[],
    city: string | null,
  ): AgriProduct[] {
    if (!city) return products;
    return products.filter(
      (p) => p.location.city.toLowerCase() === city.toLowerCase(),
    );
  }

  /**
   * Filtre un tableau de récoltes par tranche de prix unitaire.
   */
  static filterByPriceRange(
    products: AgriProduct[],
    min: number | null,
    max: number | null,
    currency: string,
  ): AgriProduct[] {
    return products.filter((p) => {
      if (p.pricing.currency !== currency) return false;
      if (min !== null && p.pricing.price < min) return false;
      if (max !== null && p.pricing.price > max) return false;
      return true;
    });
  }
}
