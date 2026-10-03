import type { User } from "firebase/auth";
import type { UserSyncData } from "../../types/auth.types";

/**
 * Service de synchronisation entre Firebase Auth et Convex.
 *
 * `uid` est l'identifiant stable provenant de Firebase.
 * `tokenIdentifier` conserve la même valeur pour garantir une
 * synchronisation déterministe avec l'utilisateur Convex.
 */
export class ConvexUserService {
  /**
   * Construit les données à synchroniser avec Convex.
   *
   * @param firebaseUser Utilisateur Firebase authentifié.
   * @param roles Liste des rôles de l'utilisateur.
   * @param extras Champs optionnels supplémentaires du profil.
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
    const email = firebaseUser.email || undefined;
    const phone = firebaseUser.phoneNumber || undefined;

    const name =
      firebaseUser.displayName || email?.split("@")[0] || "Utilisateur";

    return {
      uid: firebaseUser.uid,
      tokenIdentifier: firebaseUser.uid,

      email,
      phone,

      name,
      avatar: firebaseUser.photoURL || undefined,

      roles,
      permissions: [],

      emailVerified: firebaseUser.emailVerified,

      ...extras,
    };
  }

  /**
   * Indique si un utilisateur Firebase dispose des informations
   * minimales permettant une synchronisation.
   */
  static userNeedsSync(firebaseUser: User | null): boolean {
    if (!firebaseUser) {
      return false;
    }

    return Boolean(firebaseUser.email || firebaseUser.phoneNumber);
  }
}
