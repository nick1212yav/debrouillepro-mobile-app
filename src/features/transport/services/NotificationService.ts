// src/features/transport/services/NotificationService.ts

export interface NotificationPayload {
  recipientPhone: string;
  recipientName: string;
  title: string;
  body: string;
}

export class NotificationService {
  /**
   * Envoyer un SMS d'alerte ou de notification [2]
   */
  static async sendSMS(
    payload: NotificationPayload,
  ): Promise<{ success: boolean; messageId?: string }> {
    // Simulation d'interfaçage avec des passerelles SMS africaines (ex: Africa's Talking, Termii) [2]
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!payload.recipientPhone.startsWith("+")) {
          console.warn(
            "[NotificationService] Numéro de téléphone non valide (format international requis) [2].",
          );
          resolve({ success: false });
          return;
        }

        console.log(
          `[SMS Envoyé] Vers : ${payload.recipientPhone} | Message : ${payload.body} [2]`,
        );
        resolve({
          success: true,
          messageId: `sms_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        });
      }, 1000);
    });
  }

  /**
   * Envoyer un OTP (One-Time Password) pour valider une transaction DébrouillePay [2]
   */
  static async sendTransactionOTP(
    phone: string,
    amount: number,
    currency: string,
  ): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Génère un code à 6 chiffres

    await this.sendSMS({
      recipientPhone: phone,
      recipientName: "Utilisateur",
      title: "Validation DébrouillePay [2]",
      body: `DébrouillePay : Votre code de validation pour le paiement de ${amount.toLocaleString()} ${currency} est ${otp}. Valable 5 minutes [2].`,
    });

    return otp;
  }

  /**
   * Alerter un voyageur de l'approche du chauffeur [2]
   */
  static async notifyDriverApproaching(
    phone: string,
    passengerName: string,
    driverName: string,
    etaMinutes: number,
  ): Promise<void> {
    await this.sendSMS({
      recipientPhone: phone,
      recipientName: passengerName,
      title: "Chauffeur en route ! [2]",
      body: `Bonjour ${passengerName}, votre chauffeur ${driverName} arrive dans environ ${etaMinutes} minutes. Préparez-vous à l'embarquement [2] !`,
    });
  }
}
