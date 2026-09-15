// convex/badges.ts
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel.d.ts";

// ── Badge definitions ─────────────────────────────────────────────────────────
export type BadgeCategory =
  | "publication"
  | "social"
  | "exploration"
  | "engagement"
  | "special";

export interface BadgeDef {
  id: string;
  label: string;
  description: string;
  emoji: string;
  color: string;
  xpReward: number;
  category: BadgeCategory;
}

export const BADGE_DEFINITIONS: BadgeDef[] = [
  // ── Publication ───────────────────────────────────────────────────────────
  {
    id: "first_publication",
    label: "Premier Post",
    description: "Publier pour la première fois",
    emoji: "✍️",
    color: "#10b981",
    xpReward: 50,
    category: "publication",
  },
  {
    id: "pub_5",
    label: "Créateur Actif",
    description: "Publier 5 contenus",
    emoji: "🚀",
    color: "#6366f1",
    xpReward: 100,
    category: "publication",
  },
  {
    id: "pub_25",
    label: "Créateur Pro",
    description: "Publier 25 contenus",
    emoji: "⭐",
    color: "#f59e0b",
    xpReward: 250,
    category: "publication",
  },
  {
    id: "pub_100",
    label: "Légende du Feed",
    description: "Publier 100 contenus",
    emoji: "🏆",
    color: "#ef4444",
    xpReward: 500,
    category: "publication",
  },
  // ── Social ────────────────────────────────────────────────────────────────
  {
    id: "first_follow",
    label: "Connecté",
    description: "Suivre quelqu'un pour la première fois",
    emoji: "🤝",
    color: "#3b82f6",
    xpReward: 25,
    category: "social",
  },
  {
    id: "followers_10",
    label: "Populaire",
    description: "Avoir 10 abonnés",
    emoji: "👥",
    color: "#8b5cf6",
    xpReward: 100,
    category: "social",
  },
  {
    id: "followers_50",
    label: "Influenceur",
    description: "Avoir 50 abonnés",
    emoji: "🌟",
    color: "#f97316",
    xpReward: 300,
    category: "social",
  },
  {
    id: "likes_given_10",
    label: "Bienveillant",
    description: "Liker 10 publications",
    emoji: "❤️",
    color: "#ec4899",
    xpReward: 30,
    category: "social",
  },
  {
    id: "likes_received_50",
    label: "Contenu Apprécié",
    description: "Recevoir 50 likes au total",
    emoji: "💖",
    color: "#ef4444",
    xpReward: 200,
    category: "social",
  },
  {
    id: "comment_5",
    label: "Conversant",
    description: "Laisser 5 commentaires",
    emoji: "💬",
    color: "#06b6d4",
    xpReward: 50,
    category: "social",
  },
  // ── Exploration ───────────────────────────────────────────────────────────
  {
    id: "modules_5",
    label: "Explorateur",
    description: "Visiter 5 modules différents",
    emoji: "🗺️",
    color: "#10b981",
    xpReward: 75,
    category: "exploration",
  },
  {
    id: "modules_20",
    label: "Grand Explorateur",
    description: "Visiter 20 modules différents",
    emoji: "🌍",
    color: "#6366f1",
    xpReward: 200,
    category: "exploration",
  },
  {
    id: "modules_50",
    label: "Maître Explorateur",
    description: "Visiter 50 modules différents",
    emoji: "🏅",
    color: "#f59e0b",
    xpReward: 500,
    category: "exploration",
  },
  // ── Engagement ────────────────────────────────────────────────────────────
  {
    id: "onboarding_done",
    label: "Bienvenu !",
    description: "Compléter l'onboarding",
    emoji: "🎉",
    color: "#84cc16",
    xpReward: 100,
    category: "engagement",
  },
  {
    id: "profile_complete",
    label: "Profil Complet",
    description: "Remplir bio, ville et rôle",
    emoji: "✅",
    color: "#10b981",
    xpReward: 75,
    category: "engagement",
  },
  {
    id: "xp_500",
    label: "Montée en puissance",
    description: "Atteindre 500 XP",
    emoji: "⚡",
    color: "#f97316",
    xpReward: 0,
    category: "engagement",
  },
  {
    id: "xp_2000",
    label: "Expert",
    description: "Atteindre 2000 XP",
    emoji: "💎",
    color: "#8b5cf6",
    xpReward: 0,
    category: "engagement",
  },
  // ── Special ───────────────────────────────────────────────────────────────
  {
    id: "early_adopter",
    label: "Early Adopter",
    description: "Parmi les premiers utilisateurs",
    emoji: "🚀",
    color: "#6366f1",
    xpReward: 150,
    category: "special",
  },
];

