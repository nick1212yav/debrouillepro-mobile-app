export class CurrencyUtils {
  /**
   * Formate un montant entier en devise Franc CFA (FCFA) ou autre monnaie locale
   */
  public static formatFCFA(amount: number): string {
    if (isNaN(amount)) return "0 FCFA";

    // Le franc CFA n'utilise historiquement pas de décimales
    const rounded = Math.round(amount);

    // Formatage avec séparateur d'espace pour les milliers (ex: 15 000 FCFA)
    return `${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA`;
  }

  /**
   * Calcule la taxe de commission ou de service du système (ex: 2.5% de frais de transaction)
   */
  public static calculateServiceFee(
    subtotal: number,
    feePercent: number = 2.5,
  ): number {
    const rawFee = subtotal * (feePercent / 100);
    return Math.round(rawFee);
  }

  /**
   * Répartit un total brut de commande entre plusieurs destinataires (Split Payment)
   */
  public static splitRevenue(
    total: number,
    restaurantSharePercent: number = 85,
  ): { restaurantShare: number; platformShare: number } {
    const restaurantShare = Math.round(total * (restaurantSharePercent / 100));
    return {
      restaurantShare,
      platformShare: total - restaurantShare,
    };
  }
}
