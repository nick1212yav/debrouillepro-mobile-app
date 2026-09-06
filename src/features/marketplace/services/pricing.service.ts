// src/features/marketplace/services/pricing.service.ts

export class PricingService {
  /**
   * Applique une remise
   */
  applyDiscount(price: number, discountPercent: number): number {
    if (discountPercent < 0 || discountPercent > 100) return price;
    return price * (1 - discountPercent / 100);
  }

  /**
   * Calcule le montant de la remise
   */
  getDiscountAmount(price: number, discountPercent: number): number {
    return price - this.applyDiscount(price, discountPercent);
  }

  /**
   * Calcule le prix total avec quantité
   */
  getTotalPrice(price: number, quantity: number): number {
    return price * quantity;
  }

  /**
   * Vérifie si une offre est valide
   */
  isOfferValid(startDate?: string, endDate?: string): boolean {
    const now = Date.now();
    if (startDate && new Date(startDate).getTime() > now) return false;
    if (endDate && new Date(endDate).getTime() < now) return false;
    return true;
  }

  /**
   * Calcule le prix moyen
   */
  getAveragePrice(prices: number[]): number {
    if (prices.length === 0) return 0;
    return prices.reduce((a, b) => a + b, 0) / prices.length;
  }

  /**
   * Calcule le prix le plus bas
   */
  getLowestPrice(prices: number[]): number {
    return Math.min(...prices);
  }
}

export const pricingService = new PricingService();
