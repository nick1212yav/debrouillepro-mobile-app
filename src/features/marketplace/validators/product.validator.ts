// src/features/marketplace/validators/product.validator.ts
import type { ProductFormData } from "../types";

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export class ProductValidator {
  validate(form: ProductFormData): ValidationResult {
    const errors: Record<string, string> = {};

    // Titre
    if (!form.title || form.title.trim().length < 3) {
      errors.title = "Le titre doit contenir au moins 3 caractères";
    }
    if (form.title && form.title.length > 100) {
      errors.title = "Le titre ne doit pas dépasser 100 caractères";
    }

    // Description
    if (!form.description || form.description.trim().length < 10) {
      errors.description =
        "La description doit contenir au moins 10 caractères";
    }
    if (form.description && form.description.length > 5000) {
      errors.description =
        "La description ne doit pas dépasser 5000 caractères";
    }

    // Prix
    if (!form.price || form.price <= 0) {
      errors.price = "Le prix doit être supérieur à 0";
    }

    // Stock
    if (form.stock < 0) {
      errors.stock = "Le stock ne peut pas être négatif";
    }

    // Catégorie
    if (!form.category) {
      errors.category = "La catégorie est requise";
    }

    // Images
    if (!form.images || form.images.length === 0) {
      errors.images = "Au moins une image est requise";
    }
    if (form.images && form.images.length > 10) {
      errors.images = "Maximum 10 images autorisées";
    }

    // Tags
    if (form.tags && form.tags.length > 20) {
      errors.tags = "Maximum 20 tags autorisés";
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  validatePrice(price: number): boolean {
    return price > 0 && price < 100000000;
  }

  validateStock(stock: number): boolean {
    return stock >= 0 && Number.isInteger(stock);
  }

  validateTitle(title: string): boolean {
    return title.trim().length >= 3 && title.trim().length <= 100;
  }

  validateDescription(description: string): boolean {
    return description.trim().length >= 10 && description.trim().length <= 5000;
  }
}

export const productValidator = new ProductValidator();
