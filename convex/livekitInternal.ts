// convex/livekitInternal.ts

import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getUserByToken = internalQuery({
  args: {
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier),
      )
      .unique();
  },
});

export const getStreamForToken = internalQuery({
  args: {
    streamId: v.id("liveStreams"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.streamId);
  },
});
