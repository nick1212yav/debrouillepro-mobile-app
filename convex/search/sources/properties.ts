// convex/search/sources/properties.ts

import type { RawSearchHit, SourceAdapter } from "../types";

const TRANSACTION_LABEL: Record<string, string> = {
  location: "À louer",
  vente: "À vendre",
};

export const propertiesSource: SourceAdapter = {
  id: "properties",
  domain: "immo",

  async search(ctx, intent, term, limit): Promise<RawSearchHit[]> {
    const q = term.trim();
    if (!q) return [];

    const results = await ctx.db
      .query("properties")
      .withSearchIndex("search_properties", (s: any) =>
        s.search("title", q).eq("status", "available"),
      )
      .take(limit);

    return results.map((d: any): RawSearchHit => {
      const subtitleParts = [d.type, d.city].filter(Boolean);
      const meta =
        typeof d.price === "number"
          ? `${d.price.toLocaleString()} ${d.currency ?? "FCFA"}`
          : undefined;

      return {
        id: `prop-${d._id}`,
        title: d.title ?? "Bien immobilier",
        subtitle: subtitleParts.join(" – ") || "Immobilier",
        meta,
        badge: TRANSACTION_LABEL[d.transactionType] ?? "Bien",
        badgeColor: "#34D399",
        route: "immo",
        fields: {
          title: d.title ?? "",
          description: d.description,
          city: d.city,
          type: d.type,
          category: d.transactionType,
        },
      };
    });
  },
};
