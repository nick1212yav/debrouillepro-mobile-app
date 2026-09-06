// src/features/agri/utils/formatter.ts
import { CATEGORY_LABELS } from "../constants/agri.categories";
import type { AgriCategory } from "../types/product.types";

export class AgriFormatter {
  /**
   * Formate proprement le label de la catégorie agricole.
   */
  static formatCategory(category: AgriCategory): string {
    return CATEGORY_LABELS[category] || category;
  }

  /**
   * Formate l'état du stock de récolte pour l'affichage de l'UI.
   */
  static formatStockStatus(
    status: "available" | "limited" | "sold_out" | "pre_order",
  ): string {
    const labels = {
      available: "En stock",
      limited: "Stock limité",
      sold_out: "Rupture de stock",
      pre_order: "Pré-commande",
    };
    return labels[status] || status;
  }

  /**
   * Formate la réputation et le volume d'avis d'un producteur.
   */
  static formatSellerRating(rating: number, count: number): string {
    return `${rating.toFixed(1)} / 5 (${count} avis)`;
  }
}
