// convex/messages/moderation.ts

import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

// ============================================================================
// HELPERS
// ============================================================================

async function requireUser(ctx: {
  auth: {
    getUserIdentity: () => Promise<{
      tokenIdentifier: string;
    } | null>;
  };
  db: any;
}): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Connexion requise",
    });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Utilisateur introuvable",
    });
  }

  return user;
}

// ============================================================================
// 1. SIGNALER UN MESSAGE
// ============================================================================

export const reportMessage = mutation({
  args: {
    messageId: v.id("messages"),

    reason: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const reason = args.reason.trim();

    const validReasons = [
      "spam",
      "inappropriate",
      "harassment",
      "threat",
      "scam",
      "other",
    ] as const;

    if (!validReasons.includes(reason as (typeof validReasons)[number])) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Raison de signalement invalide",
      });
    }

    if (!reason) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Veuillez indiquer la raison du signalement",
      });
    }

    // ------------------------------------------------------------------------
    // Vérifier que le message existe.
    // ------------------------------------------------------------------------

    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Message introuvable",
      });
    }

    // ------------------------------------------------------------------------
    // L'utilisateur doit appartenir à la conversation.
    // ------------------------------------------------------------------------

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q: any) =>
        q.eq("userId", user._id).eq("conversationId", message.conversationId),
      )
      .unique();

    if (!member) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous ne pouvez pas signaler ce message",
      });
    }

    // ------------------------------------------------------------------------
    // On ne peut pas signaler son propre message.
    // ------------------------------------------------------------------------

    if (message.senderId === user._id) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Vous ne pouvez pas signaler votre propre message",
      });
    }

    // ------------------------------------------------------------------------
    // Éviter les signalements multiples du même
    // utilisateur pour le même message.
    // ------------------------------------------------------------------------

    const existingReports = await ctx.db
      .query("moderationReports")
      .withIndex("by_reporter", (q: any) => q.eq("reportedBy", user._id))
      .collect();

    const alreadyReported = existingReports.some(
      (report: Doc<"moderationReports">) =>
        report.messageId === args.messageId &&
        (report.status === "pending" || report.status === "reviewed"),
    );

    if (alreadyReported) {
      throw new ConvexError({
        code: "ALREADY_EXISTS",
        message: "Vous avez déjà signalé ce message",
      });
    }

    // ------------------------------------------------------------------------
    // Créer le signalement.
    // ------------------------------------------------------------------------

    const reportId = await ctx.db.insert("moderationReports", {
      messageId: args.messageId,

      reportedBy: user._id,

      reason: reason as (typeof validReasons)[number],

      status: "pending",

      createdAt: Date.now(),
    });

    return reportId;
  },
});

// ============================================================================
// 2. VÉRIFIER SI L'UTILISATEUR A SIGNALÉ UN MESSAGE
// ============================================================================

export const hasReportedMessage = query({
  args: {
    messageId: v.id("messages"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const reports = await ctx.db
      .query("moderationReports")
      .withIndex("by_reporter", (q: any) => q.eq("reportedBy", user._id))
      .collect();

    return reports.some(
      (report: Doc<"moderationReports">) =>
        report.messageId === args.messageId &&
        (report.status === "pending" || report.status === "reviewed"),
    );
  },
});

// ============================================================================
// 3. LISTE DES SIGNALEMENTS D'UN MESSAGE
// ============================================================================
//
// Réservé à l'auteur du message et aux membres administrateurs
// de la conversation.
// ============================================================================

export const getMessageReports = query({
  args: {
    messageId: v.id("messages"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Message introuvable",
      });
    }

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q: any) =>
        q.eq("userId", user._id).eq("conversationId", message.conversationId),
      )
      .unique();

    if (!member) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Accès non autorisé",
      });
    }

    const isAuthorized =
      message.senderId === user._id ||
      member.role === "owner" ||
      member.role === "admin";

    if (!isAuthorized) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'avez pas accès aux signalements",
      });
    }

    return await ctx.db
      .query("moderationReports")
      .withIndex("by_message", (q: any) => q.eq("messageId", args.messageId))
      .collect();
  },
});

// ============================================================================
// 4. LISTE DES SIGNALEMENTS EN ATTENTE
// ============================================================================
//
// Pour l'administration de la plateforme.
//
// La vérification admin est volontairement basée
// sur le rôle stocké sur l'utilisateur.
// ============================================================================

export const listPendingReports = query({
  args: {},

  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const isAdmin = Array.isArray(user.roles) && user.roles.includes("admin");

    if (!isAdmin) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Accès réservé aux administrateurs",
      });
    }

    return await ctx.db
      .query("moderationReports")
      .withIndex("by_status", (q: any) => q.eq("status", "pending"))
      .collect();
  },
});

// ============================================================================
// 5. MARQUER UN SIGNALEMENT COMME REVU
// ============================================================================

export const reviewReport = mutation({
  args: {
    reportId: v.id("moderationReports"),

    action: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const isAdmin = Array.isArray(user.roles) && user.roles.includes("admin");

    if (!isAdmin) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Accès réservé aux administrateurs",
      });
    }

    const report = await ctx.db.get(args.reportId);

    if (!report) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Signalement introuvable",
      });
    }

    if (report.status !== "pending") {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Ce signalement a déjà été traité",
      });
    }

    await ctx.db.patch(args.reportId, {
      status: "reviewed",
      resolution: args.action?.trim() || undefined,
      reviewedBy: user._id,
      reviewedAt: Date.now(),
    });

    return true;
  },
});

// ============================================================================
// 6. RÉSOUDRE UN SIGNALEMENT
// ============================================================================

export const resolveReport = mutation({
  args: {
    reportId: v.id("moderationReports"),

    action: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const isAdmin = Array.isArray(user.roles) && user.roles.includes("admin");

    if (!isAdmin) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Accès réservé aux administrateurs",
      });
    }

    const report = await ctx.db.get(args.reportId);

    if (!report) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Signalement introuvable",
      });
    }

    const action = args.action.trim();

    if (!action) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "L'action de modération est requise",
      });
    }

    await ctx.db.patch(args.reportId, {
      status: "resolved",
      resolution: action,
      reviewedBy: user._id,
      reviewedAt: Date.now(),
    });

    return true;
  },
});

// ============================================================================
// 7. REJETER UN SIGNALEMENT
// ============================================================================

export const dismissReport = mutation({
  args: {
    reportId: v.id("moderationReports"),

    action: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const isAdmin = Array.isArray(user.roles) && user.roles.includes("admin");

    if (!isAdmin) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Accès réservé aux administrateurs",
      });
    }

    const report = await ctx.db.get(args.reportId);

    if (!report) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Signalement introuvable",
      });
    }

    await ctx.db.patch(args.reportId, {
      status: "rejected",
      resolution: args.action?.trim() || "Signalement rejeté",
      reviewedBy: user._id,
      reviewedAt: Date.now(),
    });

    return true;
  },
});

// ============================================================================
// 8. HISTORIQUE DES SIGNALEMENTS DE L'UTILISATEUR
// ============================================================================

export const getMyReports = query({
  args: {},

  handler: async (ctx) => {
    const user = await requireUser(ctx);

    return await ctx.db
      .query("moderationReports")
      .withIndex("by_reporter", (q: any) => q.eq("reportedBy", user._id))
      .collect();
  },
});
