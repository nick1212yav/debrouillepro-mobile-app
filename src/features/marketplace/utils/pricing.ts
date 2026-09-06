// src/features/marketplace/utils/pricing.ts

/**
 * Calcule le prix TTC à partir du HT
 * @param priceHT - Prix hors taxes
 * @param taxRate - Taux de taxe (ex: 0.18 pour 18%)
 * @returns Prix TTC
 */
export function priceWithTax(priceHT: number, taxRate: number = 0.18): number {
  return priceHT * (1 + taxRate);
}

/**
 * Applique une remise en pourcentage
 * @param price - Prix original
 * @param discountPercent - Pourcentage de remise (ex: 10 pour 10%)
 * @returns Prix après remise
 */
export function applyDiscount(price: number, discountPercent: number): number {
  if (discountPercent < 0 || discountPercent > 100) return price;
  return price * (1 - discountPercent / 100);
}

/**
 * Calcule le montant de la remise
 * @param price - Prix original
 * @param discountPercent - Pourcentage de remise
 * @returns Montant de la remise
 */
export function discountAmount(price: number, discountPercent: number): number {
  return price - applyDiscount(price, discountPercent);
}

/**
 * Calcule le prix unitaire avec la quantité
 * @param unitPrice - Prix unitaire
 * @param quantity - Quantité
 * @returns Prix total
 */
export function totalPrice(unitPrice: number, quantity: number): number {
  return unitPrice * quantity;
}

/**
 * Arrondit un prix à 2 décimales
 * @param price - Prix à arrondir
 * @returns Prix arrondi
 */
export function roundPrice(price: number): number {
  return Math.round(price * 100) / 100;
}

/**
 * Vérifie si un prix est valide (positif et non nul)
 * @param price - Prix à vérifier
 * @returns boolean
 */
export function isValidPrice(price: number): boolean {
  return typeof price === "number" && price > 0 && isFinite(price);
}
