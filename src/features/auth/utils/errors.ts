import type { AuthError } from "../types/auth.types";

export function mapFirebaseError(error: unknown): AuthError {
  const err = error as { code?: string; message?: string };
  const code = err.code || "auth/unknown";
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
  return {
    code,
    message: messages[code] || err.message || "Une erreur est survenue",
  };
}

export function isFirebaseError(
  error: unknown,
): error is { code: string; message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}
