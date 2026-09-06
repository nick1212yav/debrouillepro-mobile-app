import type { User } from "firebase/auth";
import type { UserSyncData } from "../../types/auth.types";

/**
 * Service de synchronisation entre Firebase Auth et Convex.
 * Utilise `uid` (Firebase) et `tokenIdentifier` (Convex) pour la stabilité.
 */
export class ConvexUserService {
  /**
   * Construit les données à synchroniser avec Convex.
   * @param firebaseUser - Utilisateur Firebase authentifié
   * @param roles - Liste des rôles (ex: ['particulier', 'vendeur'])
   * @param extras - Champs optionnels (city, country, language, profession, interests)
   */
  static buildSyncData(
    firebaseUser: User,
    roles: string[] = ["particulier"],
    extras?: Partial<
      Omit<
        UserSyncData,
        | "uid"
        | "tokenIdentifier"
        | "name"
        | "email"
        | "phone"
        | "avatar"
        | "roles"
        | "permissions"
        | "emailVerified"
      >
    >,
  ): UserSyncData {
    return {
      // ✅ Clés stables
      uid: firebaseUser.uid,
      tokenIdentifier: firebaseUser.uid, // On utilise le même UID pour les deux (compatible Convex)

      // Identifiants
      email: firebaseUser.email || undefined,
      phone: firebaseUser.phoneNumber || undefined,

      // Profil
      name:
        firebaseUser.displayName ||
        firebaseUser.email?.split("@")[0] ||
        "Utilisateur",
      avatar: firebaseUser.photoURL || undefined,

      // Rôles & permissions
      roles,
      permissions: [],

      // Statut
      emailVerified: firebaseUser.emailVerified,

      // Champs optionnels enrichis
      ...extras,
    };
  }

  static userNeedsSync(firebaseUser: User | null): boolean {
    if (!firebaseUser) return false;
    return !!(firebaseUser.email || firebaseUser.phoneNumber);
  }
}
