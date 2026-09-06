// src/features/agri/policies/agri.policy.ts
import type { AgriProduct } from "../types/agri.types";

export interface UserSession {
  id: string;
  role: "user" | "admin" | "moderator";
}

export class AgriPolicy {
  /**
   * Vérifie si l'utilisateur a l'autorisation de consulter l'annonce agricole.
   */
  static canView(user: UserSession | null, product: AgriProduct): boolean {
    // Les produits en rupture de stock restent consultables à titre de référence historique.
    return true;
  }

  /**
   * Spécifie si l'utilisateur connecté peut modifier l'annonce.
   */
  static canEdit(user: UserSession | null, product: AgriProduct): boolean {
    if (!user) return false;
    if (user.role === "admin" || user.role === "moderator") return true;
    return product.seller.userId === user.id;
  }

  /**
   * Spécifie si l'utilisateur connecté a le droit de supprimer l'annonce.
   */
  static canDelete(user: UserSession | null, product: AgriProduct): boolean {
    if (!user) return false;
    if (user.role === "admin") return true;
    return product.seller.userId === user.id;
  }
}
