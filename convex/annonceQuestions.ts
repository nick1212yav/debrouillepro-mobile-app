import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./publications";

// ── Queries ───────────────────────────────────────────────────────────────────

export const listQuestions = query({
  args: { publicationId: v.id("publications") },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("publicationQuestions")
      .withIndex("by_publication", (q) =>
        q.eq("publicationId", args.publicationId),
      )
      .order("desc")
      .collect();

    const withAsker = await Promise.all(
      questions.map(async (q) => {
        const user = await ctx.db.get(q.askerId);
        return {
          ...q,
          askerName: user?.name || "Anonyme",
        };
      }),
    );
    return withAsker;
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const askQuestion = mutation({
  args: {
    publicationId: v.id("publications"),
    question: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const pub = await ctx.db.get(args.publicationId);
    if (!pub) {
      throw new ConvexError({
        message: "Publication introuvable",
        code: "NOT_FOUND",
      });
    }

    if (pub.authorId === user._id) {
      throw new ConvexError({
        message:
          "Vous ne pouvez pas poser de question sur votre propre annonce",
        code: "FORBIDDEN",
      });
    }

    const questionId = await ctx.db.insert("publicationQuestions", {
      publicationId: args.publicationId,
      askerId: user._id,
      question: args.question,
      createdAt: Date.now(),
    });

    return questionId;
  },
});

export const answerQuestion = mutation({
  args: {
    questionId: v.id("publicationQuestions"),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new ConvexError({
        message: "Question introuvable",
        code: "NOT_FOUND",
      });
    }

    const pub = await ctx.db.get(question.publicationId);
    if (!pub) {
      throw new ConvexError({
        message: "Publication introuvable",
        code: "NOT_FOUND",
      });
    }
    if (pub.authorId !== user._id) {
      throw new ConvexError({
        message: "Seul le propriétaire de l'annonce peut répondre",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.questionId, {
      answer: args.answer,
      answererId: user._id,
      answeredAt: Date.now(),
    });

    return { success: true };
  },
});

export const deleteQuestion = mutation({
  args: { questionId: v.id("publicationQuestions") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new ConvexError({
        message: "Question introuvable",
        code: "NOT_FOUND",
      });
    }

    const pub = await ctx.db.get(question.publicationId);
    if (!pub) {
      throw new ConvexError({
        message: "Publication introuvable",
        code: "NOT_FOUND",
      });
    }
    if (question.askerId !== user._id && pub.authorId !== user._id) {
      throw new ConvexError({ message: "Non autorisé", code: "FORBIDDEN" });
    }

    await ctx.db.delete(args.questionId);
    return { success: true };
  },
});
