// src/features/marketplace/ai/PricingEngine.ts
import type { Product } from "../types/product.types";

export interface PriceSuggestion {
  suggestedPrice: number;
  rationale: string;
  confidence: number; // 0-1
}

/**
 * Suggère un prix optimal basé sur la concurrence, la demande et l'historique.
 */
export function suggestOptimalPrice(
  product: Product,
  competitorPrices: number[],
  demandScore: number, // 0-1
  elasticity: number = 0.5,
): PriceSuggestion {
  const avgCompetitor =
    competitorPrices.length > 0
      ? competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length
      : product.price;

  // Facteur d'ajustement
  const factor = 1 + (demandScore - 0.5) * elasticity;
  const suggested = avgCompetitor * factor;

  // Arrondi à la centaine près
  const rounded = Math.round(suggested / 100) * 100;

  return {
    suggestedPrice: rounded,
    rationale: `Prix basé sur la concurrence (moyenne ${avgCompetitor.toFixed(2)}) et la demande (${(demandScore * 100).toFixed(0)}%)`,
    confidence: 0.7,
  };
}
