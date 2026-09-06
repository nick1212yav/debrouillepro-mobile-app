// src/features/transport/payments/WalletAdapter.ts

export class WalletAdapter {
  /**
   * Débiter le solde du portefeuille virtuel de l'utilisateur [2]
   */
  static async debitWallet(
    userId: string,
    amount: number,
    currency: string,
  ): Promise<{
    success: boolean;
    newBalance: number;
    errorReason?: string;
  }> {
    const mockBalance = 50000; // Solde simulé de 50 000 FCFA

    return new Promise((resolve) => {
      setTimeout(() => {
        if (mockBalance < amount) {
          resolve({
            success: false,
            newBalance: mockBalance,
            errorReason:
              "Solde insuffisant dans votre portefeuille DébrouillePay [2].",
          });
          return;
        }

        resolve({
          success: true,
          newBalance: mockBalance - amount,
        });
      }, 800);
    });
  }
}
