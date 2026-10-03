// convex/search/sources/jobListings.ts

import type { RawSearchHit, SourceAdapter } from "../types";

const CONTRACT_LABEL: Record<string, string> = {
  cdi: "CDI",
  cdd: "CDD",
  stage: "Stage",
  freelance: "Freelance",
  alternance: "Alternance",
  benevole: "Bénévolat",
};

export const jobListingsSource: SourceAdapter = {
  id: "jobListings",
  domain: "jobs",

  async search(ctx, intent, term, limit): Promise<RawSearchHit[]> {
    const q = term.trim();
    if (!q) return [];

    const results = await ctx.db
      .query("jobListings")
      .withSearchIndex("search_jobs", (s: any) =>
        s.search("title", q).eq("status", "open"),
      )
      .take(limit);

    return results.map((d: any): RawSearchHit => {
      const subtitleParts = [d.company, d.city].filter(Boolean);
      const contract = d.contractType as string | undefined;
      const label = contract ? (CONTRACT_LABEL[contract] ?? contract) : "Job";

      return {
        id: `job-${d._id}`,
        title: d.title ?? "Offre d'emploi",
        subtitle: subtitleParts.join(" – ") || "Emploi",
        meta: label,
        badge: label,
        badgeColor: "#A78BFA",
        route: "jobs",
        fields: {
          title: d.title ?? "",
          description: d.description,
          city: d.city,
          category: d.category,
          type: contract,
        },
      };
    });
  },
};
