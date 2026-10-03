import type { AuthError } from "../types/auth.types";

/**
 * Convertit une erreur Firebase Auth en erreur applicative
 * stable et exploitable par l'interface.
 */
export function mapFirebaseError(error: unknown): AuthError {
  const err =
    typeof error === "object" && error !== null
      ? (error as { code?: unknown; message?: unknown })
      : {};

  const code =
    typeof err.code === "string" && err.code.trim() ? err.code : "auth/unknown";

  const messages: Record<string, string> = {
    "auth/user-not-found": "Aucun compte trouvé avec cet email",
    "auth/wrong-password": "Mot de passe incorrect",
    "auth/invalid-email": "Email invalide",
    "auth/email-already-in-use": "Cet email est déjà utilisé",
    "auth/weak-password":
      "Le mot de passe est trop faible (minimum 6 caractères)",
    "auth/invalid-phone-number": "Numéro de téléphone invalide",
    "auth/too-many-requests":
      "Trop de tentatives, veuillez réessayer plus tard",
    "auth/network-request-failed":
      "Problème de réseau, vérifiez votre connexion",
    "auth/user-disabled": "Ce compte a été désactivé",
    "auth/requires-recent-login": "Veuillez vous reconnecter",
    "auth/credential-already-in-use":
      "Ce compte est déjà lié à un utilisateur existant",
  };

  const fallbackMessage =
    typeof err.message === "string" && err.message.trim()
      ? err.message
      : "Une erreur est survenue";

  return {
    code,
    message: messages[code] ?? fallbackMessage,
  };
}

/**
 * Vérifie de manière sûre qu'une valeur correspond
 * à la structure minimale d'une erreur Firebase.
 */
export function isFirebaseError(
  error: unknown,
): error is { code: string; message: string } {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    message?: unknown;
  };

  return (
    typeof candidate.code === "string" && typeof candidate.message === "string"
  );
}
