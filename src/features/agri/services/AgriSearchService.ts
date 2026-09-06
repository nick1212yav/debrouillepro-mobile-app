// src/features/agri/services/AgriSearchService.ts
import type { AgriProduct } from "../types/product.types";

export class AgriSearchService {
  /**
   * Filtre localement une liste de produits agricoles par catégorie, ville et jetons textuels.
   */
  static filterProducts(
    products: AgriProduct[],
    query: string,
    category?: string | null,
    location?: string | null,
  ): AgriProduct[] {
    return products.filter((product) => {
      // Filtrage par catégorie
      if (category && product.category !== category) return false;

      // Filtrage géographique (ville)
      if (
        location &&
        product.location.city.toLowerCase() !== location.toLowerCase()
      )
        return false;

      // Recherche textuelle par mots-clés découpés (tokenized search)
      if (query.trim()) {
        const tokens = query.toLowerCase().split(/\s+/);
        const searchableContent =
          `${product.title} ${product.description} ${product.variety || ""} ${product.subcategory || ""}`.toLowerCase();
        return tokens.every((token) => searchableContent.includes(token));
      }

      return true;
    });
  }

  /**
   * Trie une liste d'annonces agricoles.
   */
  static sortProducts(
    products: AgriProduct[],
    sortOption: string,
  ): AgriProduct[] {
    const sorted = [...products];
    switch (sortOption) {
      case "price_asc":
        return sorted.sort((a, b) => a.pricing.price - b.pricing.price);
      case "price_desc":
        return sorted.sort((a, b) => b.pricing.price - a.pricing.price);
      case "rating":
        return sorted.sort((a, b) => b.seller.rating - a.seller.rating);
      case "stock_desc":
        return sorted.sort(
          (a, b) => b.quantity.available - a.quantity.available,
        );
      case "recent":
      default:
        return sorted.sort((a, b) => b._creationTime - a._creationTime);
    }
  }
}
