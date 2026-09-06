// src/features/transport/payments/CardAdapter.ts

export interface CardPayload {
  number: string;
  name: string;
  expiry: string;
  cvc: string;
}

export class CardAdapter {
  /**
   * Traiter une autorisation de paiement par carte de crédit [2]
   */
  static async authorizeAndCapture(
    amount: number,
    currency: string,
    card: CardPayload,
  ): Promise<{
    success: boolean;
    authCode?: string;
  }> {
    const cleanCardNumber = card.number.replace(/\s+/g, "");

    return new Promise((resolve) => {
      setTimeout(() => {
        if (cleanCardNumber.length < 15 || card.cvc.length < 3) {
          resolve({ success: false });
          return;
        }

        resolve({
          success: true,
          authCode: `AUTH-CARD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        });
      }, 1500);
    });
  }
}
