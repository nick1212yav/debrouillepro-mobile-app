import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ message: "Non authentifié", code: "UNAUTHENTICATED" });
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) throw new ConvexError({ message: "Utilisateur introuvable", code: "NOT_FOUND" });
  return user;
}

// ── List live streams ─────────────────────────────────────────────────────────
export const listLiveStreams = query({
  args: { status: v.optional(v.union(v.literal("live"), v.literal("scheduled"), v.literal("ended"))) },
  handler: async (ctx, args) => {
    const status = args.status ?? "live";
    const streams = await ctx.db
      .query("liveStreams")
      .withIndex("by_status", (q) => q.eq("status", status))
      .order("desc")
      .take(20);

    return await Promise.all(
      streams.map(async (s) => {
        const host = await ctx.db.get(s.hostId);
        return {
          ...s,
          hostName: host?.name ?? "Inconnu",
          hostAvatar: host?.avatar ?? undefined,
        };
      })
    );
  },
});

// ── Get a single stream ───────────────────────────────────────────────────────
export const getStream = query({
  args: { streamId: v.id("liveStreams") },
  handler: async (ctx, args) => {
    const stream = await ctx.db.get(args.streamId);
    if (!stream) return null;
    const host = await ctx.db.get(stream.hostId);
    return { ...stream, hostName: host?.name ?? "Inconnu", hostAvatar: host?.avatar ?? undefined };
  },
});

// ── Get live chat messages (real-time) ────────────────────────────────────────
export const getStreamMessages = query({
  args: { streamId: v.id("liveStreams") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("liveStreamMessages")
      .withIndex("by_stream", (q) => q.eq("streamId", args.streamId))
      .order("asc")
      .take(100);

    return await Promise.all(
      messages.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          ...m,
          userName: user?.name ?? "Utilisateur",
          userAvatar: user?.avatar ?? undefined,
        };
      })
    );
  },
});

// ── Start a live stream ───────────────────────────────────────────────────────
export const startStream = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    thumbnailUrl: v.optional(v.string()),
    tags: v.array(v.string()),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // End any existing live stream from this user
    const existing = await ctx.db
      .query("liveStreams")
      .withIndex("by_host", (q) => q.eq("hostId", user._id))
      .collect();
    for (const s of existing) {
      if (s.status === "live") {
        await ctx.db.patch(s._id, { status: "ended", endedAt: new Date().toISOString() });
      }
    }

    const streamId = await ctx.db.insert("liveStreams", {
      hostId: user._id,
      title: args.title,
      description: args.description,
      category: args.category,
      thumbnailUrl: args.thumbnailUrl,
      viewerCount: 0,
      peakViewers: 0,
      likeCount: 0,
      status: "live",
      startedAt: new Date().toISOString(),
      tags: args.tags,
      isPublic: args.isPublic,
    });

    // Post system message
    await ctx.db.insert("liveStreamMessages", {
      streamId,
      userId: user._id,
      text: `${user.name ?? "Quelqu'un"} a lancé le live !`,
      type: "system",
    });

    return streamId;
  },
});

// ── End a live stream ─────────────────────────────────────────────────────────
export const endStream = mutation({
  args: { streamId: v.id("liveStreams") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const stream = await ctx.db.get(args.streamId);
    if (!stream) throw new ConvexError({ message: "Stream introuvable", code: "NOT_FOUND" });
    if (stream.hostId !== user._id) throw new ConvexError({ message: "Non autorisé", code: "FORBIDDEN" });
    await ctx.db.patch(args.streamId, { status: "ended", endedAt: new Date().toISOString() });
  },
});

// ── Send chat message ─────────────────────────────────────────────────────────
export const sendMessage = mutation({
  args: {
    streamId: v.id("liveStreams"),
    text: v.string(),
    type: v.union(v.literal("chat"), v.literal("super_chat"), v.literal("system")),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const stream = await ctx.db.get(args.streamId);
    if (!stream || stream.status !== "live")
      throw new ConvexError({ message: "Stream non actif", code: "BAD_REQUEST" });

    await ctx.db.insert("liveStreamMessages", {
      streamId: args.streamId,
      userId: user._id,
      text: args.text.slice(0, 300),
      type: args.type,
      amount: args.amount,
    });
  },
});

// ── Like a stream ─────────────────────────────────────────────────────────────
export const likeStream = mutation({
  args: { streamId: v.id("liveStreams") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const stream = await ctx.db.get(args.streamId);
    if (!stream) throw new ConvexError({ message: "Stream introuvable", code: "NOT_FOUND" });
    await ctx.db.patch(args.streamId, { likeCount: stream.likeCount + 1 });
  },
});

// ── Join stream (increment viewer count) ─────────────────────────────────────
export const joinStream = mutation({
  args: { streamId: v.id("liveStreams") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const stream = await ctx.db.get(args.streamId);
    if (!stream) return;

    const newCount = stream.viewerCount + 1;
    await ctx.db.patch(args.streamId, {
      viewerCount: newCount,
      peakViewers: Math.max(stream.peakViewers, newCount),
    });

    // Follow record
    const existing = await ctx.db
      .query("liveStreamFollows")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const alreadyIn = existing.some((f) => f.streamId === args.streamId);
    if (!alreadyIn) {
      await ctx.db.insert("liveStreamFollows", {
        streamId: args.streamId,
        userId: user._id,
        joinedAt: new Date().toISOString(),
      });
      // System join message
      await ctx.db.insert("liveStreamMessages", {
        streamId: args.streamId,
        userId: user._id,
        text: `${user.name ?? "Quelqu'un"} a rejoint le live`,
        type: "system",
      });
    }
  },
});

// ── Leave stream (decrement) ──────────────────────────────────────────────────
export const leaveStream = mutation({
  args: { streamId: v.id("liveStreams") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const stream = await ctx.db.get(args.streamId);
    if (!stream) return;
    await ctx.db.patch(args.streamId, { viewerCount: Math.max(0, stream.viewerCount - 1) });

    const follow = await ctx.db
      .query("liveStreamFollows")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const f of follow) {
      if (f.streamId === args.streamId) await ctx.db.delete(f._id);
    }
  },
});

// ── Send a gift (super chat) ──────────────────────────────────────────────────
export const sendGift = mutation({
  args: {
    streamId: v.id("liveStreams"),
    giftType: v.union(v.literal("star"), v.literal("crown"), v.literal("fire"), v.literal("diamond"), v.literal("rocket")),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const stream = await ctx.db.get(args.streamId);
    if (!stream || stream.status !== "live")
      throw new ConvexError({ message: "Stream non actif", code: "BAD_REQUEST" });

    const LABELS: Record<string, string> = {
      star: "⭐ Étoile",
      crown: "👑 Couronne",
      fire: "🔥 Feu",
      diamond: "💎 Diamant",
      rocket: "🚀 Fusée",
    };

    await ctx.db.insert("liveStreamMessages", {
      streamId: args.streamId,
      userId: user._id,
      text: `${user.name ?? "Quelqu'un"} a envoyé ${LABELS[args.giftType]} × ${args.amount}`,
      type: "super_chat",
      amount: args.amount,
    });

    // Add likes as gift value
    await ctx.db.patch(args.streamId, { likeCount: stream.likeCount + args.amount * 10 });
  },
});

// ── Get my active stream ──────────────────────────────────────────────────────
export const getMyActiveStream = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return null;

    const streams = await ctx.db
      .query("liveStreams")
      .withIndex("by_host", (q) => q.eq("hostId", user._id))
      .collect();
    return streams.find((s) => s.status === "live") ?? null;
  },
});
