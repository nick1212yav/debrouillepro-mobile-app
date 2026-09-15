import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel.d.ts";

// ─── Helper ─────────────────────────────────────────────────────────────────

async function getAuthUser(ctx: MutationCtx | QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ message: "Non authentifié", code: "UNAUTHENTICATED" });
  const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
  if (!user) throw new ConvexError({ message: "Utilisateur introuvable", code: "NOT_FOUND" });
  return user;
}

// ─── Get my AI preferences ───────────────────────────────────────────────────

export const getMyPreferences = query({
  args: {},
  handler: async (ctx): Promise<{
    _id: Id<"aiPreferences">;
    userId: Id<"users">;
    interests: string[];
    city?: string;
    language?: string;
    recommendedModules?: string[];
    recommendedTags?: string[];
    welcomeMessage?: string;
    updatedAt: string;
  } | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return null;
    return ctx.db.query("aiPreferences").withIndex("by_user", (q) => q.eq("userId", user._id)).unique();
  },
});

// ─── Save AI preferences + recommendations ───────────────────────────────────

export const savePreferences = mutation({
  args: {
    interests: v.array(v.string()),
    city: v.optional(v.string()),
    language: v.optional(v.string()),
    recommendedModules: v.optional(v.array(v.string())),
    recommendedTags: v.optional(v.array(v.string())),
    welcomeMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const now = new Date().toISOString();
    const existing = await ctx.db.query("aiPreferences").withIndex("by_user", (q) => q.eq("userId", user._id)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
    } else {
      await ctx.db.insert("aiPreferences", {
        userId: user._id,
        interests: args.interests,
        city: args.city,
        language: args.language,
        recommendedModules: args.recommendedModules,
        recommendedTags: args.recommendedTags,
        welcomeMessage: args.welcomeMessage,
        updatedAt: now,
      });
    }
  },
});