// ── XP level thresholds ───────────────────────────────────────────────────────
export const LEVELS = [
  { name: "Débutant", min: 0, color: "#94a3b8", emoji: "🌱" },
  { name: "Explorateur", min: 300, color: "#10b981", emoji: "🗺️" },
  { name: "Pro", min: 800, color: "#6366f1", emoji: "⭐" },
  { name: "Expert", min: 2000, color: "#f59e0b", emoji: "💎" },
  { name: "Légende", min: 5000, color: "#ef4444", emoji: "🏆" },
] as const;

export type LevelName = (typeof LEVELS)[number]["name"];

// ── Helper: get user by email ─────────────────────────────────────────────────
async function getUserByEmail(
  ctx: QueryCtx | MutationCtx,
  email: string,
): Promise<Doc<"users">> {
  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .unique();
  if (!user)
    throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });
  return user;
}

// ── Compute total XP for a user ───────────────────────────────────────────────
async function getTotalXp(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
): Promise<number> {
  const logs = await ctx.db
    .query("xpLog")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  return logs.reduce((sum, l) => sum + l.amount, 0);
}

// ── Award a badge and XP (idempotent) ────────────────────────────────────────
async function awardBadge(
  ctx: MutationCtx,
  userId: Id<"users">,
  badgeId: string,
): Promise<{ newly: boolean }> {
  const existing = await ctx.db
    .query("userBadges")
    .withIndex("by_user_and_badge", (q) =>
      q.eq("userId", userId).eq("badgeId", badgeId),
    )
    .unique();
  if (existing) return { newly: false };

  const def = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
  if (!def) return { newly: false };

  await ctx.db.insert("userBadges", {
    userId,
    badgeId,
    unlockedAt: new Date().toISOString(),
  });

  if (def.xpReward > 0) {
    await ctx.db.insert("xpLog", {
      userId,
      amount: def.xpReward,
      reason: `Badge débloqué : ${def.label}`,
      sourceType: "badge",
      sourceId: badgeId,
    });
  }

  return { newly: true };
}

// ── Public queries ────────────────────────────────────────────────────────────

