import { query } from "../_generated/server";
import { v } from "convex/values";

// Search V2 — adapter Services
// N'utilise QUE des index. Aucun scan complet.
export const searchServices = query({
  args: {
    search: v.optional(v.string()),
    category: v.optional(v.string()),
    verified: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const term = (args.search ?? "").trim();

    // ── Cas 1 : pas de terme → requête indexée ──
    if (term.length === 0) {
      let results;

      if (args.category) {
        // Index by_category_and_status : premier champ = category
        results = await ctx.db
          .query("serviceProviders")
          .withIndex("by_category_and_status", (q) =>
            q.eq("category", args.category!).eq("status", "active"),
          )
          .take(limit * 3);
      } else {
        // Index by_status : premier champ = status
        results = await ctx.db
          .query("serviceProviders")
          .withIndex("by_status", (q) => q.eq("status", "active"))
          .take(limit * 3);
      }

      return results.filter((p) => p.isDemo !== true).slice(0, limit);
    }

    // ── Cas 2 : terme textuel → searchIndex ──
    const results = await ctx.db
      .query("serviceProviders")
      .withSearchIndex("search_services", (q) => {
        const base = q.search("searchText", term).eq("status", "active");
        if (args.category) return base.eq("category", args.category);
        return base;
      })
      .take(limit * 3);

    return results
      .filter((p) => {
        if (p.isDemo === true) return false;
        if (args.verified !== undefined && p.verified !== args.verified) {
          return false;
        }
        return true;
      })
      .slice(0, limit);
  },
});
