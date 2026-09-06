// src/features/agri/services/AgriService.ts
import type { AgriProduct } from "../types/product.types";

export class AgriService {
  /**
   * Valide les propriétés d'une annonce agricole avant soumission.
   */
  static validateProduct(product: Partial<AgriProduct>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!product.title?.trim())
      errors.push("Le titre de l'annonce est obligatoire.");
    if (!product.description?.trim())
      errors.push("La description détaillée est obligatoire.");
    if (!product.category)
      errors.push("La sélection d'une catégorie agricole est obligatoire.");

    if (!product.pricing?.price || product.pricing.price <= 0) {
      errors.push("Le prix unitaire saisi doit être supérieur à zéro.");
    }
    if (!product.quantity?.available || product.quantity.available < 0) {
      errors.push(
        "La quantité disponible en stock doit être positive ou égale à zéro.",
      );
    }
    if (!product.location?.city?.trim()) {
      errors.push("La ville de retrait de la marchandise est obligatoire.");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calcule le score de popularité pour le moteur de recommandation du core SDK.
   */
  static calculatePopularityScore(product: AgriProduct): number {
    const { views, favorites, contacts } = product.stats;
    // Les demandes directes (contacts) valent 15x, les favoris 5x et les vues simples 1x.
    return views + favorites * 5 + contacts * 15;
  }
}
