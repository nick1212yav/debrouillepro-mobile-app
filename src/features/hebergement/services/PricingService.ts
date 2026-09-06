export class PricingService {
  static calculateTotal(
    pricePerNight: number,
    nights: number,
    cleaningFee = 15000,
    deposit = 50000,
  ): {
    subtotal: number;
    serviceFee: number;
    cleaningFee: number;
    deposit: number;
    total: number;
  } {
    const subtotal = pricePerNight * nights;
    const serviceFee = Math.round(subtotal * 0.05); // 5% frais de service
    const total = subtotal + serviceFee + cleaningFee + deposit;

    return {
      subtotal,
      serviceFee,
      cleaningFee,
      deposit,
      total,
    };
  }
}
