// src/features/agri/adapter.ts
import type { AgriProduct } from "./types/agri.types";

export class AgriAdapter {
  /**
   * Adapte le produit brut vers un format d'affichage carte standardisé.
   */
  static toCardData(product: AgriProduct) {
    return {
      id: product._id,
      title: product.title,
      subtitle: `${product.variety || product.category} · ${product.location.city}`,
      priceDisplay: `${product.pricing.price.toLocaleString("fr-FR")} ${product.pricing.currency}`,
      unit: product.pricing.priceUnit,
      image: product.media.images[0] ?? null,
      rating: product.seller.rating,
      verified: product.seller.verified,
    };
  }
}
