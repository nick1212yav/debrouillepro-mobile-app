// convex/services/notifications.ts
//
// Backend Services V1 — pont vers le module Notifications.
//
// Délègue à api.notifications.insert (mutation publique).
// Type unique côté validator : "service" (ajouté à notifTypeValidator).
// La distinction métier passe par le title et le link.
//
// AUCUNE mutation publique de ce fichier n'accepte un userId en argument :
// la cible est toujours calculée depuis les parties réelles de l'événement.

import { mutation, internalMutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

const NOTIF_TYPE = "service" as const;
const MAX_TITLE = 120;
const MAX_BODY = 500;
const MAX_LINK = 300;

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
// DISPATCH
// ────────────────────────────────────────────────────────────────

async function dispatch(
  ctx: MutationCtx,
  userId: Id<"users">,
  title: string,
  body: string,
  link: string,
): Promise<void> {
  if (title.length > MAX_TITLE) {
    throw new ConvexError({
      code: "NOTIF_TITLE_TOO_LONG",
      message: `Titre trop long (max ${MAX_TITLE}).`,
    });
  }
  if (body.length > MAX_BODY) {
    throw new ConvexError({
      code: "NOTIF_BODY_TOO_LONG",
      message: `Corps trop long (max ${MAX_BODY}).`,
    });
  }
  if (link.length > MAX_LINK) {
    throw new ConvexError({
      code: "NOTIF_LINK_TOO_LONG",
      message: `Lien trop long (max ${MAX_LINK}).`,
    });
  }

  await ctx.runMutation(internal.notifications.insertForUser, {
    userId,
    type: "service",
    module: "service",
    title,
    body,
    actionPage: link,
  });
}

// ────────────────────────────────────────────────────────────────
// BOOKING
// ────────────────────────────────────────────────────────────────

const BOOKING_EVENT = v.union(
  v.literal("created"),
  v.literal("confirmed"),
  v.literal("started"),
  v.literal("completed"),
  v.literal("cancelled"),
  v.literal("disputed"),
);

export const notifyBookingEvent = mutation({
  args: {
    bookingId: v.id("serviceBookings"),
    event: BOOKING_EVENT,
  },
  handler: async (ctx, args): Promise<{ sent: boolean }> => {
    const user = await requireUser(ctx);
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new ConvexError({
        code: "BOOKING_NOT_FOUND",
        message: "Réservation introuvable",
      });
    }
    const provider = await ctx.db.get(booking.providerId);
    if (!provider) {
      throw new ConvexError({
        code: "PROVIDER_NOT_FOUND",
        message: "Prestataire introuvable",
      });
    }

    const isClient = booking.userId === user._id;
    const isProvider = provider.userId === user._id;
    if (!isClient && !isProvider) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'êtes pas partie à cette réservation.",
      });
    }

    const client = await ctx.db.get(booking.userId);
    const clientName = client?.name ?? "Un client";
    const link = `/service/bookings/${args.bookingId}`;
    const providerUserId = provider.userId;

    // ── created : client → provider
    if (args.event === "created") {
      if (!isClient) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Seul le client peut notifier la création.",
        });
      }
      if (!providerUserId) return { sent: false };
      await dispatch(
        ctx,
        providerUserId,
        "Nouvelle réservation",
        `${clientName} souhaite réserver votre service.`,
        link,
      );
      return { sent: true };
    }

    // ── confirmed : provider → client
    if (args.event === "confirmed") {
      if (!isProvider) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Seul le prestataire peut notifier la confirmation.",
        });
      }
      if (booking.status !== "confirmed") {
        throw new ConvexError({
          code: "INVALID_STATE",
          message: "La réservation n'est pas confirmée.",
        });
      }
      await dispatch(
        ctx,
        booking.userId,
        "Réservation confirmée",
        `${provider.name} a confirmé votre réservation.`,
        link,
      );
      return { sent: true };
    }

    // ── started : provider → client
    if (args.event === "started") {
      if (!isProvider) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Seul le prestataire peut notifier le démarrage.",
        });
      }
      if (booking.status !== "in_progress") {
        throw new ConvexError({
          code: "INVALID_STATE",
          message: "La prestation n'a pas démarré.",
        });
      }
      await dispatch(
        ctx,
        booking.userId,
        "Prestation démarrée",
        `${provider.name} a démarré la prestation.`,
        link,
      );
      return { sent: true };
    }

    // ── completed : client → provider
    if (args.event === "completed") {
      if (!isClient) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Seul le client peut notifier la fin.",
        });
      }
      if (booking.status !== "done") {
        throw new ConvexError({
          code: "INVALID_STATE",
          message: "La prestation n'est pas terminée.",
        });
      }
      if (!providerUserId) return { sent: false };
      await dispatch(
        ctx,
        providerUserId,
        "Prestation terminée",
        `${clientName} a confirmé la fin de la prestation.`,
        link,
      );
      return { sent: true };
    }

    // ── cancelled : émetteur → autre partie
    if (args.event === "cancelled") {
      if (booking.status !== "cancelled") {
        throw new ConvexError({
          code: "INVALID_STATE",
          message: "La réservation n'est pas annulée.",
        });
      }
      if (isClient && providerUserId) {
        await dispatch(
          ctx,
          providerUserId,
          "Réservation annulée",
          `${clientName} a annulé la réservation.`,
          link,
        );
        return { sent: true };
      }
      if (isProvider) {
        await dispatch(
          ctx,
          booking.userId,
          "Réservation annulée",
          `${provider.name} a annulé la réservation.`,
          link,
        );
        return { sent: true };
      }
    }

    // ── disputed : client → provider
    if (args.event === "disputed") {
      if (!isClient) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Seul le client peut ouvrir un litige.",
        });
      }
      if (booking.status !== "disputed") {
        throw new ConvexError({
          code: "INVALID_STATE",
          message: "La réservation n'est pas en litige.",
        });
      }
      if (!providerUserId) return { sent: false };
      await dispatch(
        ctx,
        providerUserId,
        "Litige ouvert",
        `${clientName} a ouvert un litige sur cette réservation.`,
        link,
      );
      return { sent: true };
    }

    return { sent: false };
  },
});

