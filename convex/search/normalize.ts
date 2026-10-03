// convex/search/normalize.ts
//
// Normalisation des chaînes de recherche.
// Aucune dépendance Convex.

/* ============================================================================
 * STOPWORDS FRANÇAIS
 * ========================================================================== */

export const STOPWORDS: ReadonlySet<string> = new Set([
  // Articles
  "le",
  "la",
  "les",
  "un",
  "une",
  "des",
  "du",
  "de",
  "d",
  "l",
  "au",
  "aux",
  // Connecteurs
  "et",
  "ou",
  "pour",
  "par",
  "sur",
  "dans",
  "a",
  "avec",
  "sans",
  "vers",
  "chez",
  "sous",
  "sur",
  // Pronoms
  "je",
  "tu",
  "il",
  "elle",
  "on",
  "nous",
  "vous",
  "ils",
  "elles",
  "me",
  "te",
  "se",
  "moi",
  "toi",
  "lui",
  "leur",
  "leurs",
  "mon",
  "ma",
  "mes",
  "ton",
  "ta",
  "tes",
  "son",
  "sa",
  "ses",
  "notre",
  "nos",
  "votre",
  "vos",
  "ce",
  "cet",
  "cette",
  "ces",
  // Verbes faibles
  "est",
  "sont",
  "etait",
  "etaient",
  "suis",
  "es",
  "sommes",
  "etes",
  "ai",
  "as",
  "ont",
  "avons",
  "avez",
  "veux",
  "veut",
  "voulons",
  "voulez",
  "veulent",
  "peux",
  "peut",
  "pouvons",
  "pouvez",
  "peuvent",
  "voudrais",
  "aimerais",
  "souhaite",
  "souhaites",
  // Interrogatifs
  "quel",
  "quelle",
  "quels",
  "quelles",
  "qui",
  "que",
  "quoi",
  "ou",
  "quand",
  "comment",
  "pourquoi",
  // Divers
  "tres",
  "trop",
  "peu",
  "beaucoup",
  "plus",
  "moins",
  "bien",
  "mal",
  "tout",
  "tous",
  "toute",
  "toutes",
]);

/* ============================================================================
 * NORMALISATION
 * ========================================================================== */

/**
 * Normalise une chaîne pour la recherche :
 *   - retire les accents
 *   - lowercase
 *   - remplace les caractères non alphanumériques par des espaces
 *   - compacte les espaces
 */
export function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Découpe une chaîne normalisée en tokens.
 */
export function tokenize(value: string): string[] {
  return normalize(value).split(" ").filter(Boolean);
}

/**
 * Retourne les tokens utiles (sans stopwords, longueur >= 2).
 */
export function meaningfulTokens(tokens: string[]): string[] {
  return tokens.filter((t) => !STOPWORDS.has(t) && t.length >= 2);
}

/**
 * Concatène plusieurs champs textuels pour la recherche.
 * Utile si un jour on indexe un champ composite.
 */
export function concatFields(...values: (string | undefined | null)[]): string {
  return values
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .join(" ");
}
