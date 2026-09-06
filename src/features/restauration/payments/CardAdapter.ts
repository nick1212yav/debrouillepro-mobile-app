export interface CardPaymentInput {
  number: string;
  expiry: string;
  cvv: string;
}

export interface CardPaymentResponse {
  success: boolean;
  referenceCode: string;
  authCode?: string;
  errorMessage?: string;
}

export class CardAdapter {
  /**
   * Traite un paiement par carte bancaire de manière sécurisée (simulation PCI-DSS)
   */
  public static async processPayment(
    card: CardPaymentInput,
    amount: number,
  ): Promise<CardPaymentResponse> {
    const lastFour = card.number.slice(-4);
    console.log(
      `[CardAdapter] Transmission sécurisée de la transaction d'un montant de ${amount} FCFA pour la carte finissant par **** ${lastFour}.`,
    );

    return new Promise((resolve) => {
      setTimeout(() => {
        const authCode = Math.floor(100000 + Math.random() * 900000).toString();
        const referenceCode = `CARD-TX-${Date.now()}`;

        resolve({
          success: true,
          referenceCode,
          authCode,
        });
      }, 1200);
    });
  }

  /**
   * Effectue un remboursement partiel ou total sur une transaction carte acquittée
   */
  public static async refundPayment(
    referenceCode: string,
    amount: number,
  ): Promise<boolean> {
    console.log(
      `[CardAdapter] Émission d'une demande de recrédit d'un montant de ${amount} FCFA sur la référence ${referenceCode}.`,
    );
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1000);
    });
  }
}
