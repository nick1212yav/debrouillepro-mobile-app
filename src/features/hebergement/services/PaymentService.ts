import type { PaymentDetails, PaymentMethodType } from "../types/payment.types";

export class PaymentService {
  private static transactions = new Map<string, PaymentDetails>();

  static async processPayment(params: {
    bookingId: string;
    amount: number;
    currency: string;
    method: PaymentMethodType | string;
    phone?: string;
  }): Promise<{
    success: boolean;
    transaction?: PaymentDetails;
    error?: string;
  }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const transactionId =
          "TX-" +
          params.method.toUpperCase() +
          "-" +
          Math.floor(100000 + Math.random() * 900000);

        const transaction: PaymentDetails = {
          transactionId,
          amount: params.amount,
          currency: params.currency,
          method: params.method,
          status: "success",
          timestamp: Date.now(),
          phone: params.phone,
        };

        this.transactions.set(transactionId, transaction);
        resolve({ success: true, transaction });
      }, 1500);
    });
  }

  static getTransaction(id: string): PaymentDetails | undefined {
    return this.transactions.get(id);
  }
}
