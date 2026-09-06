// src/features/marketplace/services/inventory.service.ts

export class InventoryService {
  /**
   * Vérifie si un produit est en stock
   */
  isInStock(stock: number, quantity: number): boolean {
    return stock >= quantity;
  }

  /**
   * Calcule le stock après commande
   */
  calculateStock(stock: number, quantity: number): number {
    return Math.max(0, stock - quantity);
  }

  /**
   * Alerte de stock faible
   */
  isLowStock(stock: number, threshold: number = 5): boolean {
    return stock > 0 && stock <= threshold;
  }

  /**
   * Retourne le statut du stock
   */
  getStockStatus(stock: number): "available" | "low" | "out_of_stock" {
    if (stock <= 0) return "out_of_stock";
    if (stock <= 5) return "low";
    return "available";
  }

  /**
   * Calcule le nombre de jours avant rupture de stock
   */
  daysUntilOutOfStock(stock: number, dailySales: number): number {
    if (dailySales <= 0) return Infinity;
    return Math.floor(stock / dailySales);
  }
}

export const inventoryService = new InventoryService();
