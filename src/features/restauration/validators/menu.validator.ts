export interface MenuItemInput {
  name: string;
  price: number;
  description: string;
  calories?: number;
  prepTime: string;
}

export class MenuValidator {
  /**
   * Valide l'intégrité d'un article de menu individuel
   */
  public static validateItem(input: Partial<MenuItemInput>): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    // Validation du nom du plat
    if (!input.name || input.name.trim() === "") {
      errors.name = "Le nom du plat est requis.";
    } else if (input.name.trim().length < 3) {
      errors.name = "Le nom du plat doit comporter au moins 3 caractères.";
    }

    // Validation du prix
    if (input.price === undefined || input.price === null) {
      errors.price = "Le tarif de l'article est requis.";
    } else if (isNaN(input.price) || input.price < 100) {
      errors.price = "Le prix ne peut pas être inférieur à 100 FCFA.";
    }

    // Validation de la description
    if (!input.description || input.description.trim() === "") {
      errors.description =
        "Une brève description est nécessaire pour guider le client.";
    }

    // Validation des calories (si renseignées)
    if (
      input.calories !== undefined &&
      (isNaN(input.calories) || input.calories < 0)
    ) {
      errors.calories = "L'apport calorique doit être un chiffre positif.";
    }

    // Validation du temps de préparation
    if (!input.prepTime || input.prepTime.trim() === "") {
      errors.prepTime = "Le temps estimé de préparation est requis.";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}