// ────────────────────────────────────────────────────────────────
// QUOTE
// ────────────────────────────────────────────────────────────────

const QUOTE_EVENT = v.union(
  v.literal("requested"),
  v.literal("responded"),
  v.literal("accepted"),
  v.literal("rejected"),
  v.literal("converted"),
);

export const notifyQuoteEvent = mutation({
  args: {
    quoteId: v.id("serviceQuotes"),
    event: QUOTE_EVENT,
  },
  handler: async (ctx, args): Promise<{ sent: boolean }> => {
    const user = await requireUser(ctx);
    const quote = await ctx.db.get(args.quoteId);
    if (!quote) {
      throw new ConvexError({
        code: "QUOTE_NOT_FOUND",
        message: "Devis introuvable",
      });
    }
    const provider = await ctx.db.get(quote.providerId);
    if (!provider) {
      throw new ConvexError({
        code: "PROVIDER_NOT_FOUND",
        message: "Prestataire introuvable",
      });
    }

    const isClient = quote.clientId === user._id;
    const isProvider = provider.userId === user._id;
    if (!isClient && !isProvider) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'êtes pas partie à ce devis.",
      });
    }

    const client = await ctx.db.get(quote.clientId);
    const clientName = client?.name ?? "Un client";
    const link = `/service/quotes/${args.quoteId}`;
    const providerUserId = provider.userId;

    if (args.event === "requested") {
      if (!isClient) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Seul le client peut notifier la demande.",
        });
      }
      if (quote.status !== "pending") {
        throw new ConvexError({
          code: "INVALID_STATE",
          message: "Le devis n'est pas en attente.",
        });
      }
      if (!providerUserId) return { sent: false };
      await dispatch(
        ctx,
        providerUserId,
        "Nouvelle demande de devis",
        `${clientName} vous a envoyé une demande de devis.`,
        link,
      );
      return { sent: true };
    }

    if (args.event === "responded") {
      if (!isProvider) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Seul le prestataire peut notifier la réponse.",
        });
      }
      if (quote.respondedAt === undefined) {
        throw new ConvexError({
          code: "INVALID_STATE",
          message: "Le devis n'a pas encore été traité.",
        });
      }
      await dispatch(
        ctx,
        quote.clientId,
        "Réponse à votre devis",
        `${provider.name} a répondu à votre demande.`,
        link,
      );
      return { sent: true };
    }

    if (args.event === "accepted") {
      if (!isClient) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Seul le client peut notifier l'acceptation.",
        });
      }
      if (quote.status !== "accepted") {
        throw new ConvexError({
          code: "INVALID_STATE",
          message: "Le devis n'est pas accepté.",
        });
      }
      if (!providerUserId) return { sent: false };
      await dispatch(
        ctx,
        providerUserId,
        "Devis accepté",
        `${clientName} a accepté votre devis.`,
        link,
      );
      return { sent: true };
    }

    if (args.event === "rejected") {
      if (!isClient) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Seul le client peut notifier le refus.",
        });
      }
      if (quote.status !== "rejected") {
        throw new ConvexError({
          code: "INVALID_STATE",
          message: "Le devis n'est pas refusé.",
        });
      }
      if (!providerUserId) return { sent: false };
      await dispatch(
        ctx,
        providerUserId,
        "Devis refusé",
        `${clientName} a refusé votre devis.`,
        link,
      );
      return { sent: true };
    }

    if (args.event === "converted") {
      if (!isClient) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Seul le client peut notifier la conversion.",
        });
      }
      if (quote.status !== "converted") {
        throw new ConvexError({
          code: "INVALID_STATE",
          message: "Le devis n'est pas converti.",
        });
      }
      if (!providerUserId) return { sent: false };
      await dispatch(
        ctx,
        providerUserId,
        "Devis converti en réservation",
        `${clientName} a converti le devis en réservation.`,
        link,
      );
      return { sent: true };
    }

    return { sent: false };
  },
});

