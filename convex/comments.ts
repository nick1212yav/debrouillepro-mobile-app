// convex/comments.ts
import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api.js";
import type { Doc, Id } from "./_generated/dataModel.d.ts";

type EnrichedComment = Doc<"comments"> & {
  author: { name?: string; avatar?: string } | null;
  likedByMe: boolean;
};

/**
 * Helper pour obtenir l'utilisateur courant
 */
async function getCurrentUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

/**
 * Liste des commentaires d'une publication (avec pagination).
 * Pour NetworkDetailPage : on utilise un tri ascendant (les plus anciens en premier)
 * pour un affichage chronologique, et on calcule `likedByMe`.
 */
export const listComments = query({
  args: {
    publicationId: v.id("publications"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<EnrichedComment[]> => {
    const limit = args.limit ?? 50;
    const currentUser = await getCurrentUser(ctx);

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_publication", (q) =>
        q.eq("publicationId", args.publicationId),
      )
      .order("asc")
      .take(limit);

    // Récupérer les likes de l'utilisateur courant sur ces commentaires
    const commentIds = comments.map((c) => c._id);
    let userLikes = new Set();
    if (currentUser && commentIds.length > 0) {
      const likes = await ctx.db
        .query("commentLikes")
        .withIndex("by_user_and_comment", (q) =>
          q.eq("userId", currentUser._id),
        )
        .collect();
      userLikes = new Set(
        likes
          .filter((l) => commentIds.includes(l.commentId))
          .map((l) => l.commentId),
      );
    }

    // Enrichir les commentaires avec l'auteur et le likedByMe
    return Promise.all(
      comments.map(async (c) => {
        const author = await ctx.db.get(c.authorId);
        return {
          ...c,
          author: author ? { name: author.name, avatar: author.avatar } : null,
          likedByMe: userLikes.has(c._id),
        };
      }),
    );
  },
});

/**
 * Créer un commentaire
 */
export const createComment = mutation({
  args: {
    publicationId: v.id("publications"),
    text: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args): Promise<Id<"comments">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity)
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Connexion requise",
      });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Utilisateur introuvable",
      });

    const text = args.text.trim();
    if (text.length === 0)
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Commentaire vide",
      });
    if (text.length > 1000)
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Commentaire trop long",
      });

    const commentId = await ctx.db.insert("comments", {
      publicationId: args.publicationId,
      authorId: user._id,
      text,
      parentId: args.parentId,
      likeCount: 0,
    });

    // Incrémenter le compteur sur la publication
    const pub = await ctx.db.get(args.publicationId);
    if (pub) {
      await ctx.db.patch(args.publicationId, {
        commentCount: (pub.commentCount || 0) + 1,
      });
      // Notifier l'auteur de la publication (sauf si c'est l'auteur du commentaire)
      if (pub.authorId !== user._id) {
        await ctx.scheduler.runAfter(0, internal.notifications.createSocial, {
          toUserId: pub.authorId,
          fromUserId: user._id,
          type: "comment",
          fromUserName: user.name,
          fromUserAvatar: user.avatar,
          publicationId: args.publicationId,
          title: `${user.name ?? "Quelqu'un"} a commenté votre publication`,
          body: text.length > 80 ? text.slice(0, 80) + "…" : text,
          actionPage: "home",
        });
      }
    }

    return commentId;
  },
});

/**
 * Liker un commentaire (toggle)
 */
export const likeComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user)
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Connexion requise",
      });

    const comment = await ctx.db.get(args.commentId);
    if (!comment)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Commentaire introuvable",
      });

    const existing = await ctx.db
      .query("commentLikes")
      .withIndex("by_user_and_comment", (q) =>
        q.eq("userId", user._id).eq("commentId", args.commentId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.commentId, {
        likeCount: Math.max(0, (comment.likeCount || 0) - 1),
      });
    } else {
      await ctx.db.insert("commentLikes", {
        userId: user._id,
        commentId: args.commentId,
      });
      await ctx.db.patch(args.commentId, {
        likeCount: (comment.likeCount || 0) + 1,
      });
    }
  },
});

/**
 * Supprimer un commentaire (seulement celui de l'utilisateur)
 */
export const remove = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity)
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Connexion requise",
      });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Utilisateur introuvable",
      });

    const comment = await ctx.db.get(args.commentId);
    if (!comment)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Commentaire introuvable",
      });
    if (comment.authorId !== user._id)
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });

    await ctx.db.delete(args.commentId);

    // Décrémenter le compteur
    const pub = await ctx.db.get(comment.publicationId);
    if (pub && pub.commentCount > 0) {
      await ctx.db.patch(comment.publicationId, {
        commentCount: pub.commentCount - 1,
      });
    }
  },
});
