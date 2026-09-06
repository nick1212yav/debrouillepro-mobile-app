// src/features/agri/validators/product.validator.ts
import type { AgriProduct } from "../types/agri.types";

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Valide les attributs de saisie d'un produit agricole.
 */
export function validateAgriProduct(product: Partial<AgriProduct>): {
  isValid: boolean;
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];

  if (!product.title || product.title.trim().length < 5) {
    errors.push({
      field: "title",
      message: "Le titre de l'annonce doit comporter au moins 5 caractères.",
    });
  }
  if (!product.description || product.description.trim().length < 15) {
    errors.push({
      field: "description",
      message: "La description doit comporter au moins 15 caractères.",
    });
  }
  if (!product.category) {
    errors.push({
      field: "category",
      message: "La sélection d'une catégorie agricole est obligatoire.",
    });
  }
  if (!product.pricing?.price || product.pricing.price <= 0) {
    errors.push({
      field: "price",
      message: "Le prix unitaire doit être strictement supérieur à zéro.",
    });
  }
  if (
    product.quantity?.available === undefined ||
    product.quantity.available < 0
  ) {
    errors.push({
      field: "availableQuantity",
      message: "La quantité en stock ne peut pas être un nombre négatif.",
    });
  }
  if (!product.location?.city || product.location.city.trim() === "") {
    errors.push({
      field: "city",
      message: "La ville d'enlèvement de la marchandise est obligatoire.",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