// ────────────────────────────────────────────────────────────────
// REVIEW
// ────────────────────────────────────────────────────────────────

export const notifyReviewEvent = mutation({
  args: {
    reviewId: v.id("serviceReviews"),
    event: v.union(v.literal("created"), v.literal("responded")),
  },
  handler: async (ctx, args): Promise<{ sent: boolean }> => {
    const user = await requireUser(ctx);
    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new ConvexError({
        code: "REVIEW_NOT_FOUND",
        message: "Avis introuvable",
      });
    }
    const provider = await ctx.db.get(review.providerId);
    if (!provider) {
      throw new ConvexError({
        code: "PROVIDER_NOT_FOUND",
        message: "Prestataire introuvable",
      });
    }

    const isReviewer = review.reviewerId === user._id;
    const isProvider = provider.userId === user._id;
    if (!isReviewer && !isProvider) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'êtes pas partie à cet avis.",
      });
    }

    const reviewer = await ctx.db.get(review.reviewerId);
    const reviewerName = reviewer?.name ?? "Un client";
    const link = `/service/reviews/${args.reviewId}`;

    if (args.event === "created") {
      if (!isReviewer) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Seul l'auteur de l'avis peut notifier sa création.",
        });
      }
      if (!provider.userId) return { sent: false };
      await dispatch(
        ctx,
        provider.userId,
        "Nouvel avis",
        `${reviewerName} a laissé un avis (${review.rating}/5).`,
        link,
      );
      return { sent: true };
    }

    if (args.event === "responded") {
      if (!isProvider) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Seul le prestataire peut notifier sa réponse.",
        });
      }
      if (review.providerResponse === undefined) {
        throw new ConvexError({
          code: "INVALID_STATE",
          message: "L'avis n'a pas encore de réponse du prestataire.",
        });
      }
      await dispatch(
        ctx,
        review.reviewerId,
        "Réponse à votre avis",
        `${provider.name} a répondu à votre avis.`,
        link,
      );
      return { sent: true };
    }

    return { sent: false };
  },
});

// ────────────────────────────────────────────────────────────────
// QUESTION
// ────────────────────────────────────────────────────────────────

export const notifyQuestionEvent = mutation({
  args: {
    questionId: v.id("serviceQuestions"),
    event: v.union(v.literal("asked"), v.literal("answered")),
  },
  handler: async (ctx, args): Promise<{ sent: boolean }> => {
    const user = await requireUser(ctx);
    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new ConvexError({
        code: "QUESTION_NOT_FOUND",
        message: "Question introuvable",
      });
    }
    const provider = await ctx.db.get(question.providerId);
    if (!provider) {
      throw new ConvexError({
        code: "PROVIDER_NOT_FOUND",
        message: "Prestataire introuvable",
      });
    }

    const isAsker = question.askerId === user._id;
    const isProvider = provider.userId === user._id;
    if (!isAsker && !isProvider) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'êtes pas partie à cette question.",
      });
    }

    const asker = await ctx.db.get(question.askerId);
    const askerName = asker?.name ?? "Un client";
    const link = `/service/questions/${args.questionId}`;

    if (args.event === "asked") {
      if (!isAsker) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Seul l'auteur peut notifier sa question.",
        });
      }
      if (!provider.userId) return { sent: false };
      await dispatch(
        ctx,
        provider.userId,
        "Nouvelle question",
        `${askerName} a posé une question sur votre profil.`,
        link,
      );
      return { sent: true };
    }

    if (args.event === "answered") {
      if (!isProvider) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Seul le prestataire peut notifier sa réponse.",
        });
      }
      if (question.answer === undefined) {
        throw new ConvexError({
          code: "INVALID_STATE",
          message: "La question n'a pas encore de réponse.",
        });
      }
      await dispatch(
        ctx,
        question.askerId,
        "Réponse à votre question",
        `${provider.name} a répondu à votre question.`,
        link,
      );
      return { sent: true };
    }

    return { sent: false };
  },
});

