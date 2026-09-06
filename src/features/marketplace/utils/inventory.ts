// src/features/marketplace/utils/inventory.ts

/**
 * Vérifie si un produit est en stock
 * @param stock - Quantité en stock
 * @returns boolean
 */
export function isInStock(stock: number): boolean {
  return stock > 0;
}

/**
 * Vérifie si le stock est faible (seuil par défaut: 5)
 * @param stock - Quantité en stock
 * @param threshold - Seuil de stock faible
 * @returns boolean
 */
export function isLowStock(stock: number, threshold: number = 5): boolean {
  return stock > 0 && stock <= threshold;
}

/**
 * Calcule le nombre d'unités disponibles après une commande
 * @param currentStock - Stock actuel
 * @param requested - Quantité demandée
 * @returns Nouveau stock ou -1 si insuffisant
 */
export function calculateRemainingStock(
  currentStock: number,
  requested: number,
): number {
  if (requested < 0) return currentStock;
  if (requested > currentStock) return -1;
  return currentStock - requested;
}

/**
 * Formate le statut du stock en texte lisible
 * @param stock - Quantité en stock
 * @returns Chaîne de statut
 */
export function getStockStatus(
  stock: number,
): "available" | "low_stock" | "out_of_stock" {
  if (stock <= 0) return "out_of_stock";
  if (stock <= 5) return "low_stock";
  return "available";
}

/**
 * Label du statut en français
 * @param status - Statut retourné par getStockStatus
 * @returns Label lisible
 */
export function getStockLabel(
  status: "available" | "low_stock" | "out_of_stock",
): string {
  switch (status) {
    case "available":
      return "En stock";
    case "low_stock":
      return "Stock limité";
    case "out_of_stock":
      return "Épuisé";
    default:
      return "Indisponible";
  }
}
