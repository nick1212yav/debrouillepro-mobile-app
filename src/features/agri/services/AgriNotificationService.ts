// src/features/agri/services/AgriNotificationService.ts
import type { AgriProduct } from "../types/product.types";

export class AgriNotificationService {
  /**
   * Génère un avertissement de stock si le seuil de rupture est proche.
   */
  static generateStockAlertMessage(product: AgriProduct): string | null {
    if (product.quantity.available <= 0) {
      return `Le produit "${product.title}" est désormais en rupture de stock.`;
    }
    if (product.availability.status === "limited") {
      return `Stock limité pour "${product.title}" (${product.quantity.available} ${product.quantity.unit}s restants).`;
    }
    return null;
  }

  /**
   * Génère une notification de pré-commande lorsque la récolte approche.
   */
  static generateHarvestReminderMessage(product: AgriProduct): string | null {
    if (
      product.availability.status === "pre_order" &&
      product.availability.harvestDate
    ) {
      return `La récolte de "${product.title}" approche (prévue le ${product.availability.harvestDate}). Pensez à sécuriser votre pré-commande.`;
    }
    return null;
  }
}
