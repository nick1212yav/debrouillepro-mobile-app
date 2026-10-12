// ============================================================================
// DÉBROUILLEPAY — ERROR UX
// ============================================================================
//
// Convertit une erreur inconnue en message utilisateur sûr.
//
// RÈGLES DE SÉCURITÉ
// ------------------
// 1. Aucune stack trace ne doit atteindre l'utilisateur.
// 2. Aucun message Convex brut ("[CONVEX A(...)] ...").
// 3. Aucun JSON interne / Request ID / chemin de fichier.
// 4. Aucun détail d'infrastructure (nom du provider, ligne de code).
//
// STRATÉGIE
// ---------
// On ne devine JAMAIS si un message "paraît propre".
// On utilise une allowlist de codes backend connus.
// Tout ce qui n'est pas dans l'allowlist retourne un fallback neutre.
//
// NOTE
// ----
// Convex reconstruit parfois ses erreurs côté React Native en `Error`
// générique. `error.data.code` n'est alors plus accessible directement.
// On cherche donc le code à deux endroits :
//   1. error.data.code      (chemin préféré)
//   2. substring dans error.message (fallback sûr : uniquement des
//      codes explicitement présents dans l'allowlist ci-dessous)
//
// ============================================================================

// ============================================================================
// ALLOWLIST — codes backend → messages UX
// ============================================================================

/**
 * Ne JAMAIS exposer le message brut du backend.
 * Seul un code stable déclenche un message UX ici.
 */
const USER_MESSAGES: Readonly<Record<string, string>> = Object.freeze({
  // --------------------------------------------------------------------------
  // Authentification / Autorisation
  // --------------------------------------------------------------------------
  UNAUTHENTICATED: "Connectez-vous pour continuer.",
  UNAUTHORIZED: "Vous n'avez pas l'autorisation d'effectuer cette action.",
  FORBIDDEN: "Vous n'avez pas l'autorisation d'effectuer cette action.",

  // --------------------------------------------------------------------------
  // Payments — Provider
  // --------------------------------------------------------------------------
  PROVIDER_NOT_CONFIGURED:
    "Ce moyen de paiement est temporairement indisponible.",
  PROVIDER_CAPABILITIES_UNAVAILABLE:
    "Ce moyen de paiement est temporairement indisponible.",
  PROVIDER_INVALID_RESPONSE: "Le paiement n'a pas pu être finalisé.",
  PROVIDER_TRANSACTION_FAILED: "Le paiement a été refusé.",
  PROVIDER_CANCELLED: "Le paiement a été annulé.",
  PROVIDER_REVERSED: "Le paiement a été annulé.",
  PROVIDER_UNKNOWN_ERROR: "Le paiement n'a pas pu aboutir.",

  // --------------------------------------------------------------------------
  // Payments — Payment Core
  // --------------------------------------------------------------------------
  PAYMENT_INTENT_NOT_FOUND: "Le paiement demandé est introuvable.",
  PAYMENT_NOT_STARTABLE: "Ce paiement ne peut plus être démarré.",
  PAYMENT_ALREADY_PROCESSED: "Ce paiement a déjà été traité.",
  PAYMENT_FAILED: "Le paiement n'a pas pu être effectué.",

  // --------------------------------------------------------------------------
  // Idempotence
  // --------------------------------------------------------------------------
  IDEMPOTENCY_KEY_CONFLICT: "Une opération identique est déjà en cours.",
  IDEMPOTENCY_PAYLOAD_MISMATCH:
    "Cette opération a déjà été initiée avec des paramètres différents.",

  // --------------------------------------------------------------------------
  // Validation
  // --------------------------------------------------------------------------
  INVALID_AMOUNT_PRECISION: "Le montant saisi est invalide.",
});

// ============================================================================
// DÉTECTION
// ============================================================================

type StructuredError = { code?: unknown; message?: unknown };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getStructuredData(error: unknown): StructuredError | null {
  if (!isObject(error)) return null;

  if ("data" in error) {
    const data = (error as Record<string, unknown>).data;
    if (isObject(data)) {
      return data as StructuredError;
    }
  }

  return null;
}

/**
 * Extrait un code backend depuis `data.code` ou, en fallback,
 * depuis `error.message` si un code connu y apparaît.
 *
 * Ne renvoie JAMAIS de message, uniquement un code.
 */
function getKnownCode(error: unknown): string | null {
  const data = getStructuredData(error);

  if (data && typeof data.code === "string" && data.code.length > 0) {
    return data.code;
  }

  if (error instanceof Error && error.message.length > 0) {
    for (const code of Object.keys(USER_MESSAGES)) {
      if (error.message.includes(code)) {
        return code;
      }
    }
  }

  return null;
}

// ============================================================================
// API PUBLIQUE
// ============================================================================

/**
 * Retourne un message utilisateur sûr.
 *
 * - Erreur backend avec code connu → message UX allowlisté.
 * - Erreur inconnue → fallback neutre (jamais de fuite technique).
 */
export function getUserFacingError(
  error: unknown,
  fallback = "Une erreur est survenue.",
): string {
  const code = getKnownCode(error);

  if (code && USER_MESSAGES[code]) {
    return USER_MESSAGES[code];
  }

  return fallback;
}

/**
 * Retourne uniquement le code backend connu, pour logs développeur.
 * N'expose jamais de message technique.
 */
export function getErrorCode(error: unknown): string | null {
  return getKnownCode(error);
}
