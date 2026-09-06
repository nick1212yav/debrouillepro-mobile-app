export class PricingPolicy {
  static applyDiscounts(params: { pricePerNight: number; nights: number }): {
    discountedPricePerNight: number;
    totalDiscount: number;
    rateApplied: number;
  } {
    let discountRate = 0; // Pourcentage de remise

    if (params.nights >= 30) {
      discountRate = 15; // -15% pour les séjours mensuels
    } else if (params.nights >= 7) {
      discountRate = 10; // -10% pour les séjours hebdomadaires
    }

    const discountedPricePerNight = Math.round(
      params.pricePerNight * (1 - discountRate / 100),
    );
    const totalDiscount =
      (params.pricePerNight - discountedPricePerNight) * params.nights;

    return {
      discountedPricePerNight,
      totalDiscount,
      rateApplied: discountRate,
    };
  }
}
