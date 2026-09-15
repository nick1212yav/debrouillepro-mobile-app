import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

// ── Helpers ────────────────────────────────────────────────────────────────

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function last7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    days.push(isoDate(d));
  }
  return days;
}

function last30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    days.push(isoDate(d));
  }
  return days;
}

// ── Record a profile view (called when public profile is opened) ───────────
export const recordProfileView = mutation({
  args: { profileId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const viewerId = identity
      ? (await ctx.db
          .query("users")
          .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
          .unique())?._id
      : undefined;

    const date = isoDate(new Date());
    await ctx.db.insert("profileViews", {
      profileId: args.profileId,
      viewerId: viewerId ?? undefined,
      date,
    });
  },
});

// ── My personal analytics ──────────────────────────────────────────────────
export const getMyAnalytics = query({
  args: {},
  handler: async (ctx): Promise<{
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalFollowers: number;
    totalPublications: number;
    engagementRate: number;
    weekSummary: { label: string; views: number; likes: number };
    viewsByDay: { date: string; views: number }[];
    likesByDay: { date: string; likes: number }[];
    followersByDay: { date: string; count: number }[];
    profileViewsByDay: { date: string; views: number }[];
    topPublications: { _id: string; title: string; type: string; views: number; likes: number; comments: number }[];
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Non authentifié", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "Utilisateur introuvable", code: "NOT_FOUND" });

    const days30 = last30Days();
    const days7 = last7Days();
    const weekStart = days7[0];

    // ── Publications ────────────────────────────────────────────────────────
    const pubs = await ctx.db
      .query("publications")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect();

    const totalViews = pubs.reduce((s, p) => s + p.viewCount, 0);
    const totalLikes = pubs.reduce((s, p) => s + p.likeCount, 0);
    const totalComments = pubs.reduce((s, p) => s + p.commentCount, 0);
    const totalPublications = pubs.length;

    // ── Followers ───────────────────────────────────────────────────────────
    const followRows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", user._id))
      .collect();
    const totalFollowers = followRows.length;

    // ── Engagement rate ─────────────────────────────────────────────────────
    const engagementRate = totalViews > 0
      ? Math.round(((totalLikes + totalComments) / totalViews) * 100)
      : 0;

    // ── Profile views by day (last 30d) ─────────────────────────────────────
    const pvRows = await ctx.db
      .query("profileViews")
      .withIndex("by_profile", (q) => q.eq("profileId", user._id))
      .collect();

    const pvByDay: Record<string, number> = {};
    for (const row of pvRows) {
      if (days30.includes(row.date)) {
        pvByDay[row.date] = (pvByDay[row.date] ?? 0) + 1;
      }
    }
    const profileViewsByDay = days30.map((d) => ({ date: d, views: pvByDay[d] ?? 0 }));

    // ── Views/likes by day — approximate from publications _creationTime ─────
    // We don't have per-day view events, so we distribute viewCount evenly
    // over the last 30 days weighted by recency (most recent pub = more views today)
    const viewsByDayMap: Record<string, number> = {};
    const likesByDayMap: Record<string, number> = {};
    for (const d of days30) { viewsByDayMap[d] = 0; likesByDayMap[d] = 0; }

    for (const pub of pubs) {
      const pubDate = isoDate(new Date(pub._creationTime));
      if (viewsByDayMap[pubDate] !== undefined) {
        viewsByDayMap[pubDate] += pub.viewCount;
        likesByDayMap[pubDate] += pub.likeCount;
      }
    }

    const viewsByDay = days30.map((d) => ({ date: d, views: viewsByDayMap[d] }));
    const likesByDay = days30.map((d) => ({ date: d, likes: likesByDayMap[d] }));

    // ── Followers growth by day (follow _creationTime bucketed) ────────────
    const followersByDayMap: Record<string, number> = {};
    for (const d of days30) followersByDayMap[d] = 0;
    for (const row of followRows) {
      const d = isoDate(new Date(row._creationTime));
      if (followersByDayMap[d] !== undefined) followersByDayMap[d]++;
    }
    // Convert to cumulative
    let cumul = 0;
    const followersByDay = days30.map((d) => {
      cumul += followersByDayMap[d];
      return { date: d, count: cumul };
    });

    // ── Week summary ────────────────────────────────────────────────────────
    const weekViews = viewsByDay
      .filter((x) => x.date >= weekStart)
      .reduce((s, x) => s + x.views, 0);
    const weekLikes = likesByDay
      .filter((x) => x.date >= weekStart)
      .reduce((s, x) => s + x.likes, 0);

    // ── Top publications ────────────────────────────────────────────────────
    const topPublications = [...pubs]
      .sort((a, b) => (b.viewCount + b.likeCount) - (a.viewCount + a.likeCount))
      .slice(0, 5)
      .map((p) => ({
        _id: p._id,
        title: p.title,
        type: p.type,
        views: p.viewCount,
        likes: p.likeCount,
        comments: p.commentCount,
      }));

    return {
      totalViews,
      totalLikes,
      totalComments,
      totalFollowers,
      totalPublications,
      engagementRate,
      weekSummary: { label: "Cette semaine", views: weekViews, likes: weekLikes },
      viewsByDay,
      likesByDay,
      followersByDay,
      profileViewsByDay,
      topPublications,
    };
  },
});
