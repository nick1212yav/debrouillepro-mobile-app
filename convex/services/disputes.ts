// convex/services/disputes.ts
//
// Backend Services V1 — litiges.
//
// Cycle : open → investigating → resolved → closed

import { query, mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

const DISPUTE_STATUS = v.union(
  v.literal("open"),
  v.literal("investigating"),
  v.literal("resolved"),
  v.literal("closed"),
);

type DisputeStatus = "open" | "investigating" | "resolved" | "closed";

// ────────────────────────────────────────────────────────────────
// AUTH
// ────────────────────────────────────────────────────────────────

async function getUser(ctx: Ctx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

async function requireUser(ctx: Ctx): Promise<Doc<"users">> {
  const user = await getUser(ctx);
  if (!user) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Connexion requise",
    });
  }
  return user;
}

// Admin : vérifie le rôle admin
async function requireAdmin(ctx: Ctx): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  const isAdmin = user.isAdmin === true || user.roles?.includes("admin");
  if (!isAdmin) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Réservé aux administrateurs.",
    });
  }
  return user;
}

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

const MAX_LIMIT = 100;
const MIN_DESCRIPTION = 10;
const MAX_DESCRIPTION = 3000;

function clampLimit(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(Math.floor(value), MAX_LIMIT);
}

async function logHistory(
  ctx: MutationCtx,
  providerId: Id<"serviceProviders">,
  event: string,
  actorId: Id<"users">,
  bookingId: Id<"serviceBookings">,
): Promise<void> {
  await ctx.db.insert("serviceHistory", {
    providerId,
    event,
    actorId,
    bookingId,
    type: event,
    createdAt: Date.now(),
  });
}

// ────────────────────────────────────────────────────────────────
// LECTURE — CLIENT
// ────────────────────────────────────────────────────────────────

export const listMyDisputes = query({
  args: {
    status: v.optional(DISPUTE_STATUS),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) return [];
    const limit = clampLimit(args.limit, 50);

    const disputes = await ctx.db
      .query("serviceDisputes")
      .withIndex("by_user", (q) => q.eq("openedBy", user._id))
      .order("desc")
      .take(limit);

    const filtered = args.status
      ? disputes.filter((d) => d.status === (args.status as DisputeStatus))
      : disputes;

    return Promise.all(
      filtered.map(async (d) => {
        const booking = await ctx.db.get(d.bookingId);
        const provider = await ctx.db.get(d.againstProviderId);
        return { ...d, booking, provider };
      }),
    );
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE — PRESTATAIRE (litiges contre lui)
// ────────────────────────────────────────────────────────────────

export const listProviderDisputes = query({
  args: {
    providerId: v.id("serviceProviders"),
    status: v.optional(DISPUTE_STATUS),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const provider = await ctx.db.get(args.providerId);
    if (!provider) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Prestataire introuvable",
      });
    }
    if (provider.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'êtes pas le propriétaire de ce profil.",
      });
    }

    const limit = clampLimit(args.limit, 50);

    const disputes = await ctx.db
      .query("serviceDisputes")
      .withIndex("by_provider", (q) =>
        q.eq("againstProviderId", args.providerId),
      )
      .order("desc")
      .take(limit);

    const filtered = args.status
      ? disputes.filter((d) => d.status === (args.status as DisputeStatus))
      : disputes;

    return Promise.all(
      filtered.map(async (d) => {
        const booking = await ctx.db.get(d.bookingId);
        const opener = await ctx.db.get(d.openedBy);
        return { ...d, booking, opener };
      }),
    );
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE — ADMIN
// ────────────────────────────────────────────────────────────────

export const listPendingDisputes = query({
  args: {
    status: v.optional(DISPUTE_STATUS),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = clampLimit(args.limit, 50);

    const disputes = await ctx.db
      .query("serviceDisputes")
      .withIndex("by_status", (q) =>
        q.eq("status", (args.status as DisputeStatus) ?? "open"),
      )
      .order("desc")
      .take(limit);

    return Promise.all(
      disputes.map(async (d) => {
        const booking = await ctx.db.get(d.bookingId);
        const provider = await ctx.db.get(d.againstProviderId);
        const opener = await ctx.db.get(d.openedBy);
        return { ...d, booking, provider, opener };
      }),
    );
  },
});

export const getDisputeById = query({
  args: { disputeId: v.id("serviceDisputes") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) return null;

    const provider = await ctx.db.get(dispute.againstProviderId);
    if (!provider) return null;

    const isOpener = dispute.openedBy === user._id;
    const isProvider = provider.userId === user._id;
    const isAdmin = user.isAdmin === true || user.roles?.includes("admin");

    if (!isOpener && !isProvider && !isAdmin) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé." });
    }

    const booking = await ctx.db.get(dispute.bookingId);
    return { ...dispute, booking, provider };
  },
});

// ────────────────────────────────────────────────────────────────
// RÉPONSE DU PRESTATAIRE
// ────────────────────────────────────────────────────────────────

export const respondToDispute = mutation({
  args: {
    disputeId: v.id("serviceDisputes"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Litige introuvable",
      });
    }
    if (dispute.status !== "open" && dispute.status !== "investigating") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Réponse impossible depuis le statut "${dispute.status}".`,
      });
    }

    const provider = await ctx.db.get(dispute.againstProviderId);
    if (!provider || provider.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Seul le prestataire concerné peut répondre.",
      });
    }

    const message = args.message.trim();
    if (message.length < MIN_DESCRIPTION) {
      throw new ConvexError({
        code: "INVALID_MESSAGE",
        message: `La réponse doit contenir au moins ${MIN_DESCRIPTION} caractères.`,
      });
    }
    if (message.length > MAX_DESCRIPTION) {
      throw new ConvexError({
        code: "INVALID_MESSAGE",
        message: `Réponse trop longue (${MAX_DESCRIPTION} caractères max).`,
      });
    }

    const now = Date.now();

    // La plainte originale n'est JAMAIS modifiée
    await ctx.db.patch(args.disputeId, {
      providerResponse: message,
      providerRespondedAt: now,
      status: "investigating",
    });

    await logHistory(
      ctx,
      dispute.againstProviderId,
      "dispute.responded",
      user._id,
      dispute.bookingId,
    );

    return { success: true, status: "investigating" as const };
  },
});

// ────────────────────────────────────────────────────────────────
// RÉSOLUTION — ADMIN
// ────────────────────────────────────────────────────────────────

export const resolveDispute = mutation({
  args: {
    disputeId: v.id("serviceDisputes"),
    resolution: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Litige introuvable",
      });
    }
    if (dispute.status === "closed") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Ce litige est déjà fermé.",
      });
    }

    const resolution = args.resolution.trim();
    if (resolution.length < MIN_DESCRIPTION) {
      throw new ConvexError({
        code: "INVALID_RESOLUTION",
        message: `La résolution doit contenir au moins ${MIN_DESCRIPTION} caractères.`,
      });
    }
    if (resolution.length > MAX_DESCRIPTION) {
      throw new ConvexError({
        code: "INVALID_RESOLUTION",
        message: `Résolution trop longue (${MAX_DESCRIPTION} caractères max).`,
      });
    }

    const now = Date.now();
    await ctx.db.patch(args.disputeId, {
      status: "resolved",
      resolution,
      resolvedBy: admin._id,
      resolvedAt: now,
    });

    await logHistory(
      ctx,
      dispute.againstProviderId,
      "dispute.resolved",
      admin._id,
      dispute.bookingId,
    );

    return { success: true, status: "resolved" as const };
  },
});
