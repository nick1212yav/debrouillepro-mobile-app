import { query } from "./_generated/server";

export const getMyActiveProject = query({
  args: {},

  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return null;
    }

    const project = await ctx.db
      .query("projectTrackings")
      .withIndex("by_user_and_active", (q) =>
        q.eq("userId", user._id).eq("isActive", true),
      )
      .order("desc")
      .first();

    return project;
  },
});
