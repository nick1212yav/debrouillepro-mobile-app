// src/features/agri/hooks/useAgriAvailability.ts
import { useCallback } from "react";
import type { AgriProduct } from "../types/product.types";

export function useAgriAvailability(product?: AgriProduct) {
  const validateOrderQuantity = useCallback(
    (quantity: number) => {
      if (!product) return { isValid: false, message: "Produit non chargé" };

      if (product.availability.status === "sold_out") {
        return {
          isValid: false,
          message: "Ce produit est actuellement en rupture de stock",
        };
      }

      if (quantity > product.quantity.available) {
        return {
          isValid: false,
          message: `La quantité demandée dépasse le stock disponible (${product.quantity.available} ${product.quantity.unit}s)`,
        };
      }

      if (
        product.quantity.minimumOrder &&
        quantity < product.quantity.minimumOrder
      ) {
        return {
          isValid: false,
          message: `Le producteur exige une commande minimale de ${product.quantity.minimumOrder} ${product.quantity.unit}s`,
        };
      }

      return { isValid: true, message: "Quantité valide" };
    },
    [product],
  );

  return {
    validateOrderQuantity,
  };
}
