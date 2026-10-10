// convex/messages/attachments.ts

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireAuthenticatedUser } from "../auth/helpers";

// ============================================================================
// GÉNÉRER UNE URL D'UPLOAD CONVEX STORAGE
// ============================================================================

export const generateUploadUrl = mutation({
  args: {},

  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);

    return await ctx.storage.generateUploadUrl();
  },
});

// ============================================================================
// AJOUTER UNE PIÈCE JOINTE À UN MESSAGE
// ============================================================================

export const addAttachment = mutation({
  args: {
    messageId: v.id("messages"),
    fileId: v.id("_storage"),
    fileName: v.string(),
    mimeType: v.string(),
    fileSize: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    duration: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    // ------------------------------------------------------------------------
    // Vérifier que le message existe
    // ------------------------------------------------------------------------

    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new Error("Message introuvable");
    }

    // ------------------------------------------------------------------------
    // Vérifier que l'utilisateur appartient à la conversation
    // ------------------------------------------------------------------------

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", user._id).eq("conversationId", message.conversationId),
      )
      .unique();

    if (!member) {
      throw new Error("Non autorisé");
    }

    // ------------------------------------------------------------------------
    // Vérifier que l'utilisateur est bien l'expéditeur du message
    // ------------------------------------------------------------------------

    if (message.senderId !== user._id) {
      throw new Error(
        "Vous ne pouvez pas ajouter une pièce jointe à ce message",
      );
    }

    // ------------------------------------------------------------------------
    // Création de la pièce jointe
    // ------------------------------------------------------------------------

    const attachmentId = await ctx.db.insert("attachments", {
      messageId: args.messageId,
      fileId: args.fileId,
      fileName: args.fileName,
      mimeType: args.mimeType,
      fileSize: args.fileSize,
      width: args.width,
      height: args.height,
      duration: args.duration,
      createdAt: new Date().toISOString(),
    });

    return attachmentId;
  },
});

// ============================================================================
// RÉCUPÉRER LES PIÈCES JOINTES D'UN MESSAGE
//
// IMPORTANT :
// Chaque pièce jointe est enrichie avec `mediaUrl`, obtenue via
// ctx.storage.getUrl(fileId). Sans cela, le frontend reçoit uniquement
// un Storage ID opaque, qu'il ne peut pas utiliser dans un lecteur audio
// ni dans un composant <Image source={{ uri }} />.
// ============================================================================

export const getAttachments = query({
  args: {
    messageId: v.id("messages"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    // ------------------------------------------------------------------------
    // Vérifier que le message existe
    // ------------------------------------------------------------------------

    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new Error("Message introuvable");
    }

    // ------------------------------------------------------------------------
    // Vérifier l'accès à la conversation
    // ------------------------------------------------------------------------

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", user._id).eq("conversationId", message.conversationId),
      )
      .unique();

    if (!member) {
      throw new Error("Non autorisé");
    }

    // ------------------------------------------------------------------------
    // Récupérer toutes les pièces jointes
    // ------------------------------------------------------------------------

    const attachments = await ctx.db
      .query("attachments")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .collect();

    // ------------------------------------------------------------------------
    // Résoudre chaque Storage ID en URL publique
    // ------------------------------------------------------------------------

    const enriched = await Promise.all(
      attachments.map(async (attachment) => {
        let mediaUrl: string | null = null;

        try {
          mediaUrl = await ctx.storage.getUrl(attachment.fileId);
        } catch {
          mediaUrl = null;
        }

        return {
          ...attachment,
          mediaUrl,
        };
      }),
    );

    return enriched;
  },
});

// ============================================================================
// SUPPRIMER UNE PIÈCE JOINTE
// ============================================================================

export const deleteAttachment = mutation({
  args: {
    attachmentId: v.id("attachments"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    // ------------------------------------------------------------------------
    // Récupérer la pièce jointe
    // ------------------------------------------------------------------------

    const attachment = await ctx.db.get(args.attachmentId);

    if (!attachment) {
      throw new Error("Pièce jointe introuvable");
    }

    // ------------------------------------------------------------------------
    // Récupérer le message associé
    // ------------------------------------------------------------------------

    const message = await ctx.db.get(attachment.messageId);

    if (!message) {
      throw new Error("Message introuvable");
    }

    // ------------------------------------------------------------------------
    // Vérifier l'appartenance à la conversation
    // ------------------------------------------------------------------------

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", user._id).eq("conversationId", message.conversationId),
      )
      .unique();

    if (!member) {
      throw new Error("Non autorisé");
    }

    // ------------------------------------------------------------------------
    // Seul l'expéditeur du message peut supprimer sa pièce jointe
    // ------------------------------------------------------------------------

    if (message.senderId !== user._id) {
      throw new Error("Vous ne pouvez pas supprimer cette pièce jointe");
    }

    // ------------------------------------------------------------------------
    // Suppression
    // ------------------------------------------------------------------------

    await ctx.db.delete(args.attachmentId);

    return true;
  },
});
