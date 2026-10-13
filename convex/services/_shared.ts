import type { Doc } from "../_generated/dataModel";

/**
 * Détermine si un prestataire peut être affiché dans les lectures publiques.
 *
 * Par défaut, les prestataires de démonstration restent masqués.
 * allowDemo doit être réservé aux écrans de développement/preview autorisés.
 */
export function isPubliclyVisible(
  provider: Doc<"serviceProviders">,
  allowDemo = false,
): boolean {
  if (provider.status !== "active") return false;

  if (provider.isDemo === true && !allowDemo) return false;

  return true;
}
