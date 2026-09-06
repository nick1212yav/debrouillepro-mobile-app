export interface PaymentValidationData {
  method: "momo" | "card" | "wallet" | string;
  phone?: string;
  cardNumber?: string;
  expiry?: string;
  cvc?: string;
}

export const validatePayment = (
  data: PaymentValidationData,
): { success: boolean; errors?: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (data.method === "momo") {
    if (!data.phone || data.phone.trim().length < 8) {
      errors.phone = "Le numéro de téléphone Mobile Money est invalide.";
    }
  } else if (data.method === "card") {
    if (!data.cardNumber || data.cardNumber.replace(/\s+/g, "").length !== 16) {
      errors.cardNumber =
        "Le numéro de carte bancaire doit comporter 16 chiffres.";
    }
    if (!data.expiry || !/^\d{2}\/\d{2}$/.test(data.expiry)) {
      errors.expiry = "La date d'expiration doit être au format MM/AA.";
    }
    if (!data.cvc || data.cvc.trim().length < 3 || data.cvc.trim().length > 4) {
      errors.cvc = "Le code CVC / CVV est invalide.";
    }
  }

  return {
    success: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};
