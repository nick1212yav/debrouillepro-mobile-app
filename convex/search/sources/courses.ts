// convex/search/sources/courses.ts

import type { RawSearchHit, SourceAdapter } from "../types";

export const coursesSource: SourceAdapter = {
  id: "courses",
  domain: "apprendre",

  async search(ctx, intent, term, limit): Promise<RawSearchHit[]> {
    const q = term.trim();
    if (!q) return [];

    const results = await ctx.db
      .query("courses")
      .withSearchIndex("search_courses", (s: any) =>
        s.search("title", q).eq("status", "published"),
      )
      .take(limit);

    return results.map((d: any): RawSearchHit => {
      const meta = d.isFree
        ? "Gratuit"
        : typeof d.price === "number"
          ? `${d.price.toLocaleString()} ${d.currency ?? "FCFA"}`
          : undefined;

      return {
        id: `course-${d._id}`,
        title: d.title ?? "Formation",
        subtitle: d.category ?? "Formation",
        meta,
        badge: "Cours",
        badgeColor: "#22D3EE",
        route: "cours",
        fields: {
          title: d.title ?? "",
          description: d.description,
          category: d.category,
          type: d.level,
        },
      };
    });
  },
};
