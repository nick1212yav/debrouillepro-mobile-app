// src/features/agri/utils/units.ts
import type { AgriUnit } from "../types/product.types";

export class AgriUnitsUtils {
  // Poids indicatifs standards d'une unité de mesure agricole exprimés en kilogrammes (RDC)
  private static UNIT_WEIGHTS_IN_KG: Record<AgriUnit, number> = {
    kg: 1,
    tonne: 1000,
    sac: 50, // Poids standard moyen d'un sac de maïs/manioc au Congo
    botte: 2, // Poids d'une botte de légumes feuillus (ex: amarantes, oignons)
    piece: 0.5,
    litre: 1, // Densité moyenne de l'eau pour les engrais liquides
    hectare: 0, // Non quantifiable en poids de récolte directe
  };

  /**
   * Convertit une quantité d'unité spécifique en kilogrammes (kg) pour homogénéiser la logistique.
   */
  static convertToKg(quantity: number, unit: AgriUnit): number {
    const factor = this.UNIT_WEIGHTS_IN_KG[unit] || 0;
    return quantity * factor;
  }

  /**
   * Évalue le nombre de sacs de 50 kg requis pour ensacher un poids total de récolte.
   */
  static estimateBagsCount(weightInKg: number): number {
    return Math.ceil(weightInKg / 50);
  }
}
