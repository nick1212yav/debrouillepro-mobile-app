import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

async function requireUser(ctx: QueryCtx | MutationCtx) {
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

  return user;
}

// ─────────────────────────────────────────────────────────────────────────────
// LIST LIVE STREAMS
// ─────────────────────────────────────────────────────────────────────────────

export const listLiveStreams = query({
  args: {
    status: v.optional(
      v.union(v.literal("live"), v.literal("scheduled"), v.literal("ended")),
    ),
  },

  handler: async (ctx, args) => {
    const status = args.status ?? "live";

    const streams = await ctx.db
      .query("liveStreams")
      .withIndex("by_status", (q) => q.eq("status", status))
      .order("desc")
      .take(20);

    return await Promise.all(
      streams.map(async (stream) => {
        const host = await ctx.db.get(stream.hostId);

        return {
          ...stream,
          hostName: host?.name ?? "Inconnu",
          hostAvatar: host?.avatar ?? undefined,
        };
      }),
    );
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// GET SINGLE STREAM
// ─────────────────────────────────────────────────────────────────────────────

export const getStream = query({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, args) => {
    const stream = await ctx.db.get(args.streamId);

    if (!stream) {
      return null;
    }

    const host = await ctx.db.get(stream.hostId);

    return {
      ...stream,
      hostName: host?.name ?? "Inconnu",
      hostAvatar: host?.avatar ?? undefined,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// GET STREAM MESSAGES
//
// NOTE:
// The current mobile client consumes this function as an array.
// Pagination is therefore intentionally NOT introduced here yet.
// The legacy `livestream.ts` implementation is not copied blindly because
// changing the return contract would break the current consumer.
// ─────────────────────────────────────────────────────────────────────────────

export const getStreamMessages = query({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("liveStreamMessages")
      .withIndex("by_stream", (q) => q.eq("streamId", args.streamId))
      .order("asc")
      .take(100);

    return await Promise.all(
      messages.map(async (message) => {
        const user = await ctx.db.get(message.userId);

        return {
          ...message,
          userName: user?.name ?? "Utilisateur",
          userAvatar: user?.avatar ?? undefined,
        };
      }),
    );
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// START LIVE STREAM
// ─────────────────────────────────────────────────────────────────────────────

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

    /*
     * A host should not have several active live streams simultaneously.
     *
     * The existing `by_host` index does not contain `status`, so we keep the
     * status filter server-side but bound the result. We do NOT collect the
     * complete stream history of the host.
     */
    const existingLiveStreams = await ctx.db
      .query("liveStreams")
      .withIndex("by_host", (q) => q.eq("hostId", user._id))
      .filter((q) => q.eq(q.field("status"), "live"))
      .take(5);

    const now = new Date().toISOString();

    for (const stream of existingLiveStreams) {
      await ctx.db.patch(stream._id, {
        status: "ended",
        endedAt: now,
      });
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
      startedAt: now,
      tags: args.tags,
      isPublic: args.isPublic,
    });

    await ctx.db.insert("liveStreamMessages", {
      streamId,
      userId: user._id,
      text: `${user.name ?? "Quelqu'un"} a lancé le live !`,
      type: "system",
    });

    return streamId;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// END LIVE STREAM
// ─────────────────────────────────────────────────────────────────────────────

export const endStream = mutation({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const stream = await ctx.db.get(args.streamId);

    if (!stream) {
      throw new ConvexError({
        message: "Stream introuvable",
        code: "NOT_FOUND",
      });
    }

    if (stream.hostId !== user._id) {
      throw new ConvexError({
        message: "Non autorisé",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.streamId, {
      status: "ended",
      endedAt: new Date().toISOString(),
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// SEND CHAT MESSAGE
// ─────────────────────────────────────────────────────────────────────────────

export const sendMessage = mutation({
  args: {
    streamId: v.id("liveStreams"),
    text: v.string(),
    type: v.union(
      v.literal("chat"),
      v.literal("super_chat"),
      v.literal("system"),
    ),
    amount: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const stream = await ctx.db.get(args.streamId);

    if (!stream) {
      throw new ConvexError({
        message: "Stream introuvable",
        code: "NOT_FOUND",
      });
    }

    if (stream.status !== "live") {
      throw new ConvexError({
        message: "Stream non actif",
        code: "BAD_REQUEST",
      });
    }

    const text = args.text.trim();

    if (!text) {
      throw new ConvexError({
        message: "Message vide",
        code: "BAD_REQUEST",
      });
    }

    if (text.length > 300) {
      throw new ConvexError({
        message: "Message trop long (300 caractères maximum)",
        code: "BAD_REQUEST",
      });
    }

    if (
      args.amount !== undefined &&
      (!Number.isFinite(args.amount) || args.amount < 0)
    ) {
      throw new ConvexError({
        message: "Montant invalide",
        code: "BAD_REQUEST",
      });
    }

    await ctx.db.insert("liveStreamMessages", {
      streamId: args.streamId,
      userId: user._id,
      text,
      type: args.type,
      amount: args.amount,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// LIKE STREAM
//
// Intentionally preserved.
// There is currently no `liveStreamLikes` table/index in the provided schema,
// so true per-user idempotency cannot be implemented safely without a schema
// change. No fake deduplication is introduced here.
// ─────────────────────────────────────────────────────────────────────────────

export const likeStream = mutation({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, args) => {
    await requireUser(ctx);

    const stream = await ctx.db.get(args.streamId);

    if (!stream) {
      throw new ConvexError({
        message: "Stream introuvable",
        code: "NOT_FOUND",
      });
    }

    await ctx.db.patch(args.streamId, {
      likeCount: stream.likeCount + 1,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// JOIN STREAM
// ─────────────────────────────────────────────────────────────────────────────

export const joinStream = mutation({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const stream = await ctx.db.get(args.streamId);

    if (!stream) {
      throw new ConvexError({
        message: "Stream introuvable",
        code: "NOT_FOUND",
      });
    }

    if (stream.status !== "live") {
      throw new ConvexError({
        message: "Ce stream n'est pas actif",
        code: "BAD_REQUEST",
      });
    }

    /*
     * IMPORTANT:
     * Check presence BEFORE modifying viewerCount.
     *
     * This prevents repeated join calls from incrementing the counter when
     * the user is already registered for this stream.
     */
    const existing = await ctx.db
      .query("liveStreamFollows")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("streamId"), args.streamId))
      .first();

    if (existing) {
      return;
    }

    await ctx.db.insert("liveStreamFollows", {
      streamId: args.streamId,
      userId: user._id,
      joinedAt: new Date().toISOString(),
    });

    const newCount = stream.viewerCount + 1;

    await ctx.db.patch(args.streamId, {
      viewerCount: newCount,
      peakViewers: Math.max(stream.peakViewers, newCount),
    });

    await ctx.db.insert("liveStreamMessages", {
      streamId: args.streamId,
      userId: user._id,
      text: `${user.name ?? "Quelqu'un"} a rejoint le live`,
      type: "system",
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// LEAVE STREAM
// ─────────────────────────────────────────────────────────────────────────────

export const leaveStream = mutation({
  args: {
    streamId: v.id("liveStreams"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const record = await ctx.db
      .query("liveStreamFollows")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("streamId"), args.streamId))
      .first();

    /*
     * User is not registered as present.
     * Do not decrement viewerCount.
     */
    if (!record) {
      return;
    }

    await ctx.db.delete(record._id);

    const stream = await ctx.db.get(args.streamId);

    if (!stream) {
      return;
    }

    if (stream.viewerCount > 0) {
      await ctx.db.patch(args.streamId, {
        viewerCount: stream.viewerCount - 1,
      });
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// SEND GIFT / SUPER CHAT
//
// IMPORTANT:
// The existing business behavior is intentionally preserved.
// This function currently records the gift as a super_chat and increases
// likeCount according to the existing `amount * 10` rule.
//
// This is NOT treated as a real monetary payment.
// A future DébrouillePay integration must introduce the real wallet/payment
// transaction path before this can represent actual money.
// ─────────────────────────────────────────────────────────────────────────────

export const sendGift = mutation({
  args: {
    streamId: v.id("liveStreams"),

    giftType: v.union(
      v.literal("star"),
      v.literal("crown"),
      v.literal("fire"),
      v.literal("diamond"),
      v.literal("rocket"),
    ),

    amount: v.number(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const stream = await ctx.db.get(args.streamId);

    if (!stream) {
      throw new ConvexError({
        message: "Stream introuvable",
        code: "NOT_FOUND",
      });
    }

    if (stream.status !== "live") {
      throw new ConvexError({
        message: "Stream non actif",
        code: "BAD_REQUEST",
      });
    }

    if (!Number.isFinite(args.amount) || args.amount <= 0) {
      throw new ConvexError({
        message: "Le montant du cadeau doit être supérieur à zéro",
        code: "BAD_REQUEST",
      });
    }

    const LABELS: Record<
      "star" | "crown" | "fire" | "diamond" | "rocket",
      string
    > = {
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

    /*
     * Existing product rule preserved.
     *
     * This does NOT debit a wallet and does NOT represent a real payment.
     * A proper payment implementation belongs to DébrouillePay.
     */
    await ctx.db.patch(args.streamId, {
      likeCount: stream.likeCount + args.amount * 10,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// GET MY ACTIVE STREAM
// ─────────────────────────────────────────────────────────────────────────────

export const getMyActiveStream = query({
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

    /*
     * Keep the `by_host` index but avoid loading the complete stream history.
     */
    const streams = await ctx.db
      .query("liveStreams")
      .withIndex("by_host", (q) => q.eq("hostId", user._id))
      .filter((q) => q.eq(q.field("status"), "live"))
      .take(5);

    return streams[0] ?? null;
  },
});
