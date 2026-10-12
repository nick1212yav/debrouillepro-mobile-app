import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

const SEED_CATEGORIES = [
  { slug: "depannage", name: "Dépannage", order: 1 },
  { slug: "education", name: "Éducation", order: 2 },
  { slug: "beaute", name: "Beauté", order: 3 },
  { slug: "bien-etre", name: "Bien-être", order: 4 },
  { slug: "livraison", name: "Livraison", order: 5 },
  { slug: "photo", name: "Photo", order: 6 },
];

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("serviceCategories")
      .withIndex("by_active_and_order", (q) => q.eq("active", true))
      .collect();
  },
});

export const listSubcategories = query({
  args: { categoryId: v.id("serviceCategories") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("serviceSubcategories")
      .withIndex("by_category_and_order", (q) =>
        q.eq("categoryId", args.categoryId),
      )
      .collect();
  },
});

export const seedCategories = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("serviceCategories").take(1);
    if (existing.length > 0) {
      return { seeded: false, reason: "already_seeded" };
    }

    const now = Date.now();

    for (const cat of SEED_CATEGORIES) {
      await ctx.db.insert("serviceCategories", {
        slug: cat.slug,
        name: cat.name,
        order: cat.order,
        active: true,
        createdAt: now,
      });
    }

    return { seeded: true, count: SEED_CATEGORIES.length };
  },
});
