// convex/services/reports.ts
//
// Backend Services V1 — signalements.
//
// Cycle de modération :
//   pending → reviewed → dismissed | actioned
//   pending → dismissed | actioned   (décision directe)
//
// "reviewed" = marqué comme examiné, sans décision finale.
// Un signalement examiné peut ensuite être classé sans suite (dismissed)
// ou sanctionné (actioned). Choix intentionnel.

import { query, mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

const REPORT_STATUS = v.union(
  v.literal("pending"),
  v.literal("reviewed"),
  v.literal("dismissed"),
  v.literal("actioned"),
);

const REPORT_TARGET = v.union(
  v.literal("provider"),
  v.literal("review"),
  v.literal("question"),
  v.literal("booking"),
);

type ReportStatus = "pending" | "reviewed" | "dismissed" | "actioned";
type ReportTarget = "provider" | "review" | "question" | "booking";

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
const MAX_DETAILS_LENGTH = 2000;

function clampLimit(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(Math.floor(value), MAX_LIMIT);
}

// ────────────────────────────────────────────────────────────────
// VALIDATION DE CIBLE — existence + type réel
// ────────────────────────────────────────────────────────────────

type TargetInfo =
  | { type: "provider"; doc: Doc<"serviceProviders"> }
  | { type: "review"; doc: Doc<"serviceReviews"> }
  | { type: "question"; doc: Doc<"serviceQuestions"> }
  | { type: "booking"; doc: Doc<"serviceBookings"> };

async function resolveTarget(
  ctx: Ctx,
  targetType: ReportTarget,
  targetId: string,
): Promise<TargetInfo> {
  if (targetType === "provider") {
    const doc = await ctx.db.get(targetId as Id<"serviceProviders">);
    if (!doc) {
      throw new ConvexError({
        code: "TARGET_NOT_FOUND",
        message: "Prestataire introuvable.",
      });
    }
    return { type: "provider", doc };
  }

  if (targetType === "review") {
    const doc = await ctx.db.get(targetId as Id<"serviceReviews">);
    if (!doc) {
      throw new ConvexError({
        code: "TARGET_NOT_FOUND",
        message: "Avis introuvable.",
      });
    }
    return { type: "review", doc };
  }

  if (targetType === "question") {
    const doc = await ctx.db.get(targetId as Id<"serviceQuestions">);
    if (!doc) {
      throw new ConvexError({
        code: "TARGET_NOT_FOUND",
        message: "Question introuvable.",
      });
    }
    return { type: "question", doc };
  }

  const doc = await ctx.db.get(targetId as Id<"serviceBookings">);
  if (!doc) {
    throw new ConvexError({
      code: "TARGET_NOT_FOUND",
      message: "Réservation introuvable.",
    });
  }
  return { type: "booking", doc };
}

// ────────────────────────────────────────────────────────────────
// CRÉATION
// ────────────────────────────────────────────────────────────────

export const createReport = mutation({
  args: {
    targetType: REPORT_TARGET,
    targetId: v.string(),
    reason: v.union(
      v.literal("spam"),
      v.literal("fake"),
      v.literal("inappropriate"),
      v.literal("harassment"),
      v.literal("fraud"),
      v.literal("other"),
    ),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (
      args.details !== undefined &&
      args.details.length > MAX_DETAILS_LENGTH
    ) {
      throw new ConvexError({
        code: "INVALID_DETAILS",
        message: `Détails trop longs (${MAX_DETAILS_LENGTH} caractères max).`,
      });
    }

    // Validation existence + type réel de la cible
    const target = await resolveTarget(ctx, args.targetType, args.targetId);

    // Anti-auto-signalement
    if (target.type === "provider" && target.doc.userId === user._id) {
      throw new ConvexError({
        code: "SELF_REPORT",
        message: "Vous ne pouvez pas signaler votre propre profil.",
      });
    }
    if (target.type === "review" && target.doc.reviewerId === user._id) {
      throw new ConvexError({
        code: "SELF_REPORT",
        message: "Vous ne pouvez pas signaler votre propre avis.",
      });
    }
    if (target.type === "question" && target.doc.askerId === user._id) {
      throw new ConvexError({
        code: "SELF_REPORT",
        message: "Vous ne pouvez pas signaler votre propre question.",
      });
    }
    if (target.type === "booking" && target.doc.userId === user._id) {
      throw new ConvexError({
        code: "SELF_REPORT",
        message: "Vous ne pouvez pas signaler votre propre réservation.",
      });
    }

    // Un seul signalement par user par cible
    const existing = await ctx.db
      .query("serviceReports")
      .withIndex("by_target", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId),
      )
      .filter((q) => q.eq(q.field("reporterId"), user._id))
      .first();

    if (existing) {
      throw new ConvexError({
        code: "ALREADY_REPORTED",
        message: "Vous avez déjà signalé cette cible.",
      });
    }

    const reportId = await ctx.db.insert("serviceReports", {
      targetType: args.targetType,
      targetId: args.targetId,
      reporterId: user._id,
      reason: args.reason,
      details: args.details,
      status: "pending",
      createdAt: Date.now(),
    });

    return { reportId };
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE — MES SIGNALEMENTS
// ────────────────────────────────────────────────────────────────

export const listMyReports = query({
  args: {
    status: v.optional(REPORT_STATUS),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) return [];
    const limit = clampLimit(args.limit, 50);

    const reports = await ctx.db
      .query("serviceReports")
      .withIndex("by_reporter", (q) => q.eq("reporterId", user._id))
      .order("desc")
      .take(limit);

    return args.status
      ? reports.filter((r) => r.status === (args.status as ReportStatus))
      : reports;
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE — ADMIN
// ────────────────────────────────────────────────────────────────

export const listPendingReports = query({
  args: {
    targetType: v.optional(REPORT_TARGET),
    status: v.optional(REPORT_STATUS),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = clampLimit(args.limit, 50);

    const reports = await ctx.db
      .query("serviceReports")
      .withIndex("by_status", (q) =>
        q.eq("status", (args.status as ReportStatus) ?? "pending"),
      )
      .order("desc")
      .take(limit);

    const filtered = args.targetType
      ? reports.filter((r) => r.targetType === args.targetType)
      : reports;

    return Promise.all(
      filtered.map(async (r) => {
        const reporter = await ctx.db.get(r.reporterId);
        return { ...r, reporterName: reporter?.name ?? "Anonyme" };
      }),
    );
  },
});

export const getReportById = query({
  args: { reportId: v.id("serviceReports") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const report = await ctx.db.get(args.reportId);
    if (!report) return null;

    const isReporter = report.reporterId === user._id;
    const isAdmin = user.isAdmin === true || user.roles?.includes("admin");

    if (!isReporter && !isAdmin) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé." });
    }

    const reporter = await ctx.db.get(report.reporterId);
    return { ...report, reporter };
  },
});

// ────────────────────────────────────────────────────────────────
// ACTIONS ADMIN
// ────────────────────────────────────────────────────────────────

export const reviewReport = mutation({
  args: { reportId: v.id("serviceReports") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Signalement introuvable",
      });
    }
    if (report.status !== "pending") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: `Action impossible depuis le statut "${report.status}".`,
      });
    }

    await ctx.db.patch(args.reportId, {
      status: "reviewed",
      reviewedBy: admin._id,
      reviewedAt: Date.now(),
    });

    return { success: true, status: "reviewed" as const };
  },
});

