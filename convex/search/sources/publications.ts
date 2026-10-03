// convex/search/sources/publications.ts
//
// Source multi-type. Le filtrage par type est piloté par l'intention détectée.
//
// Règles :
//   intent.domains contient "immo"      → types ["immo", "hebergement"]
//   intent.domains contient "jobs"      → types ["job"]
//   intent.domains contient "apprendre" → types ["education"]
//   intent.domains = ["publications"]   → aucun filtre (toutes)
//   intent.domains vide                 → aucun filtre (toutes)

import type { ParsedIntent, RawSearchHit, SourceAdapter } from "../types";

/* ============================================================================
 * MAPPING domaine → types de publication
 * ========================================================================== */

const DOMAIN_TO_PUBLICATION_TYPES: Record<string, string[]> = {
  immo: ["immo", "hebergement"],
  jobs: ["job"],
  apprendre: ["education"],
};

/* ============================================================================
 * MAPPING type → route / couleur
 * ========================================================================== */

const TYPE_TO_ROUTE: Record<string, string> = {
  immo: "immo",
  hebergement: "hebergement",
  annonce: "annonces",
  job: "jobs",
  service: "services",
  evenement: "evenements",
  community: "community",
  agri: "agri",
  sante: "sante",
  transport: "transport",
  marketplace: "marketplace",
  voyages: "voyages",
  business: "business",
  education: "cours",
  media: "media",
  video: "media",
  article: "media",
  groupes: "groupes",
  network: "network",
  ong: "ong",
  justice: "juridique",
  restauration: "restauration",
  energie: "energie",
  environnement: "environnement",
  finance: "finances",
  creator: "profile",
  sondage: "community",
};

const TYPE_TO_COLOR: Record<string, string> = {
  immo: "#34D399",
  hebergement: "#34D399",
  annonce: "#FBBF24",
  job: "#A78BFA",
  service: "#818CF8",
  evenement: "#F472B6",
  community: "#FB7185",
  agri: "#A3E635",
  sante: "#F87171",
  transport: "#FB923C",
  marketplace: "#F472B6",
  voyages: "#818CF8",
  business: "#FB923C",
  education: "#22D3EE",
  media: "#FB923C",
  video: "#FB923C",
  article: "#FB923C",
  groupes: "#FB7185",
  network: "#A78BFA",
  ong: "#34D399",
  justice: "#A78BFA",
  restauration: "#FB923C",
  energie: "#FBBF24",
  environnement: "#A3E635",
  finance: "#34D399",
  creator: "#A78BFA",
  sondage: "#FB7185",
};

/* ============================================================================
 * HELPERS
 * ========================================================================== */

/**
 * Détermine quels types de publications rechercher selon l'intention.
 * Retourne [] si aucun filtre ne doit être appliqué.
 */
function resolvePublicationTypes(intent: ParsedIntent): string[] {
  const types = new Set<string>();
  for (const domain of intent.domains) {
    if (domain === "publications") continue;
    const mapped = DOMAIN_TO_PUBLICATION_TYPES[domain];
    if (mapped) {
      for (const t of mapped) types.add(t);
    }
  }
  return Array.from(types);
}

function mapDoc(d: any): RawSearchHit {
  const type = String(d.type ?? "annonce").toLowerCase();

  return {
    id: `pub-${d._id}`,
    title: d.title ?? "Publication",
    subtitle: d.location ?? d.category ?? type,
    meta: typeof d.price === "string" ? d.price : undefined,
    badge: type,
    badgeColor: TYPE_TO_COLOR[type] ?? "#FBBF24",
    route: TYPE_TO_ROUTE[type] ?? "annonces",
    fields: {
      title: d.title ?? "",
      description: d.description,
      tags: Array.isArray(d.tags) ? d.tags : undefined,
      city: d.location,
      category: d.category,
      type,
    },
  };
}

/* ============================================================================
 * SOURCE
 * ========================================================================== */

export const publicationsSource: SourceAdapter = {
  id: "publications",
  domain: "publications",

  async search(ctx, intent, term, limit): Promise<RawSearchHit[]> {
    const q = term.trim();
    if (!q) return [];

    const types = resolvePublicationTypes(intent);

    // ─── Cas 1 : aucun filtre → toutes les publications actives
    if (types.length === 0) {
      const results = await ctx.db
        .query("publications")
        .withSearchIndex("search_publications", (s: any) =>
          s.search("title", q).eq("status", "active"),
        )
        .take(limit);

      return results.map(mapDoc);
    }

    // ─── Cas 2 : filtre par type → une query par type, en parallèle
    //
    // ⚠️ Les search indexes Convex ne supportent pas OR sur les filtres.
    //    On doit donc lancer une query par type et fusionner.
    const batches = await Promise.all(
      types.map((type) =>
        ctx.db
          .query("publications")
          .withSearchIndex("search_publications", (s: any) =>
            s.search("title", q).eq("status", "active").eq("type", type),
          )
          .take(limit),
      ),
    );

    const merged = batches.flat().slice(0, limit);
    return merged.map(mapDoc);
  },
};
