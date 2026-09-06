export interface EscrowAccount {
  escrowId: string;
  orderId: string;
  amount: number;
  status: "held" | "released" | "refunded";
  createdAt: string;
}

export class EscrowService {
  private static escrowDatabase: Map<string, EscrowAccount> = new Map();

  /**
   * Séquestre les fonds associés à une commande d'événement ou chef à domicile
   */
  public static async holdFunds(
    orderId: string,
    amount: number,
  ): Promise<string> {
    const escrowId = `ESC-${Date.now().toString().slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;
    const record: EscrowAccount = {
      escrowId,
      orderId,
      amount,
      status: "held",
      createdAt: new Date().toISOString(),
    };

    this.escrowDatabase.set(escrowId, record);
    console.log(
      `[EscrowService] Fonds séquestrés avec succès. ID Compte : ${escrowId}, Montant : ${amount} FCFA.`,
    );
    return escrowId;
  }

  /**
   * Libère les fonds séquestrés pour créditer le portefeuille du prestataire (Chef/Restaurateur)
   */
  public static async releaseFunds(escrowId: string): Promise<boolean> {
    const account = this.escrowDatabase.get(escrowId);
    if (!account || account.status !== "held") {
      console.warn(
        `[EscrowService] Impossible de libérer les fonds du compte ${escrowId} (inexistant ou déjà traité).`,
      );
      return false;
    }

    account.status = "released";
    this.escrowDatabase.set(escrowId, account);
    console.log(
      `[EscrowService] Succès. Fonds libérés pour le compte ${escrowId}. Le prestataire a été crédité.`,
    );
    return true;
  }

  /**
   * Restitue l'intégralité du montant séquestré au client en cas d'annulation conforme
   */
  public static async refundFunds(escrowId: string): Promise<boolean> {
    const account = this.escrowDatabase.get(escrowId);
    if (!account || account.status !== "held") {
      return false;
    }

    account.status = "refunded";
    this.escrowDatabase.set(escrowId, account);
    console.log(
      `[EscrowService] Succès. Les fonds du compte ${escrowId} ont été restitués au client.`,
    );
    return true;
  }
}
