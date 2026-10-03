// convex/search/ranking.ts
//
// Scoring des résultats de recherche.

import type { ParsedIntent, RawSearchHit, ScoredHit } from "./types";
import { normalize } from "./normalize";

/* ============================================================================
 * POIDS DE SCORING
 * ========================================================================== */

export const SCORE_WEIGHTS = {
  /** La requête complète apparaît exactement dans le titre */
  exactPhraseInTitle: 100,

  /** Une entité apparaît dans le titre */
  entityInTitle: 60,

  /** Une action apparaît dans le titre */
  actionInTitle: 50,

  /** La localisation correspond au champ city */
  locationInCity: 40,

  /** La localisation apparaît dans le titre */
  locationInTitle: 35,

  /** Un token utile apparaît dans le titre */
  tokenInTitle: 35,

  /** Un token utile apparaît dans la description */
  tokenInDescription: 20,

  /** Un token utile apparaît dans les tags */
  tokenInTags: 15,

  /** Bonus de base (résultat existant = mieux que rien) */
  baseHit: 10,
} as const;

/* ============================================================================
 * SCORING D'UN HIT
 * ========================================================================== */

/**
 * Calcule le score d'un hit par rapport à l'intention parsée.
 *
 * Ne connaît pas Convex : travaille uniquement sur les champs textuels
 * fournis par la source adapter.
 */
export function scoreHit(hit: RawSearchHit, intent: ParsedIntent): number {
  let score = SCORE_WEIGHTS.baseHit;

  const title = normalize(hit.fields.title ?? "");
  const description = normalize(hit.fields.description ?? "");
  const tags = (hit.fields.tags ?? []).map(normalize);
  const city = normalize(hit.fields.city ?? "");

  // ── 1. Phrase exacte dans le titre
  if (intent.normalized.length >= 3 && title.includes(intent.normalized)) {
    score += SCORE_WEIGHTS.exactPhraseInTitle;
  }

  // ── 2. Entités dans le titre
  for (const entity of intent.entities) {
    const e = normalize(entity);
    if (e && title.includes(e)) {
      score += SCORE_WEIGHTS.entityInTitle;
    }
  }

  // ── 3. Actions dans le titre
  for (const action of intent.actions) {
    const a = normalize(action);
    if (a && title.includes(a)) {
      score += SCORE_WEIGHTS.actionInTitle;
    }
  }

  // ── 4. Localisation dans le champ city
  for (const loc of intent.locations) {
    const l = normalize(loc);
    if (l && city.includes(l)) {
      score += SCORE_WEIGHTS.locationInCity;
      break;
    }
  }

  // ── 5. Localisation dans le titre
  for (const loc of intent.locations) {
    const l = normalize(loc);
    if (l && title.includes(l)) {
      score += SCORE_WEIGHTS.locationInTitle;
      break;
    }
  }

  // ── 6. Tokens utiles dans titre / description / tags
  for (const token of intent.meaningfulTokens) {
    if (title.includes(token)) {
      score += SCORE_WEIGHTS.tokenInTitle;
    } else if (description.includes(token)) {
      score += SCORE_WEIGHTS.tokenInDescription;
    } else if (tags.some((t) => t.includes(token))) {
      score += SCORE_WEIGHTS.tokenInTags;
    }
  }

  return score;
}

/* ============================================================================
 * APPLICATION AU LOT
 * ========================================================================== */

/**
 * Score un lot de hits et retourne une liste triée (desc).
 */
export function rankHits(
  hits: RawSearchHit[],
  intent: ParsedIntent,
  domain: string,
): ScoredHit[] {
  const scored: ScoredHit[] = hits.map((hit) => ({
    ...hit,
    domain,
    score: scoreHit(hit, intent),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored;
}

/**
 * Filtre les hits trop faibles (score de base uniquement).
 */
export function filterHits(
  hits: ScoredHit[],
  minScore: number = SCORE_WEIGHTS.baseHit + 1,
): ScoredHit[] {
  return hits.filter((h) => h.score >= minScore);
}
