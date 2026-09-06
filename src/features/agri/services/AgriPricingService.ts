// src/features/agri/services/AgriPricingService.ts
export class AgriPricingService {
  // Taux de change interne de référence pour la République Démocratique du Congo (ex: 1 USD = 2850 CDF)
  private static EXCHANGE_RATE_USD_TO_CDF = 2850;

  /**
   * Convertit un montant entre CDF et USD pour faciliter la comparaison.
   */
  static convertPrice(price: number, from: string, to: string): number {
    if (from === to) return price;

    if (from === "USD" && to === "CDF") {
      return price * this.EXCHANGE_RATE_USD_TO_CDF;
    }
    if (from === "CDF" && to === "USD") {
      return price / this.EXCHANGE_RATE_USD_TO_CDF;
    }
    return price;
  }

  /**
   * Calcule le prix unitaire ajusté si la commande atteint le seuil d'achat en gros (gros rabais).
   */
  static calculateBulkDiscount(
    price: number,
    quantity: number,
    threshold = 500,
    discountPercent = 10,
  ): number {
    if (quantity >= threshold) {
      return price * (1 - discountPercent / 100);
    }
    return price;
  }

  /**
   * Formate proprement les prix CDF/USD avec leurs spécificités.
   */
  static formatPrice(price: number, currency: string, unit?: string): string {
    if (currency === "CDF") {
      const formatted = `${price.toLocaleString("fr-FR")} CDF`;
      return unit ? `${formatted} / ${unit}` : formatted;
    }
    const formatted = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(price);
    return unit ? `${formatted} / ${unit}` : formatted;
  }
}
