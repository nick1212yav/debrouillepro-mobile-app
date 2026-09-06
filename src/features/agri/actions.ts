// src/features/agri/actions.ts
import type { AgriProduct } from "./types/agri.types";

export interface AgriActionContext {
  product: AgriProduct;
  userId?: string;
}

export class AgriActions {
  static openNegotiation({ product }: AgriActionContext) {
    return {
      action: "OPEN_CHAT",
      payload: {
        recipientId: product.seller.userId,
        contextTitle: product.title,
      },
    };
  }

  static toggleFavorite({ product }: AgriActionContext) {
    return {
      action: "TOGGLE_FAVORITE",
      payload: {
        productId: product._id,
      },
    };
  }
}
