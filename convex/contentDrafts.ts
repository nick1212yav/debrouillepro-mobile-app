import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const listMyDrafts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ message: "User not logged in", code: "UNAUTHENTICATED" });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });
    }

    const drafts = await ctx.db
      .query("contentDrafts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Sort by savedAt descending and take up to 20
    drafts.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
    return drafts.slice(0, 20);
  },
});

export const saveDraft = mutation({
  args: {
    title: v.string(),
    html: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ message: "User not logged in", code: "UNAUTHENTICATED" });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });
    }

    // Upsert: look for an existing draft with same title for this user
    const existing = await ctx.db
      .query("contentDrafts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const match = existing.find((d) => d.title === args.title);
    const now = new Date().toISOString();

    if (match) {
      await ctx.db.patch(match._id, {
        html: args.html,
        savedAt: now,
      });
      return match._id;
    }

    const id = await ctx.db.insert("contentDrafts", {
      userId: user._id,
      title: args.title,
      html: args.html,
      savedAt: now,
    });
    return id;
  },
});

export const deleteDraft = mutation({
  args: {
    draftId: v.id("contentDrafts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ message: "User not logged in", code: "UNAUTHENTICATED" });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });
    }

    const draft = await ctx.db.get(args.draftId);
    if (!draft) {
      throw new ConvexError({ message: "Draft not found", code: "NOT_FOUND" });
    }

    if (draft.userId !== user._id) {
      throw new ConvexError({ message: "Not your draft", code: "FORBIDDEN" });
    }

    await ctx.db.delete(args.draftId);
  },
});
