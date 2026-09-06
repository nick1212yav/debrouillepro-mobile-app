// src/features/transport/payments/SplitPaymentService.ts

export interface SplitShare {
  userId: string;
  name: string;
  amount: number;
  status: "pending" | "paid" | "declined";
}

export class SplitPaymentService {
  /**
   * Diviser équitablement le tarif de la course
   */
  static splitFare(
    totalAmount: number,
    passengers: { id: string; name: string }[],
  ): SplitShare[] {
    const count = passengers.length;
    if (count <= 0) return [];

    const shareAmount = parseFloat((totalAmount / count).toFixed(0));

    return passengers.map((p, idx) => ({
      userId: p.id,
      name: p.name,
      amount: shareAmount,
      status: idx === 0 ? "paid" : "pending", // L'initiateur paye immédiatement sa part [2]
    }));
  }
}
