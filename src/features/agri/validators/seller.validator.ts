// src/features/agri/validators/seller.validator.ts
import type { AgriSellerProfileData } from "../types/seller.types";
import type { ValidationError } from "./product.validator"; // ✅ Corrigé

/**
 * Valide le profil et les données de contact d'un producteur agricole.
 */
export function validateAgriSeller(profile: Partial<AgriSellerProfileData>): {
  isValid: boolean;
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];

  if (!profile.name || profile.name.trim().length < 3) {
    errors.push({
      field: "name",
      message:
        "Le nom d'exploitation ou du producteur doit comporter au moins 3 caractères.",
    });
  }
  if (!profile.farmLocation?.city || profile.farmLocation.city.trim() === "") {
    errors.push({
      field: "city",
      message: "La ville d'implantation de l'exploitation est obligatoire.",
    });
  }
  if (
    profile.contactPhone &&
    !/^\+?[1-9]\d{1,14}$/.test(profile.contactPhone)
  ) {
    errors.push({
      field: "contactPhone",
      message:
        "Le format du numéro de téléphone est invalide (standard international requis).",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
