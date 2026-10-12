// convex/services/questions.ts
//
// Backend Services V1 — questions/réponses publiques sur un prestataire.
//
// Cycle : ask → answer → visible
//       ask → report → moderation

import { query, mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

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

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

const MAX_LIMIT = 100;
const MIN_QUESTION_LENGTH = 5;
const MAX_QUESTION_LENGTH = 1000;
const MIN_ANSWER_LENGTH = 3;
const MAX_ANSWER_LENGTH = 2000;

function clampLimit(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(Math.floor(value), MAX_LIMIT);
}

function validateQuestion(raw: string): string {
  const q = raw.trim();
  if (q.length < MIN_QUESTION_LENGTH) {
    throw new ConvexError({
      code: "INVALID_QUESTION",
      message: `La question doit contenir au moins ${MIN_QUESTION_LENGTH} caractères.`,
    });
  }
  if (q.length > MAX_QUESTION_LENGTH) {
    throw new ConvexError({
      code: "INVALID_QUESTION",
      message: `Question trop longue (${MAX_QUESTION_LENGTH} caractères max).`,
    });
  }
  return q;
}

function validateAnswer(raw: string): string {
  const a = raw.trim();
  if (a.length < MIN_ANSWER_LENGTH) {
    throw new ConvexError({
      code: "INVALID_ANSWER",
      message: `La réponse doit contenir au moins ${MIN_ANSWER_LENGTH} caractères.`,
    });
  }
  if (a.length > MAX_ANSWER_LENGTH) {
    throw new ConvexError({
      code: "INVALID_ANSWER",
      message: `Réponse trop longue (${MAX_ANSWER_LENGTH} caractères max).`,
    });
  }
  return a;
}

async function logHistory(
  ctx: MutationCtx,
  providerId: Id<"serviceProviders">,
  event: string,
  actorId: Id<"users">,
): Promise<void> {
  await ctx.db.insert("serviceHistory", {
    providerId,
    event,
    actorId,
    type: event,
    createdAt: Date.now(),
  });
}

// ────────────────────────────────────────────────────────────────
// POSER UNE QUESTION (client)
// ────────────────────────────────────────────────────────────────

export const askQuestion = mutation({
  args: {
    providerId: v.id("serviceProviders"),
    question: v.string(),
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
    if (provider.status !== "active") {
      throw new ConvexError({
        code: "PROVIDER_NOT_ACTIVE",
        message: "Ce prestataire n'accepte pas de questions actuellement.",
      });
    }

    const question = validateQuestion(args.question);

    const now = Date.now();
    const questionId = await ctx.db.insert("serviceQuestions", {
      providerId: args.providerId,
      askerId: user._id,
      question,
      visible: true,
      reported: false,
      createdAt: now,
    });

    await logHistory(ctx, args.providerId, "question.asked", user._id);

    return { questionId };
  },
});

// ────────────────────────────────────────────────────────────────
// RÉPONDRE (prestataire uniquement)
// ────────────────────────────────────────────────────────────────

export const answerQuestion = mutation({
  args: {
    questionId: v.id("serviceQuestions"),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Question introuvable",
      });
    }

    const provider = await ctx.db.get(question.providerId);
    if (!provider) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Prestataire introuvable",
      });
    }
    if (provider.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Seul le prestataire concerné peut répondre.",
      });
    }
    if (question.answer !== undefined) {
      throw new ConvexError({
        code: "ALREADY_ANSWERED",
        message: "Cette question a déjà reçu une réponse.",
      });
    }

    const answer = validateAnswer(args.answer);
    const now = Date.now();

    await ctx.db.patch(args.questionId, {
      answer,
      answererId: user._id,
      answeredAt: now,
    });

    await logHistory(ctx, question.providerId, "question.answered", user._id);

    return { success: true };
  },
});

// ────────────────────────────────────────────────────────────────
// MODIFICATION / SUPPRESSION
// ────────────────────────────────────────────────────────────────

export const updateQuestion = mutation({
  args: {
    questionId: v.id("serviceQuestions"),
    question: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db.get(args.questionId);
    if (!existing) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Question introuvable",
      });
    }
    if (existing.askerId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Seul l'auteur peut modifier sa question.",
      });
    }
    if (existing.answer !== undefined) {
      throw new ConvexError({
        code: "IMMUTABLE",
        message: "Une question déjà répondue ne peut plus être modifiée.",
      });
    }

    const question = validateQuestion(args.question);
    await ctx.db.patch(args.questionId, { question });

    return { success: true };
  },
});

export const deleteQuestion = mutation({
  args: { questionId: v.id("serviceQuestions") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Question introuvable",
      });
    }

    const provider = await ctx.db.get(question.providerId);
    const isAsker = question.askerId === user._id;
    const isProvider = provider?.userId === user._id;

    if (!isAsker && !isProvider) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message:
          "Seul l'auteur ou le prestataire peut supprimer cette question.",
      });
    }

    await ctx.db.delete(args.questionId);
    await logHistory(ctx, question.providerId, "question.deleted", user._id);

    return { success: true };
  },
});

// ────────────────────────────────────────────────────────────────
// SIGNALEMENT
// ────────────────────────────────────────────────────────────────

export const reportQuestion = mutation({
  args: {
    questionId: v.id("serviceQuestions"),
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
    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Question introuvable",
      });
    }
    if (question.askerId === user._id) {
      throw new ConvexError({
        code: "SELF_REPORT",
        message: "Vous ne pouvez pas signaler votre propre question.",
      });
    }

    const existing = await ctx.db
      .query("serviceReports")
      .withIndex("by_target", (q) =>
        q.eq("targetType", "question").eq("targetId", args.questionId),
      )
      .filter((q) => q.eq(q.field("reporterId"), user._id))
      .first();

    if (existing) {
      throw new ConvexError({
        code: "ALREADY_REPORTED",
        message: "Vous avez déjà signalé cette question.",
      });
    }

    if (question.reported !== true) {
      await ctx.db.patch(args.questionId, { reported: true });
    }

    await ctx.db.insert("serviceReports", {
      targetType: "question",
      targetId: args.questionId,
      reporterId: user._id,
      reason: args.reason,
      details: args.details,
      status: "pending",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE
// ────────────────────────────────────────────────────────────────

export const getQuestions = query({
  args: {
    providerId: v.id("serviceProviders"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = clampLimit(args.limit, 50);

    const questions = await ctx.db
      .query("serviceQuestions")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .order("desc")
      .take(limit);

    const visible = questions.filter((q) => q.visible !== false);

    return Promise.all(
      visible.map(async (q) => {
        const asker = await ctx.db.get(q.askerId);
        const answerer = q.answererId ? await ctx.db.get(q.answererId) : null;
        return {
          ...q,
          askerName: asker?.name ?? "Anonyme",
          askerAvatar: asker?.avatar,
          answererName: answerer?.name ?? null,
        };
      }),
    );
  },
});

export const listMyQuestions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) return [];
    const limit = clampLimit(args.limit, 50);

    const questions = await ctx.db
      .query("serviceQuestions")
      .withIndex("by_asker", (q) => q.eq("askerId", user._id))
      .order("desc")
      .take(limit);

    return Promise.all(
      questions.map(async (q) => {
        const provider = await ctx.db.get(q.providerId);
        return { ...q, provider };
      }),
    );
  },
});

export const listProviderQuestions = query({
  args: {
    providerId: v.id("serviceProviders"),
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
        message: "Seul le propriétaire peut consulter la liste complète.",
      });
    }

    const limit = clampLimit(args.limit, 100);

    return ctx.db
      .query("serviceQuestions")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .order("desc")
      .take(limit);
  },
});
