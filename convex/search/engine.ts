// convex/search/engine.ts
//
// ─── SEARCH ENGINE (ORCHESTRATEUR) ───────────────────────────────────────
//
// Rôle :
//   1. Parser la requête utilisateur
//   2. Résoudre les domaines concernés via le registry
//   3. Exécuter les sources en parallèle
//   4. Scorer + grouper + filtrer
//   5. Retourner une SearchResponse
//
// L'engine ne connaît NI Convex NI les implémentations de sources.
// Il consomme :
//   - les utilitaires purs (normalize, intent, entities, location, ranking)
//   - le registry (catalogue des modules)
//   - le SOURCE_REGISTRY (implémentations injectées)

import {
  GLOBAL_CITIES,
  GLOBAL_NEIGHBORHOODS,
  MODULE_REGISTRY,
  MODULE_BY_ID,
  getEntityEntries,
  getSourceIdsForDomains,
  resolveDomainsForEntities,
  resolveDomainsForKeywords,
} from "./registry";
import {
  buildEntityVocabulary,
  detectEntities,
  primaryEntity,
} from "./entities";
import {
  buildLocationVocabulary,
  detectLocations,
  primaryLocation,
} from "./location";
import { detectActions, primaryAction } from "./intent";
import { meaningfulTokens, normalize, tokenize } from "./normalize";
import { filterHits, rankHits } from "./ranking";
import { SOURCE_REGISTRY } from "./sources/index";
import type {
  ParsedIntent,
  RawSearchHit,
  ResultGroup,
  ScoredHit,
  SearchResponse,
} from "./types";

/* ============================================================================
 * VOCABULAIRES CONSTRUITS UNE FOIS
 * ========================================================================== */

/**
 * Vocabulaire d'entités dérivé du registre.
 * Construit une fois au chargement du module.
 */
const ENTITY_VOCABULARY = buildEntityVocabulary(getEntityEntries());

/**
 * Vocabulaire de localisation.
 */
const LOCATION_VOCABULARY = buildLocationVocabulary(
  GLOBAL_CITIES,
  GLOBAL_NEIGHBORHOODS,
);

/* ============================================================================
 * PARSING
 * ========================================================================== */

/**
 * Parse une requête utilisateur en ParsedIntent.
 * Orchestre les modules normalize, intent, entities, location.
 */
export function parseIntent(rawQuery: string): ParsedIntent {
  const normalized = normalize(rawQuery);
  const tokens = tokenize(rawQuery);
  const usefulTokens = meaningfulTokens(tokens);

  const actions = detectActions(rawQuery);
  const entities = detectEntities(rawQuery, ENTITY_VOCABULARY);
  const locations = detectLocations(rawQuery, LOCATION_VOCABULARY);

  // Résolution des domaines par entités + par mots-clés
  const domainsFromEntities = resolveDomainsForEntities(entities);
  const domainsFromKeywords = resolveDomainsForKeywords(usefulTokens);

  const mergedDomains = Array.from(
    new Set([...domainsFromEntities, ...domainsFromKeywords]),
  );

  // Tri des domaines par priorité (registry)
  mergedDomains.sort((a, b) => {
    const pa = MODULE_BY_ID.get(a)?.priority ?? 0;
    const pb = MODULE_BY_ID.get(b)?.priority ?? 0;
    return pb - pa;
  });

  return {
    raw: rawQuery,
    normalized,
    tokens,
    meaningfulTokens: usefulTokens,
    actions,
    primaryAction: primaryAction(actions),
    entities,
    primaryEntity: primaryEntity(entities),
    locations,
    primaryLocation: primaryLocation(locations),
    domains: mergedDomains,
  };
}

/* ============================================================================
 * EXECUTION
 * ========================================================================== */

interface SourceExecution {
  domain: string;
  hits: RawSearchHit[];
}

