// src/features/agri/integrations/AgriBridge.ts
import type { AgriProduct } from "../types/agri.types";

export interface SDKFeedItem {
  id: string;
  type: "agri";
  title: string;
  description: string;
  priceLabel: string;
  locationLabel: string;
  images: string[];
  metadata: Record<string, any>;
}

export class AgriBridge {
  /**
   * Traduit le modèle AgriProduct interne en un objet d'actualité compatible avec le flux unifié (Feed) du SDK.
   */
  static toFeedItem(product: AgriProduct): SDKFeedItem {
    return {
      id: product._id,
      type: "agri",
      title: product.title,
      description: product.description,
      priceLabel: `${product.pricing.price.toLocaleString("fr-FR")} ${product.pricing.currency} / ${product.pricing.priceUnit}`,
      locationLabel: `${product.location.city}, ${product.location.province || ""}`,
      images: product.media.images || [],
      metadata: {
        category: product.category,
        variety: product.variety,
        quality: product.quality,
        sellerName: product.seller.name,
        sellerVerified: product.seller.verified,
        status: product.availability.status,
      },
    };
  }
}