/** Get all badges for a user by email */
export const getMyBadges = query({
  args: { email: v.string() },
  handler: async (
    ctx,
    args,
  ): Promise<Array<{ badgeId: string; unlockedAt: string; def: BadgeDef }>> => {
    const user = await getUserByEmail(ctx, args.email);
    const rows = await ctx.db
      .query("userBadges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return rows
      .map((row) => {
        const def = BADGE_DEFINITIONS.find((b) => b.id === row.badgeId);
        if (!def) return null;
        return { badgeId: row.badgeId, unlockedAt: row.unlockedAt, def };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.unlockedAt.localeCompare(a.unlockedAt));
  },
});

/** Get XP total and recent log for a user by email */
export const getMyXp = query({
  args: { email: v.string() },
  handler: async (
    ctx,
    args,
  ): Promise<{
    total: number;
    recent: Array<{
      amount: number;
      reason: string;
      sourceType: string;
      _creationTime: number;
    }>;
  }> => {
    const user = await getUserByEmail(ctx, args.email);
    const logs = await ctx.db
      .query("xpLog")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);
    const total = logs.reduce((sum, l) => sum + l.amount, 0);
    return {
      total,
      recent: logs.map((l) => ({
        amount: l.amount,
        reason: l.reason,
        sourceType: l.sourceType,
        _creationTime: l._creationTime,
      })),
    };
  },
});

/** Get badges for another user's public profile */
export const getPublicBadges = query({
  args: { userId: v.id("users") },
  handler: async (
    ctx,
    args,
  ): Promise<Array<{ badgeId: string; def: BadgeDef }>> => {
    const rows = await ctx.db
      .query("userBadges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return rows
      .map((row) => {
        const def = BADGE_DEFINITIONS.find((b) => b.id === row.badgeId);
        if (!def) return null;
        return { badgeId: row.badgeId, def };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  },
});

// ── Award XP mutation ─────────────────────────────────────────────────────────
export const addXp = mutation({
  args: {
    email: v.string(),
    amount: v.number(),
    reason: v.string(),
    sourceType: v.union(
      v.literal("publication"),
      v.literal("like"),
      v.literal("comment"),
      v.literal("follow"),
      v.literal("module_visit"),
      v.literal("badge"),
      v.literal("onboarding"),
    ),
    sourceId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<void> => {
    const user = await getUserByEmail(ctx, args.email);
    await ctx.db.insert("xpLog", {
      userId: user._id,
      amount: args.amount,
      reason: args.reason,
      sourceType: args.sourceType,
      sourceId: args.sourceId,
    });
  },
});

// ── Check and award badges mutation ──────────────────────────────────────────
export const checkAndAwardBadges = mutation({
  args: {
    email: v.string(),
    action: v.union(
      v.literal("publication_created"),
      v.literal("liked"),
      v.literal("commented"),
      v.literal("followed"),
      v.literal("module_visited"),
      v.literal("onboarding_completed"),
      v.literal("profile_updated"),
    ),
  },
  handler: async (ctx, args): Promise<{ newlyUnlocked: string[] }> => {
    const user = await getUserByEmail(ctx, args.email);
    const userId = user._id;
    const newlyUnlocked: string[] = [];

    async function tryAward(badgeId: string) {
      const { newly } = await awardBadge(ctx, userId, badgeId);
      if (newly) newlyUnlocked.push(badgeId);
    }

    // ── Onboarding ────────────────────────────────────────────────────────
    if (args.action === "onboarding_completed") {
      await tryAward("onboarding_done");
      await tryAward("early_adopter");
    }

    // ── Profile completed ─────────────────────────────────────────────────
    if (args.action === "profile_updated") {
      if (user.bio && user.city && user.roles && user.roles.length > 0) {
        await tryAward("profile_complete");
      }
    }

    // ── Publications ──────────────────────────────────────────────────────
    if (args.action === "publication_created") {
      const pubCount = await ctx.db
        .query("publications")
        .withIndex("by_author", (q) => q.eq("authorId", userId))
        .collect()
        .then((r) => r.length);

      if (pubCount >= 1) await tryAward("first_publication");
      if (pubCount >= 5) await tryAward("pub_5");
      if (pubCount >= 25) await tryAward("pub_25");
      if (pubCount >= 100) await tryAward("pub_100");
    }

    // ── Likes given ───────────────────────────────────────────────────────
    if (args.action === "liked") {
      const likeCount = await ctx.db
        .query("publicationLikes")
        .withIndex("by_user_and_publication", (q) => q.eq("userId", userId))
        .collect()
        .then((r) => r.length);
      if (likeCount >= 10) await tryAward("likes_given_10");
    }

    // ── Comments ──────────────────────────────────────────────────────────
    if (args.action === "commented") {
      const commentCount = await ctx.db
        .query("comments")
        .withIndex("by_author", (q) => q.eq("authorId", userId))
        .collect()
        .then((r) => r.length);
      if (commentCount >= 5) await tryAward("comment_5");
    }

    // ── Follows given ─────────────────────────────────────────────────────
    if (args.action === "followed") {
      const followGiven = await ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", userId))
        .collect()
        .then((r) => r.length);
      if (followGiven >= 1) await tryAward("first_follow");

      // Followers received
      const followReceived = await ctx.db
        .query("follows")
        .withIndex("by_following", (q) => q.eq("followingId", userId))
        .collect()
        .then((r) => r.length);
      if (followReceived >= 10) await tryAward("followers_10");
      if (followReceived >= 50) await tryAward("followers_50");
    }

    // ── Module visits ─────────────────────────────────────────────────────
    if (args.action === "module_visited") {
      const activities = await ctx.db
        .query("userActivity")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      const uniqueModules = new Set(
        activities.filter((a) => a.type === "view_module").map((a) => a.target),
      );
      if (uniqueModules.size >= 5) await tryAward("modules_5");
      if (uniqueModules.size >= 20) await tryAward("modules_20");
      if (uniqueModules.size >= 50) await tryAward("modules_50");
    }

    // ── XP milestones ─────────────────────────────────────────────────────
    const totalXp = await getTotalXp(ctx, userId);
    if (totalXp >= 500) await tryAward("xp_500");
    if (totalXp >= 2000) await tryAward("xp_2000");

    return { newlyUnlocked };
  },
});
