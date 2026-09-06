export interface PaymentFormInput {
  gateway: "mobile_money" | "card" | "crypto";
  phoneNumber?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
}

export class PaymentValidator {
  /**
   * Exécute l'algorithme de Luhn pour vérifier la somme de contrôle d'une carte bancaire
   */
  private static checkLuhn(cardNumber: string): boolean {
    let sum = 0;
    let shouldDouble = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i), 10);

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }

  /**
   * Valide les formulaires financiers et coordonnées de transfert
   */
  public static validate(input: Partial<PaymentFormInput>): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    if (!input.gateway) {
      errors.gateway = "Le canal de paiement est obligatoire.";
      return { isValid: false, errors };
    }

    // 1. Validation de l'interface Mobile Money (Orange, MTN, Moov, Wave)
    if (input.gateway === "mobile_money") {
      if (!input.phoneNumber || input.phoneNumber.trim() === "") {
        errors.phoneNumber = "Le numéro de téléphone est requis.";
      } else {
        // Validation générique pour les numéros d'Afrique subsaharienne (8 à 14 chiffres avec indicatif optionnel)
        const phoneRegex = /^\+?[0-9]{8,14}$/;
        if (!phoneRegex.test(input.phoneNumber.replace(/\s+/g, ""))) {
          errors.phoneNumber =
            "Format de numéro invalide (ex: +2250708091011).";
        }
      }
    }

    // 2. Validation de l'interface par carte de crédit/débit
    if (input.gateway === "card") {
      // Nettoyage des espaces
      const cleanCard = (input.cardNumber || "").replace(/\s+/g, "");
      if (!cleanCard) {
        errors.cardNumber = "Le numéro de carte bancaire est requis.";
      } else if (!/^[0-9]{13,19}$/.test(cleanCard)) {
        errors.cardNumber = "La carte doit contenir entre 13 et 19 chiffres.";
      } else if (!this.checkLuhn(cleanCard)) {
        errors.cardNumber =
          "Somme de contrôle incorrecte (Numéro de carte invalide).";
      }

      // Date d'expiration (MM/AA)
      if (
        !input.cardExpiry ||
        !/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(input.cardExpiry)
      ) {
        errors.cardExpiry = "Date d'expiration invalide (utilisez MM/AA).";
      }

      // CVV (3 ou 4 chiffres)
      if (!input.cardCvv || !/^[0-9]{3,4}$/.test(input.cardCvv)) {
        errors.cardCvv = "Code CVV incorrect (3 ou 4 chiffres).";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}
