// src/features/marketplace/ai/ProductAdvisor.ts
import type { Product } from "../types/product.types";

export interface ProductAdvice {
  productId: string;
  suggestions: string[];
  urgency: "low" | "medium" | "high";
}

/**
 * Génère des conseils pour un produit basé sur ses métriques (stock, ventes, prix).
 */
export function generateProductAdvice(
  product: Product,
  salesLastMonth: number,
): ProductAdvice {
  const suggestions: string[] = [];
  let urgency: "low" | "medium" | "high" = "low";

  if (product.stock <= 0) {
    suggestions.push(
      "Rupture de stock imminente – réapprovisionnez dès que possible.",
    );
    urgency = "high";
  } else if (product.stock <= 5) {
    suggestions.push("Stock faible – pensez à commander.");
    urgency = "medium";
  }

  if (salesLastMonth === 0 && product.stock > 0) {
    suggestions.push(
      "Aucune vente ce mois-ci – envisagez une promotion ou améliorez la visibilité.",
    );
    urgency = urgency === "low" ? "medium" : urgency;
  }

  const priceComparison =
    (product as any).averageCompetitorPrice || product.price * 1.1;
  if (product.price > priceComparison) {
    suggestions.push(
      `Prix supérieur à la moyenne du marché (${priceComparison.toFixed(2)}) – envisagez de baisser.`,
    );
    urgency = urgency === "low" ? "medium" : urgency;
  }

  return {
    productId: product._id,
    suggestions:
      suggestions.length > 0 ? suggestions : ["Tout va bien, continuez !"],
    urgency,
  };
}
