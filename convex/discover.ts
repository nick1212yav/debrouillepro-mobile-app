import { query } from "./_generated/server";
import { v } from "convex/values";

// ── Trending Tags ─────────────────────────────────────────────────────────────
// Counts tag occurrences across the 200 most recent active publications
export const trendingTags = query({
  args: {},
  handler: async (ctx) => {
    const publications = await ctx.db
      .query("publications")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .take(200);

    const tagCount: Record<string, { count: number; likeCount: number }> = {};
    for (const pub of publications) {
      for (const tag of pub.tags) {
        const t = tag.toLowerCase().trim();
        if (!t) continue;
        if (!tagCount[t]) tagCount[t] = { count: 0, likeCount: 0 };
        tagCount[t].count += 1;
        tagCount[t].likeCount += pub.likeCount;
      }
    }

    return Object.entries(tagCount)
      .map(([tag, { count, likeCount }]) => ({ tag, count, likeCount }))
      .sort((a, b) => b.count - a.count || b.likeCount - a.likeCount)
      .slice(0, 20);
  },
});

// ── Trending Publications ────────────────────────────────────────────────────
// Top publications by likeCount + commentCount among recent actives
export const trendingPublications = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const publications = await ctx.db
      .query("publications")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .take(300);

    const scored = publications
      .map((p) => ({
        ...p,
        score: p.likeCount * 2 + p.commentCount * 3 + p.viewCount,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Enrich with author info
    const enriched = await Promise.all(
      scored.map(async (pub) => {
        const author = await ctx.db.get(pub.authorId);
        return {
          _id: pub._id,
          title: pub.title,
          description: pub.description,
          type: pub.type,
          tags: pub.tags,
          images: pub.images,
          likeCount: pub.likeCount,
          commentCount: pub.commentCount,
          viewCount: pub.viewCount,
          score: pub.score,
          authorName: author?.name ?? "Utilisateur",
          authorAvatar: author?.avatar,
          location: pub.location,
        };
      }),
    );
    return enriched;
  },
});

// ── Suggested Users ──────────────────────────────────────────────────────────
// Users to follow: most-followed users that the current user doesn't follow yet
export const suggestedUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!currentUser) return [];

    // Get all follows by current user
    const myFollows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", currentUser._id))
      .collect();
    const followingIds = new Set(myFollows.map((f) => f.followingId));

    // Count how many followers each user has
    const allFollows = await ctx.db.query("follows").take(500);
    const followerCount: Record<string, number> = {};
    for (const f of allFollows) {
      const id = f.followingId as string;
      followerCount[id] = (followerCount[id] ?? 0) + 1;
    }

    // Sort candidate users by follower count, exclude self and already followed
    const allUsers = await ctx.db.query("users").take(200);
    const candidates = allUsers
      .filter((u) => u._id !== currentUser._id && !followingIds.has(u._id))
      .map((u) => ({
        ...u,
        followerCount: followerCount[u._id as string] ?? 0,
      }))
      .sort((a, b) => b.followerCount - a.followerCount)
      .slice(0, 8);

    return candidates.map((u) => ({
      _id: u._id,
      name: u.name ?? "Utilisateur",
      avatar: u.avatar,
      bio: u.bio,
      city: u.city,
      role: u.roles?.[0] ?? null,
      followerCount: u.followerCount,
    }));
  },
});

// ── Category Spotlight ───────────────────────────────────────────────────────
// Count of active publications per type with total likes
export const categorySpotlight = query({
  args: {},
  handler: async (ctx) => {
    const publications = await ctx.db
      .query("publications")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .take(300);

    const byType: Record<string, { count: number; likeCount: number }> = {};
    for (const pub of publications) {
      if (!byType[pub.type]) byType[pub.type] = { count: 0, likeCount: 0 };
      byType[pub.type].count += 1;
      byType[pub.type].likeCount += pub.likeCount;
    }

    return Object.entries(byType)
      .map(([type, { count, likeCount }]) => ({ type, count, likeCount }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  },
});
