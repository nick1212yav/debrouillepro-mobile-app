import { ConvexError, v } from "convex/values";
import {
  mutation,
  query,
  type QueryCtx,
  type MutationCtx,
} from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

// ─────────────────────────────────────────────────────────────────────────────
// Helper — auth par tokenIdentifier (aligné sur users.getCurrentUser)
// ─────────────────────────────────────────────────────────────────────────────

async function getCurrentUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Utilisateur non authentifié",
    });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Utilisateur introuvable",
    });
  }

  return user;
}

// ─────────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────────

export const list = query({
  args: {},
  handler: async (ctx): Promise<Doc<"userActivity">[]> => {
    const user = await getCurrentUser(ctx);

    return await ctx.db
      .query("userActivity")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Trois métriques — chacune sur son propre index
// ─────────────────────────────────────────────────────────────────────────────

export const countUnread = query({
  args: {},
  handler: async (ctx): Promise<number> => {
    const user = await getCurrentUser(ctx);

    // by_user suffit : pas de filtre temporel.
    // Seuls les documents explicitement marqués read === false sont comptés.
    const rows = await ctx.db
      .query("userActivity")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(500);

    return rows.filter((r) => r.read === false).length;
  },
});

export const countToday = query({
  args: {},
  handler: async (ctx): Promise<number> => {
    const user = await getCurrentUser(ctx);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const rows = await ctx.db
      .query("userActivity")
      .withIndex("by_user_and_timestamp", (q) =>
        q.eq("userId", user._id).gte("timestamp", startOfDay.getTime()),
      )
      .take(500);

    return rows.length;
  },
});

export const countThisWeek = query({
  args: {},
  handler: async (ctx): Promise<number> => {
    const user = await getCurrentUser(ctx);

    const sevenDaysAgo = Date.now() - 7 * 86_400_000;

    const rows = await ctx.db
      .query("userActivity")
      .withIndex("by_user_and_timestamp", (q) =>
        q.eq("userId", user._id).gte("timestamp", sevenDaysAgo),
      )
      .take(500);

    return rows.length;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────

export const log = mutation({
  args: {
    type: v.union(
      v.literal("view_module"),
      v.literal("view_publication"),
      v.literal("search"),
      v.literal("create_publication"),
    ),
    label: v.string(),
    target: v.optional(v.string()),
    meta: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    await ctx.db.insert("userActivity", {
      userId: user._id,
      type: args.type,
      label: args.label,
      target: args.target,
      meta: args.meta,
      // Toujours renseigné à l'écriture — plus de fallback en lecture.
      timestamp: Date.now(),
      read: false,
    });
  },
});

export const markRead = mutation({
  args: {
    activityId: v.id("userActivity"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const activity = await ctx.db.get(args.activityId);
    if (!activity || activity.userId !== user._id) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Activité introuvable",
      });
    }

    await ctx.db.patch(args.activityId, { read: true });
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    // Bornage : on ne supprime que les 500 plus récentes pour éviter un
    // clear destructeur sur un historique long.
    const entries = await ctx.db
      .query("userActivity")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(500);

    for (const entry of entries) {
      await ctx.db.delete(entry._id);
    }
  },
});
