export interface OrderItemInput {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderFormInput {
  items: OrderItemInput[];
  deliveryAddress: string;
  paymentMethod: string;
}

export class OrderValidator {
  /**
   * Valide la structure globale et les contraintes d'une commande
   */
  public static validate(input: Partial<OrderFormInput>): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    // Validation du Panier
    if (
      !input.items ||
      !Array.isArray(input.items) ||
      input.items.length === 0
    ) {
      errors.items = "Votre panier d'achat est vide.";
    } else {
      for (let i = 0; i < input.items.length; i++) {
        const item = input.items[i];
        if (item.quantity <= 0 || isNaN(item.quantity)) {
          errors[`items_${i}_quantity`] =
            `La quantité pour l'article '${item.name}' doit être positive.`;
        }
      }
    }

    // Validation de l'adresse de livraison
    if (!input.deliveryAddress || input.deliveryAddress.trim() === "") {
      errors.deliveryAddress =
        "L'adresse de destination pour la livraison est obligatoire.";
    }

    // Validation du moyen de paiement
    const allowedPayments = [
      "mobile_money",
      "wave",
      "moov",
      "mtn",
      "orange_money",
      "cash",
      "card",
      "crypto",
    ];
    if (
      !input.paymentMethod ||
      !allowedPayments.includes(input.paymentMethod)
    ) {
      errors.paymentMethod =
        "Veuillez sélectionner un moyen de paiement valide.";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}
