// src/features/agri/policies/selling.policy.ts
import type { UserSession } from "./agri.policy"; // ✅ Corrigé

export class SellingPolicy {
  static MAX_FREE_LISTINGS = 5;

  /**
   * Détermine si un producteur a le droit de publier une nouvelle offre agricole.
   */
  static canCreateListing(
    user: UserSession | null,
    currentActiveCount: number,
    isSellerVerified: boolean,
  ): { allowed: boolean; reason?: string } {
    if (!user) {
      return {
        allowed: false,
        reason: "Connexion requise pour publier une annonce.",
      };
    }

    // Les administrateurs et producteurs certifiés n'ont pas de restrictions quantitatives.
    if (user.role === "admin" || isSellerVerified) {
      return { allowed: true };
    }

    // Limite de publication pour les comptes d'agriculteurs standards gratuits.
    if (currentActiveCount >= this.MAX_FREE_LISTINGS) {
      return {
        allowed: false,
        reason: `Limite de ${this.MAX_FREE_LISTINGS} annonces gratuites atteinte. Veuillez faire valider votre exploitation par nos équipes pour lever cette restriction.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Détermine si un produit est éligible à la négociation commerciale directe.
   */
  static isNegotiationAllowed(
    price: number,
    currency: string,
    isNegotiable: boolean,
  ): boolean {
    if (!isNegotiable) return false;

    // Seuil minimal indicatif sous lequel la négociation est bloquée (ex : 2000 CDF ou 1 USD).
    if (currency === "CDF" && price < 2000) return false;
    if (currency === "USD" && price < 1) return false;

    return true;
  }
}