// ────────────────────────────────────────────────────────────────
// INVOICE
// ────────────────────────────────────────────────────────────────

export const notifyInvoiceEvent = mutation({
  args: {
    invoiceId: v.id("serviceInvoices"),
    event: v.union(v.literal("issued"), v.literal("paid")),
  },
  handler: async (ctx, args): Promise<{ sent: boolean }> => {
    const user = await requireUser(ctx);
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw new ConvexError({
        code: "INVOICE_NOT_FOUND",
        message: "Facture introuvable",
      });
    }
    const provider = await ctx.db.get(invoice.providerId);
    if (!provider) {
      throw new ConvexError({
        code: "PROVIDER_NOT_FOUND",
        message: "Prestataire introuvable",
      });
    }

    const isClient = invoice.userId === user._id;
    const isProvider = provider.userId === user._id;
    if (!isClient && !isProvider) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'êtes pas partie à cette facture.",
      });
    }

    const link = `/service/invoices/${args.invoiceId}`;

    if (args.event === "issued") {
      if (!isProvider) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Seul le prestataire peut notifier l'émission.",
        });
      }
      if (invoice.status !== "issued" && invoice.status !== "paid") {
        throw new ConvexError({
          code: "INVALID_STATE",
          message: "La facture n'est pas émise.",
        });
      }
      await dispatch(
        ctx,
        invoice.userId,
        "Nouvelle facture",
        `Facture ${invoice.number} : ${invoice.amount} ${invoice.currency}.`,
        link,
      );
      return { sent: true };
    }

    if (args.event === "paid") {
      if (!isProvider) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Seul le prestataire peut notifier le paiement.",
        });
      }
      if (invoice.status !== "paid") {
        throw new ConvexError({
          code: "INVALID_STATE",
          message: "La facture n'est pas marquée payée.",
        });
      }
      if (!provider.userId) return { sent: false };
      await dispatch(
        ctx,
        provider.userId,
        "Facture payée",
        `Facture ${invoice.number} payée : ${invoice.amount} ${invoice.currency}.`,
        link,
      );
      return { sent: true };
    }

    return { sent: false };
  },
});

// ────────────────────────────────────────────────────────────────
// VÉRIFICATION — internal (appelée par approveDocument/rejectDocument)
// ────────────────────────────────────────────────────────────────

export const notifyVerificationEventInternal = internalMutation({
  args: {
    providerId: v.id("serviceProviders"),
    event: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args): Promise<{ sent: boolean }> => {
    const provider = await ctx.db.get(args.providerId);
    if (!provider?.userId) return { sent: false };

    const link = "/service/verification";

    if (args.event === "approved") {
      await dispatch(
        ctx,
        provider.userId,
        "Profil vérifié",
        "Votre profil a été vérifié. Badge officiel activé.",
        link,
      );
      return { sent: true };
    }

    await dispatch(
      ctx,
      provider.userId,
      "Vérification refusée",
      "Un de vos documents a été refusé. Consultez le motif.",
      link,
    );
    return { sent: true };
  },
});

// ────────────────────────────────────────────────────────────────
// LITIGE — internal (appelée par disputeBooking / resolveDispute)
// ────────────────────────────────────────────────────────────────

export const notifyDisputeEventInternal = internalMutation({
  args: {
    disputeId: v.id("serviceDisputes"),
    event: v.union(v.literal("opened"), v.literal("resolved")),
  },
  handler: async (ctx, args): Promise<{ sent: boolean }> => {
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) return { sent: false };

    const provider = await ctx.db.get(dispute.againstProviderId);
    const link = `/service/disputes/${args.disputeId}`;

    if (args.event === "opened") {
      if (!provider?.userId) return { sent: false };
      await dispatch(
        ctx,
        provider.userId,
        "Litige ouvert",
        "Un litige a été ouvert sur une de vos prestations.",
        link,
      );
      return { sent: true };
    }

    // resolved : client + provider
    await dispatch(
      ctx,
      dispute.openedBy,
      "Litige résolu",
      "Votre litige a été résolu par la modération.",
      link,
    );

    if (provider?.userId) {
      await dispatch(
        ctx,
        provider.userId,
        "Litige résolu",
        "Le litige vous concernant a été résolu.",
        link,
      );
    }

    return { sent: true };
  },
});