export const dismissReport = mutation({
  args: { reportId: v.id("serviceReports") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Signalement introuvable",
      });
    }
    if (report.status === "dismissed" || report.status === "actioned") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Ce signalement a déjà été traité.",
      });
    }

    await ctx.db.patch(args.reportId, {
      status: "dismissed",
      reviewedBy: admin._id,
      reviewedAt: Date.now(),
    });

    return { success: true, status: "dismissed" as const };
  },
});

export const actionReport = mutation({
  args: { reportId: v.id("serviceReports") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Signalement introuvable",
      });
    }
    if (report.status === "dismissed" || report.status === "actioned") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Ce signalement a déjà été traité.",
      });
    }

    // Vérifie que la cible existe toujours + type cohérent
    const targetType = report.targetType as ReportTarget;
    const target = await resolveTarget(ctx, targetType, report.targetId);

    await ctx.db.patch(args.reportId, {
      status: "actioned",
      reviewedBy: admin._id,
      reviewedAt: Date.now(),
    });

    // Masquage ciblé selon type de cible
    if (target.type === "review") {
      await ctx.db.patch(target.doc._id, { visible: false });
    } else if (target.type === "question") {
      await ctx.db.patch(target.doc._id, { visible: false });
    }

    return { success: true, status: "actioned" as const };
  },
});
