import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Connexion requise" });
  const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
  if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "Utilisateur introuvable" });
  return user;
}

// ─── Streams ──────────────────────────────────────────────────────────────────

export const listLiveStreams = query({
  args: { status: v.optional(v.string()), paginationOpts: v.object({ numItems: v.number(), cursor: v.union(v.string(), v.null()) }) },
  handler: async (ctx, args) => {
    const status = (args.status ?? "live") as "scheduled" | "live" | "ended";
    return ctx.db.query("liveStreams").withIndex("by_status", (q) => q.eq("status", status)).paginate(args.paginationOpts);
  },
});

export const getLiveStream = query({
  args: { streamId: v.id("liveStreams") },
  handler: async (ctx, args) => {
    const stream = await ctx.db.get(args.streamId);
    if (!stream) return null;
    const host = await ctx.db.get(stream.hostId);
    const viewerCount = await ctx.db.query("liveStreamFollows").withIndex("by_stream", (q) => q.eq("streamId", args.streamId)).collect();
    return { ...stream, hostName: host?.name, hostAvatar: host?.avatar, liveViewerCount: viewerCount.length };
  },
});

export const getMyStreams = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return [];
    return ctx.db.query("liveStreams").withIndex("by_host", (q) => q.eq("hostId", user._id)).order("desc").take(20);
  },
});

export const createStream = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    thumbnailUrl: v.optional(v.string()),
    scheduledAt: v.optional(v.string()),
    tags: v.array(v.string()),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("liveStreams", {
      hostId: user._id,
      viewerCount: 0,
      peakViewers: 0,
      likeCount: 0,
      status: args.scheduledAt ? "scheduled" : "live",
      startedAt: args.scheduledAt ? undefined : new Date().toISOString(),
      ...args,
    });
  },
});

export const goLive = mutation({
  args: { streamId: v.id("liveStreams"), streamUrl: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const stream = await ctx.db.get(args.streamId);
    if (!stream || stream.hostId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
    await ctx.db.patch(args.streamId, { status: "live", startedAt: new Date().toISOString(), streamUrl: args.streamUrl });
  },
});

export const endStream = mutation({
  args: { streamId: v.id("liveStreams") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const stream = await ctx.db.get(args.streamId);
    if (!stream || stream.hostId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
    await ctx.db.patch(args.streamId, { status: "ended", endedAt: new Date().toISOString() });
  },
});

export const likeStream = mutation({
  args: { streamId: v.id("liveStreams") },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const stream = await ctx.db.get(args.streamId);
    if (!stream) throw new ConvexError({ code: "NOT_FOUND", message: "Stream introuvable" });
    await ctx.db.patch(args.streamId, { likeCount: stream.likeCount + 1 });
  },
});

// ─── Stream Chat ──────────────────────────────────────────────────────────────

export const getStreamMessages = query({
  args: { streamId: v.id("liveStreams"), paginationOpts: v.object({ numItems: v.number(), cursor: v.union(v.string(), v.null()) }) },
  handler: async (ctx, args) => {
    const result = await ctx.db.query("liveStreamMessages").withIndex("by_stream", (q) => q.eq("streamId", args.streamId)).paginate(args.paginationOpts);
    const page = await Promise.all(result.page.map(async (msg) => {
      const user = await ctx.db.get(msg.userId);
      return { ...msg, userName: user?.name, userAvatar: user?.avatar };
    }));
    return { ...result, page };
  },
});

export const sendStreamMessage = mutation({
  args: {
    streamId: v.id("liveStreams"),
    text: v.string(),
    type: v.union(v.literal("chat"), v.literal("super_chat"), v.literal("system")),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("liveStreamMessages", { userId: user._id, ...args });
  },
});

// ─── Viewer join/leave ────────────────────────────────────────────────────────

export const joinStream = mutation({
  args: { streamId: v.id("liveStreams") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db.query("liveStreamFollows").withIndex("by_user", (q) => q.eq("userId", user._id)).filter((q) => q.eq(q.field("streamId"), args.streamId)).first();
    if (!existing) {
      await ctx.db.insert("liveStreamFollows", { streamId: args.streamId, userId: user._id, joinedAt: new Date().toISOString() });
      const stream = await ctx.db.get(args.streamId);
      if (stream) {
        const newCount = stream.viewerCount + 1;
        await ctx.db.patch(args.streamId, { viewerCount: newCount, peakViewers: Math.max(stream.peakViewers, newCount) });
      }
    }
  },
});

export const leaveStream = mutation({
  args: { streamId: v.id("liveStreams") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const record = await ctx.db.query("liveStreamFollows").withIndex("by_user", (q) => q.eq("userId", user._id)).filter((q) => q.eq(q.field("streamId"), args.streamId)).first();
    if (record) {
      await ctx.db.delete(record._id);
      const stream = await ctx.db.get(args.streamId);
      if (stream && stream.viewerCount > 0) {
        await ctx.db.patch(args.streamId, { viewerCount: stream.viewerCount - 1 });
      }
    }
  },
});
