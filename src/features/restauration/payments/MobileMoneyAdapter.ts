export type MobileMoneyProvider = "orange" | "mtn" | "moov" | "wave";

export interface MobileMoneyResponse {
  success: boolean;
  transactionId: string;
  message: string;
  status: "pending" | "success" | "failed";
}

export class MobileMoneyAdapter {
  /**
   * Initialise un prélèvement ou un transfert Mobile Money via push API (demande de saisie de code PIN sur le mobile)
   */
  public static async initiatePayment(
    phoneNumber: string,
    amount: number,
    provider: MobileMoneyProvider,
  ): Promise<MobileMoneyResponse> {
    // Nettoyage du numéro de téléphone (retrait des espaces et caractères spéciaux)
    const cleanNumber = phoneNumber.replace(/\s+/g, "");
    const transactionId = `${provider.toUpperCase()}-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    console.log(
      `[MobileMoneyAdapter] Initialisation du push USSD ${provider.toUpperCase()} pour ${cleanNumber} d'un montant de ${amount} FCFA.`,
    );

    // Simulation d'une attente d'API réseau opérateur
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          transactionId,
          message:
            "Demande Push émise avec succès. En attente du code PIN client.",
          status: "pending",
        });
      }, 800);
    });
  }

  /**
   * Vérifie le statut de la transaction auprès de la passerelle
   */
  public static async verifyTransaction(
    transactionId: string,
  ): Promise<{ status: "success" | "failed" | "pending" }> {
    console.log(
      `[MobileMoneyAdapter] Interrogation du statut pour la transaction ${transactionId}.`,
    );

    // Simulation d'une vérification asynchrone (90% de taux de succès simulé)
    return new Promise((resolve) => {
      setTimeout(() => {
        const statuses: ("success" | "failed" | "pending")[] = [
          "success",
          "success",
          "success",
          "pending",
        ];
        const randomStatus =
          statuses[Math.floor(Math.random() * statuses.length)];
        resolve({ status: randomStatus });
      }, 500);
    });
  }
}
