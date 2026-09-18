// convex/lib/userSearch.ts

/**
 * Source unique de vérité pour le texte indexé des profils utilisateurs.
 *
 * IMPORTANT :
 * - Ne jamais inclure email, téléphone, UID ou tokenIdentifier.
 * - Ne jamais inclure permissions ou informations administratives.
 * - Ce champ est destiné à la découverte publique de profils.
 */

export type UserSearchInput = {
  name?: string | null;
  bio?: string | null;
  city?: string | null;
  country?: string | null;
  profession?: string | null;
  interests?: readonly string[] | null;
  roles?: readonly string[] | null;
};

function clean(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function cleanList(values: readonly string[] | null | undefined): string[] {
  if (!values) {
    return [];
  }

  return values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

/**
 * Construit le document texte utilisé par l'index Search de Convex.
 *
 * On conserve les accents et la casse d'origine autant que possible :
 * Convex Search gère lui-même la recherche textuelle.
 */
export function buildUserSearchText(user: UserSearchInput): string {
  const values = [
    clean(user.name),
    clean(user.bio),
    clean(user.city),
    clean(user.country),
    clean(user.profession),
    ...cleanList(user.interests),
    ...cleanList(user.roles),
  ];

  return Array.from(
    new Set(
      values
        .map((value) => value.replace(/\s+/g, " ").trim())
        .filter((value) => value.length > 0),
    ),
  ).join(" ");
}

/**
 * Normalisation minimale de la requête utilisateur.
 */
export function normalizeUserSearchQuery(query: string): string {
  return query.replace(/\s+/g, " ").trim().slice(0, 100);
}
