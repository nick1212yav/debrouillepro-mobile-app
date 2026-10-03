export function getPhoneErrorMessage(error: unknown): string {
  const err =
    typeof error === "object" && error !== null
      ? (error as { code?: unknown; message?: unknown })
      : {};

  const code =
    typeof err.code === "string" && err.code.trim() ? err.code : "auth/unknown";

  const messages: Record<string, string> = {
    "auth/invalid-phone-number": "Numéro de téléphone invalide",
    "auth/too-many-requests":
      "Trop de tentatives, veuillez réessayer plus tard",
    "auth/network-request-failed":
      "Problème de réseau, vérifiez votre connexion",
    "auth/session-expired": "La session a expiré, veuillez réessayer",
    "auth/code-expired": "Le code a expiré, demandez-en un nouveau",
    "auth/invalid-verification-code": "Code incorrect, veuillez réessayer",
    "auth/missing-verification-code": "Veuillez entrer le code reçu par SMS",
    "auth/unknown": "Une erreur est survenue",
  };

  const fallbackMessage =
    typeof err.message === "string" && err.message.trim()
      ? err.message
      : "Une erreur est survenue";

  return messages[code] ?? fallbackMessage;
}

export const PHONE_VALIDATION = {
  minLength: 7,
  maxLength: 15,
} as const;
