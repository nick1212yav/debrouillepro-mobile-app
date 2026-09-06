import type { Accommodation } from "../types/accommodation.types";

export interface ValidationResult {
  success: boolean;
  errors?: Record<string, string>;
}

export const validateAccommodation = (
  data: Partial<Accommodation>,
): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.title || data.title.trim().length < 5) {
    errors.title =
      "Le titre de l'annonce doit comporter au moins 5 caractères.";
  }

  if (!data.type) {
    errors.type = "Le type de logement est obligatoire.";
  }

  if (!data.location?.city || data.location.city.trim() === "") {
    errors.city = "La ville de localisation est obligatoire.";
  }

  if (!data.pricing?.amount || data.pricing.amount <= 0) {
    errors.price = "Le montant du prix doit être supérieur à 0.";
  }

  return {
    success: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};
