import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";

// Returns today's date in UTC as "YYYY-MM-DD"
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayUTC(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Get streak info for current user. Returns null if no authenticated user/streak context. */
export const getMyStreak = query({
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

    const streak = await ctx.db
      .query("userStreaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    /*
     * Keep the return shape identical whether the user has
     * already started a streak or not.
     *
     * This is important for the frontend contract:
     * StreakWidget can safely destructure isStreakInDanger
     * without dealing with a discriminated union.
     */
    if (!streak) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastClaimedDate: null,
        totalDaysClaimed: 0,
        canClaim: true,
        isStreakInDanger: false,
      };
    }

    const today = todayUTC();
    const yesterday = yesterdayUTC();

    const canClaim = streak.lastClaimedDate !== today;

    // A streak remains alive when the last claim was today or yesterday.
    const isStreakAlive =
      streak.lastClaimedDate === today || streak.lastClaimedDate === yesterday;

    const effectiveStreak = isStreakAlive ? streak.currentStreak : 0;

    return {
      currentStreak: effectiveStreak,
      longestStreak: streak.longestStreak,
      lastClaimedDate: streak.lastClaimedDate,
      totalDaysClaimed: streak.totalDaysClaimed,
      canClaim,
      isStreakInDanger:
        streak.lastClaimedDate === yesterday && effectiveStreak > 0,
    };
  },
});

/** Claim daily streak XP. */
export const claimDailyStreak = mutation({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    xpEarned: number;
    newStreak: number;
    isNewRecord: boolean;
  }> => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new ConvexError({
        message: "Non authentifié",
        code: "UNAUTHENTICATED",
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
        message: "Utilisateur introuvable",
        code: "NOT_FOUND",
      });
    }

    const today = todayUTC();
    const yesterday = yesterdayUTC();

    const existing = await ctx.db
      .query("userStreaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (existing?.lastClaimedDate === today) {
      throw new ConvexError({
        message: "Déjà réclamé aujourd'hui",
        code: "CONFLICT",
      });
    }

    /*
     * Continue the streak only when the previous claim
     * was yesterday. Otherwise start a new series at 1.
     */
    const prevStreak =
      existing?.lastClaimedDate === yesterday ? existing.currentStreak : 0;

    const newStreak = prevStreak + 1;

    const longestStreak = Math.max(existing?.longestStreak ?? 0, newStreak);

    const totalDaysClaimed = (existing?.totalDaysClaimed ?? 0) + 1;

    // XP formula:
    // - milestone: 100 + 2 XP per streak day
    // - otherwise: 20 + 5 XP for every completed 7-day block
    const milestones = [7, 14, 30, 60, 100, 365];

    const isMilestone = milestones.includes(newStreak);

    const xpEarned = isMilestone
      ? 100 + newStreak * 2
      : 20 + Math.floor(newStreak / 7) * 5;

    if (existing) {
      await ctx.db.patch(existing._id, {
        currentStreak: newStreak,
        longestStreak,
        lastClaimedDate: today,
        totalDaysClaimed,
      });
    } else {
      await ctx.db.insert("userStreaks", {
        userId: user._id,
        currentStreak: newStreak,
        longestStreak,
        lastClaimedDate: today,
        totalDaysClaimed,
      });
    }

    await ctx.db.insert("xpLog", {
      userId: user._id,
      amount: xpEarned,
      reason: `Streak jour ${newStreak}`,
      sourceType: "daily_streak",
    });

    return {
      xpEarned,
      newStreak,
      isNewRecord: newStreak === longestStreak && newStreak > 1,
    };
  },
});
