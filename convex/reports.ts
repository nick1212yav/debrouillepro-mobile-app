import { v, ConvexError } from "convex/values";
import { mutation } from "./_generated/server";
import { requireUser } from "./publications";

export const reportPublication = mutation({
  args: {
    publicationId: v.id("publications"),
    reason: v.union(
      v.literal("spam"),
      v.literal("inappropriate"),
      v.literal("fake"),
      v.literal("harassment"),
      v.literal("other"),
    ),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await ctx.db.insert("contentFlags", {
      publicationId: args.publicationId,
      contentType: "publication",
      reportedBy: user._id,
      reason: args.reason,
      note: args.note,
      resolved: false,
    });
    const pub = await ctx.db.get(args.publicationId);
    if (pub) {
      await ctx.db.patch(args.publicationId, {
        flagCount: (pub.flagCount || 0) + 1,
      });
    }
    return { success: true };
  },
});
