// src/features/agri/utils/pricing.ts
export class AgriPricingUtils {
  private static EXCHANGE_USD_CDF = 2850;

  /**
   * Convertit un montant entre CDF et USD (taux de change indicatif).
   */
  static convert(amount: number, from: string, to: string): number {
    if (from === to) return amount;
    if (from === "USD" && to === "CDF") return amount * this.EXCHANGE_USD_CDF;
    if (from === "CDF" && to === "USD") return amount / this.EXCHANGE_USD_CDF;
    return amount;
  }

  /**
   * Calcule le montant total estimé d'une commande incluant un éventuel taux de remise de gros.
   */
  static calculateTotalCost(
    price: number,
    quantity: number,
    discountRate = 0,
  ): number {
    const base = price * quantity;
    return base * (1 - discountRate / 100);
  }
}
