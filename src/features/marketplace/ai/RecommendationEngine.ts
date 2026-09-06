// src/features/marketplace/ai/RecommendationEngine.ts
import type { Product } from "../types/product.types";

/**
 * Simule un moteur de recommandation basé sur les tags et la catégorie.
 * En production, on pourrait utiliser un modèle ML ou un algorithme de similarité.
 */
export function recommendSimilarProducts(
  product: Product,
  allProducts: Product[],
  limit: number = 4,
): Product[] {
  const candidates = allProducts.filter((p) => p._id !== product._id);
  const scored = candidates.map((p) => {
    let score = 0;
    // Même catégorie
    if (p.category === product.category) score += 3;
    // Tags en commun
    const commonTags = p.tags.filter((tag) =>
      product.tags.includes(tag),
    ).length;
    score += commonTags * 2;
    // Même vendeur
    if (p.sellerId === product.sellerId) score += 1;
    return { product: p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((item) => item.product);
}

/**
 * Recommande des produits fréquemment achetés ensemble (basé sur l'historique des commandes).
 */
export function frequentlyBoughtTogether(
  productId: string,
  orders: { productId: string }[],
  allProducts: Product[],
  limit: number = 4,
): Product[] {
  // Compter les cooccurrences
  const cooccurrence = new Map<string, number>();
  orders.forEach((order) => {
    // Ici on aurait besoin d'avoir les paniers groupés. Simulons : on suppose que les commandes individuelles contiennent un seul produit.
    // Pour un vrai système, il faudrait agréger par commande (orderId).
    // Version simplifiée : on considère que chaque commande a un seul produit.
  });
  // Placeholder : renvoyer des produits aléatoires ou similaires
  const filtered = allProducts.filter((p) => p._id !== productId);
  return filtered.slice(0, limit);
}
