// src/features/marketplace/utils/discount.ts

/**
 * Applique une remise en pourcentage
 */
export function applyDiscount(price: number, percent: number): number {
  if (percent < 0 || percent > 100) return price;
  return price * (1 - percent / 100);
}

/**
 * Calcule le montant de la remise
 */
export function getDiscountAmount(price: number, percent: number): number {
  return price - applyDiscount(price, percent);
}

/**
 * Calcule le pourcentage de remise à partir du prix original et du prix final
 */
export function getDiscountPercent(
  originalPrice: number,
  finalPrice: number,
): number {
  if (originalPrice <= 0 || finalPrice >= originalPrice) return 0;
  return Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
}

/**
 * Vérifie si une réduction est active
 */
export function isDiscountActive(
  startDate?: string,
  endDate?: string,
): boolean {
  const now = Date.now();
  if (startDate && new Date(startDate).getTime() > now) return false;
  if (endDate && new Date(endDate).getTime() < now) return false;
  return true;
}

/**
 * Formate une remise en texte lisible
 */
export function formatDiscount(percent: number): string {
  if (percent <= 0) return "Aucune remise";
  return `${percent}% de réduction`;
}
