import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

async function getUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
}

export const getMyRequests = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return [];
    return ctx.db.query("legalRequests").withIndex("by_user", (q) => q.eq("userId", user._id)).order("desc").take(50);
  },
});

export const createRequest = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) throw new ConvexError({ message: "Non authentifié", code: "UNAUTHENTICATED" });
    return ctx.db.insert("legalRequests", {
      userId: user._id,
      ...args,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  },
});

export const getRequest = query({
  args: { id: v.id("legalRequests") },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) return null;
    const req = await ctx.db.get(args.id);
    if (!req || req.userId !== user._id) return null;
    return req;
  },
});
