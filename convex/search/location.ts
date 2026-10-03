// convex/search/location.ts
//
// Détection des localisations (villes, quartiers) dans une requête.

import { normalize, tokenize, STOPWORDS } from "./normalize";

/* ============================================================================
 * VOCABULAIRE DE LOCALISATION
 * ========================================================================== */

/**
 * Vocabulaire fourni par le registry.
 * Permet à chaque module d'enrichir la liste des villes connues.
 */
export interface LocationVocabulary {
  cities: ReadonlySet<string>;
  neighborhoods: ReadonlySet<string>;
}

/**
 * Construit un vocabulaire de localisation à partir de listes.
 */
export function buildLocationVocabulary(
  cities: string[],
  neighborhoods: string[] = [],
): LocationVocabulary {
  return {
    cities: new Set(cities.map(normalize)),
    neighborhoods: new Set(neighborhoods.map(normalize)),
  };
}

/* ============================================================================
 * MOTS-CLÉS DE DIRECTION
 * ========================================================================== */

const DIRECTION_WORDS = new Set([
  "a",
  "au",
  "aux",
  "vers",
  "sur",
  "dans",
  "chez",
  "pres",
  "proche",
  "pres-de",
  "autour",
  "autour-de",
]);

/* ============================================================================
 * DÉTECTION
 * ========================================================================== */

/**
 * Détecte les localisations dans une requête.
 * Retourne une liste de chaînes canonicalisées.
 */
export function detectLocations(
  rawQuery: string,
  vocabulary: LocationVocabulary,
): string[] {
  const normalized = normalize(rawQuery);
  const tokens = tokenize(rawQuery);
  const found = new Set<string>();

  // 1. Villes connues (mots simples)
  for (const token of tokens) {
    if (vocabulary.cities.has(token)) {
      found.add(capitalize(token));
    }
  }

  // 2. Quartiers connus (mots simples ou composés)
  for (const token of tokens) {
    if (vocabulary.neighborhoods.has(token)) {
      found.add(capitalize(token));
    }
  }

  // 3. Pattern "à X", "vers X", "sur X", "dans X"
  // → capture le mot suivant comme localisation potentielle
  const rawTokens = normalized.split(" ");
  for (let i = 0; i < rawTokens.length - 1; i++) {
    if (DIRECTION_WORDS.has(rawTokens[i])) {
      const candidate = rawTokens[i + 1];
      if (
        candidate &&
        candidate.length >= 3 &&
        !STOPWORDS.has(candidate) &&
        !DIRECTION_WORDS.has(candidate)
      ) {
        // On ne remplace pas une ville connue déjà trouvée
        if (!isKnownCity(candidate, vocabulary)) {
          found.add(capitalize(candidate));
        }
      }
    }
  }

  // 4. Pattern "de X à Y" → récupère Y comme destination
  // (utile pour "billet de Kolwezi à Lubumbashi")
  for (let i = 0; i < rawTokens.length - 2; i++) {
    if (rawTokens[i] === "de" && rawTokens[i + 2] === "a") {
      const dest = rawTokens[i + 3];
      if (dest && dest.length >= 3) {
        found.add(capitalize(dest));
      }
    }
  }

  return Array.from(found);
}

/**
 * Localisation principale : première détectée.
 */
export function primaryLocation(locations: string[]): string | null {
  return locations[0] ?? null;
}

/* ============================================================================
 * UTILS
 * ========================================================================== */

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function isKnownCity(
  candidate: string,
  vocabulary: LocationVocabulary,
): boolean {
  return vocabulary.cities.has(candidate);
}
