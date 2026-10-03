// convex/search/entities.ts
//
// Détection des entités métier (maison, voiture, plombier…) dans une requête.
//
// ⚠️ Ce fichier contient un vocabulaire INITIAL minimal.
// Chaque module finalisé viendra enrichir ce vocabulaire via le registry.
// Le core ne connaît pas les entités : il les demande au registry.

import { normalize, tokenize } from "./normalize";

/* ============================================================================
 * CONTEXTE D'ENTITÉS
 * ========================================================================== */

/**
 * Vocabulaire fourni par le registry au moment de la résolution.
 */
export interface EntityVocabulary {
  /** Entité canonique → synonymes */
  byEntity: Map<string, string[]>;

  /** Synonyme normalisé → entité canonique */
  reverseIndex: Map<string, string>;
}

/**
 * Construit un vocabulaire d'entités à partir d'une liste plate de
 * couples { entity, synonyms }.
 *
 * Chaque module du registry fournit ses entités, et on agrège ici.
 */
export function buildEntityVocabulary(
  entries: Array<{ entity: string; synonyms: string[] }>,
): EntityVocabulary {
  const byEntity = new Map<string, string[]>();
  const reverseIndex = new Map<string, string>();

  for (const { entity, synonyms } of entries) {
    const canonical = normalize(entity);
    if (!canonical) continue;

    const normalizedSynonyms = synonyms.map(normalize).filter(Boolean);

    byEntity.set(canonical, normalizedSynonyms);

    // L'entité elle-même pointe vers elle-même
    reverseIndex.set(canonical, canonical);
    for (const syn of normalizedSynonyms) {
      reverseIndex.set(syn, canonical);
    }
  }

  return { byEntity, reverseIndex };
}

/* ============================================================================
 * DÉTECTION
 * ========================================================================== */

/**
 * Détecte les entités présentes dans une requête.
 * Retourne les entités canoniques normalisées.
 */
export function detectEntities(
  rawQuery: string,
  vocabulary: EntityVocabulary,
): string[] {
  const normalized = normalize(rawQuery);
  const tokens = tokenize(rawQuery);
  const found = new Set<string>();

  // 1. Match sur tokens simples
  for (const token of tokens) {
    const canonical = vocabulary.reverseIndex.get(token);
    if (canonical) found.add(canonical);
  }

  // 2. Match sur entités composées ("logement social", "salle de bain"…)
  for (const [entity, synonyms] of vocabulary.byEntity) {
    if (entity.includes(" ") && normalized.includes(entity)) {
      found.add(entity);
    }
    for (const syn of synonyms) {
      if (syn.includes(" ") && normalized.includes(syn)) {
        found.add(entity);
      }
    }
  }

  return Array.from(found);
}

/**
 * Entité principale : première détectée.
 */
export function primaryEntity(entities: string[]): string | null {
  return entities[0] ?? null;
}
