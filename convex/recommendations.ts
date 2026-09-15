import { v } from "convex/values";
import { query } from "./_generated/server";

export const getSimilar = query({
  args: {
    publicationId: v.id("publications"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const pub = await ctx.db.get(args.publicationId);
    if (!pub) return [];

    let query = ctx.db
      .query("publications")
      .withIndex("by_status", (q) => q.eq("status", "active"));
    if (pub.category) {
      query = query.filter((q) => q.eq(q.field("category"), pub.category));
    }
    const results = await query.take(args.limit || 6);
    const withImages = await Promise.all(
      results.map(async (p) => {
        const resolvedImages = await Promise.all(
          p.images.map(async (imgId) => {
            if (imgId.startsWith("http")) return imgId;
            try {
              return (
                (await ctx.storage.getUrl(imgId as `kg${string}`)) ?? imgId
              );
            } catch {
              return imgId;
            }
          }),
        );
        return { ...p, images: resolvedImages };
      }),
    );
    return withImages.filter((p) => p._id !== args.publicationId);
  },
});
