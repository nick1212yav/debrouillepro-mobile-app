import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Internal mutation to log AI interactions (must be in V8 runtime, not "use node")
export const saveInteraction = internalMutation({
  args: {
    userId: v.string(),   // tokenIdentifier – resolved to user._id inside
    type: v.union(
      v.literal("chat"), v.literal("generate_content"), v.literal("analyze_image"),
      v.literal("moderate_text"), v.literal("suggest_tags"), v.literal("translate"),
      v.literal("personalize"),
    ),
    input: v.string(),
    output: v.string(),
    model: v.string(),
    durationMs: v.optional(v.number()),
    moduleContext: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.userId))
      .unique();
    if (!user) return;
    await ctx.db.insert("aiInteractions", {
      userId: user._id,
      type: args.type,
      input: args.input,
      output: args.output,
      model: args.model,
      durationMs: args.durationMs,
      moduleContext: args.moduleContext,
    });
  },
});
