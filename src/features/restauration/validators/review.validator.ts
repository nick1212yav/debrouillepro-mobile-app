export interface ReviewFormInput {
  rating: number; // 1 à 5
  comment: string;
}

export class ReviewValidator {
  /**
   * Contrôle la validité d'une évaluation
   */
  public static validate(input: Partial<ReviewFormInput>): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    // Contrôle de l'évaluation chiffrée
    if (input.rating === undefined || input.rating === null) {
      errors.rating = "Une note d'appréciation globale est requise.";
    } else if (isNaN(input.rating) || input.rating < 1 || input.rating > 5) {
      errors.rating = "L'évaluation doit être comprise entre 1 et 5 étoiles.";
    }

    // Contrôle du commentaire
    if (!input.comment || input.comment.trim() === "") {
      errors.comment = "Le texte de votre avis ne peut pas être vide.";
    } else if (input.comment.trim().length < 10) {
      errors.comment =
        "Veuillez détailler votre retour d'expérience (min. 10 caractères).";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}