async function executeSources(
  ctx: any,
  intent: ParsedIntent,
  sourceIds: string[],
  term: string,
  limitPerSource: number,
): Promise<SourceExecution[]> {
  return Promise.all(
    sourceIds.map(async (sid): Promise<SourceExecution> => {
      const adapter = SOURCE_REGISTRY.get(sid);
      if (!adapter) {
        // Source non encore branchée : skip silencieux
        return { domain: "", hits: [] };
      }

      try {
        const hits = await adapter.search(ctx, intent, term, limitPerSource);
        return { domain: adapter.domain, hits };
      } catch (err) {
        // Une source en échec ne casse pas tout le moteur
        console.warn(
          `[engine] source "${sid}" failed:`,
          err instanceof Error ? err.message : err,
        );
        return { domain: adapter.domain, hits: [] };
      }
    }),
  );
}

/* ============================================================================
 * GROUPING + SCORING
 * ========================================================================== */

function buildGroups(
  executions: SourceExecution[],
  intent: ParsedIntent,
): ResultGroup[] {
  // 1. Regrouper les hits par domaine
  const byDomain = new Map<string, RawSearchHit[]>();
  for (const { domain, hits } of executions) {
    if (!domain || hits.length === 0) continue;
    const list = byDomain.get(domain) ?? [];
    list.push(...hits);
    byDomain.set(domain, list);
  }

  // 2. Scorer + filtrer + dédupliquer + construire les groupes
  const groups: ResultGroup[] = [];

  for (const [domain, hits] of byDomain.entries()) {
    const mod = MODULE_BY_ID.get(domain);
    if (!mod) continue;

    const scored = filterHits(rankHits(hits, intent, domain));
    if (scored.length === 0) continue;

    // Déduplication par id
    const seen = new Set<string>();
    const unique: ScoredHit[] = [];
    for (const hit of scored) {
      if (!seen.has(hit.id)) {
        seen.add(hit.id);
        unique.push(hit);
      }
    }

    groups.push({
      domain,
      label: mod.label,
      route: mod.route,
      color: mod.color,
      description: mod.description,
      totalCount: unique.length,
      topResults: unique.slice(0, 5),
    });
  }

  // 3. Tri des groupes : total desc, puis priorité desc
  groups.sort((a, b) => {
    if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
    const pa = MODULE_BY_ID.get(a.domain)?.priority ?? 0;
    const pb = MODULE_BY_ID.get(b.domain)?.priority ?? 0;
    return pb - pa;
  });

  return groups;
}

/* ============================================================================
 * POINT D'ENTRÉE PRINCIPAL
 * ========================================================================== */

export interface RunSearchOptions {
  limitPerSource?: number;
}

export async function runSearch(
  ctx: any,
  rawQuery: string,
  options: RunSearchOptions = {},
): Promise<SearchResponse> {
  const limitPerSource = options.limitPerSource ?? 12;

  // 1. Parse
  const intent = parseIntent(rawQuery);

  // Requête trop courte : on retourne vide
  if (intent.meaningfulTokens.length === 0) {
    return {
      parsed: intent,
      groups: [],
      totalCount: 0,
    };
  }

  // 2. Résoudre les domaines à interroger
  //
  //   - Si l'intent a des domaines → on les utilise
  //   - Sinon → on interroge TOUS les modules du registry (fallback)
  const targetDomains =
    intent.domains.length > 0
      ? intent.domains
      : MODULE_REGISTRY.map((m) => m.id);

  const sourceIds = getSourceIdsForDomains(targetDomains);

  if (sourceIds.length === 0) {
    // Aucune source branchée pour ces domaines
    return {
      parsed: intent,
      groups: [],
      totalCount: 0,
    };
  }

  // 3. Terme de recherche passé aux search indexes
  //
  //   On privilégie les tokens utiles. Si vide → requête normalisée.
  const searchTerm =
    intent.meaningfulTokens.length > 0
      ? intent.meaningfulTokens.join(" ")
      : intent.normalized;

  // 4. Exécution
  const executions = await executeSources(
    ctx,
    intent,
    sourceIds,
    searchTerm,
    limitPerSource,
  );

  // 5. Groupes
  const groups = buildGroups(executions, intent);

  const totalCount = groups.reduce((sum, g) => sum + g.totalCount, 0);

  return {
    parsed: intent,
    groups,
    totalCount,
  };
}
