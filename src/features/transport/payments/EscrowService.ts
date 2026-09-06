// src/features/transport/payments/EscrowService.ts

export interface EscrowAccount {
  escrowId: string;
  bookingId: string;
  amount: number;
  currency: string;
  isReleased: boolean;
}

export class EscrowService {
  private static ledger: Record<string, EscrowAccount> = {};

  /**
   * Séquestrer les fonds du client
   */
  static lockFunds(
    bookingId: string,
    amount: number,
    currency: string,
  ): EscrowAccount {
    const escrowId = `ESC-${Date.now()}`;
    const account: EscrowAccount = {
      escrowId,
      bookingId,
      amount,
      currency,
      isReleased: false,
    };

    this.ledger[bookingId] = account;
    return account;
  }

  /**
   * Libérer et reverser les fonds au chauffeur à destination [2]
   */
  static releaseFunds(bookingId: string): boolean {
    const account = this.ledger[bookingId];
    if (account && !account.isReleased) {
      account.isReleased = true;
      console.log(
        `[EscrowService] Versement des fonds de ${account.amount} ${account.currency} finalisé pour le chauffeur [2].`,
      );
      return true;
    }
    return false;
  }
}
