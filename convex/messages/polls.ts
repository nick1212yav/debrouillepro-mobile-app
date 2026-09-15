// convex/messages/polls.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireAuthenticatedUser } from "../auth/helpers";

// ============================================================================
// VALIDATORS
// ============================================================================

const pollOptionValidator = v.object({
  id: v.string(),
  text: v.string(),
});

const pollVoteValidator = v.object({
  optionId: v.string(),
  userId: v.id("users"),
});

// ============================================================================
// HELPERS
// ============================================================================

async function requireConversationMember(
  ctx: any,
  conversationId: any,
  userId: any,
) {
  const member = await ctx.db
    .query("conversationMembers")
    .withIndex("by_user_and_conversation", (q: any) =>
      q.eq("userId", userId).eq("conversationId", conversationId),
    )
    .unique();

  if (!member) {
    throw new Error("Vous n'êtes pas membre de cette conversation");
  }

  return member;
}

async function requirePollAccess(ctx: any, pollId: any, userId: any) {
  const poll = await ctx.db.get(pollId);

  if (!poll) {
    throw new Error("Sondage introuvable");
  }

  await requireConversationMember(ctx, poll.conversationId, userId);

  return poll;
}

// ============================================================================
// CRÉER UN SONDAGE
// ============================================================================

export const createPoll = mutation({
  args: {
    conversationId: v.id("conversations"),
    question: v.string(),
    options: v.array(pollOptionValidator),
    multipleChoice: v.boolean(),
    anonymous: v.boolean(),
    expiresAt: v.optional(v.string()),
    messageId: v.optional(v.id("messages")),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    await requireConversationMember(ctx, args.conversationId, user._id);

    const question = args.question.trim();

    if (!question) {
      throw new Error("La question du sondage est obligatoire");
    }

    if (args.options.length < 2) {
      throw new Error("Un sondage doit avoir au moins deux choix");
    }

    if (args.options.length > 20) {
      throw new Error("Un sondage ne peut pas contenir plus de 20 choix");
    }

    const optionIds = new Set<string>();

    const options = args.options.map((option) => {
      const text = option.text.trim();

      if (!text) {
        throw new Error("Chaque choix doit avoir un texte");
      }

      if (optionIds.has(option.id)) {
        throw new Error("Les identifiants des choix doivent être uniques");
      }

      optionIds.add(option.id);

      return {
        id: option.id,
        text,
      };
    });

    if (args.expiresAt) {
      const expiration = new Date(args.expiresAt).getTime();

      if (Number.isNaN(expiration)) {
        throw new Error("La date d'expiration est invalide");
      }

      if (expiration <= Date.now()) {
        throw new Error("La date d'expiration doit être dans le futur");
      }
    }

    const now = new Date().toISOString();

    const pollId = await ctx.db.insert("polls", {
      conversationId: args.conversationId,
      creatorId: user._id,
      question,
      options,
      multipleChoice: args.multipleChoice,
      anonymous: args.anonymous,
      expiresAt: args.expiresAt,
      messageId: args.messageId,
      closed: false,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(pollId);
  },
});

// ============================================================================
// VOTER
// ============================================================================

export const vote = mutation({
  args: {
    pollId: v.id("polls"),
    optionIds: v.array(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const poll = await requirePollAccess(ctx, args.pollId, user._id);

    if (poll.closed) {
      throw new Error("Ce sondage est fermé");
    }

    if (poll.expiresAt && new Date(poll.expiresAt).getTime() <= Date.now()) {
      throw new Error("Ce sondage a expiré");
    }

    if (args.optionIds.length === 0) {
      throw new Error("Sélectionnez au moins une réponse");
    }

    if (!poll.multipleChoice && args.optionIds.length > 1) {
      throw new Error("Ce sondage n'autorise qu'une seule réponse");
    }

    const uniqueOptionIds = [...new Set(args.optionIds)];

    const validOptionIds = new Set(
      poll.options.map((option: { id: string }) => option.id),
    );

    for (const optionId of uniqueOptionIds) {
      if (!validOptionIds.has(optionId)) {
        throw new Error("Une des réponses sélectionnées est invalide");
      }
    }

    // ------------------------------------------------------------------------
    // Supprimer les votes précédents de l'utilisateur
    // ------------------------------------------------------------------------

    const previousVotes = await ctx.db
      .query("pollVotes")
      .withIndex("by_poll_and_user", (q) =>
        q.eq("pollId", args.pollId).eq("userId", user._id),
      )
      .collect();

    for (const previousVote of previousVotes) {
      await ctx.db.delete(previousVote._id);
    }

    // ------------------------------------------------------------------------
    // Créer les nouveaux votes
    // ------------------------------------------------------------------------

    const now = new Date().toISOString();

    for (const optionId of uniqueOptionIds) {
      await ctx.db.insert("pollVotes", {
        pollId: args.pollId,
        userId: user._id,
        optionId,
        createdAt: now,
      });
    }

    await ctx.db.patch(args.pollId, {
      updatedAt: now,
    });

    return {
      pollId: args.pollId,
      optionIds: uniqueOptionIds,
    };
  },
});

// ============================================================================
// RETIRER SON VOTE
// ============================================================================

export const removeVote = mutation({
  args: {
    pollId: v.id("polls"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    await requirePollAccess(ctx, args.pollId, user._id);

    const votes = await ctx.db
      .query("pollVotes")
      .withIndex("by_poll_and_user", (q) =>
        q.eq("pollId", args.pollId).eq("userId", user._id),
      )
      .collect();

    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }

    await ctx.db.patch(args.pollId, {
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
    };
  },
});

// ============================================================================
// RÉCUPÉRER UN SONDAGE
// ============================================================================

export const getPoll = query({
  args: {
    pollId: v.id("polls"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const poll = await requirePollAccess(ctx, args.pollId, user._id);

    const votes = await ctx.db
      .query("pollVotes")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    const currentUserVotes = votes
      .filter((vote) => vote.userId === user._id)
      .map((vote) => vote.optionId);

    const totalVotes = new Set(votes.map((vote) => vote.userId)).size;

    const optionResults = poll.options.map(
      (option: { id: string; text: string }) => {
        const optionVotes = votes.filter((vote) => vote.optionId === option.id);

        const voteCount = optionVotes.length;

        const percentage =
          totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

        return {
          id: option.id,
          text: option.text,
          voteCount,
          percentage,
        };
      },
    );

    return {
      ...poll,
      results: optionResults,
      totalVotes,
      currentUserVotes,
      expired:
        !!poll.expiresAt && new Date(poll.expiresAt).getTime() <= Date.now(),
    };
  },
});

// ============================================================================
// RÉSULTATS DU SONDAGE
// ============================================================================

export const getPollResults = query({
  args: {
    pollId: v.id("polls"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const poll = await requirePollAccess(ctx, args.pollId, user._id);

    const votes = await ctx.db
      .query("pollVotes")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    const totalVotes = new Set(votes.map((vote) => vote.userId)).size;

    const results = poll.options.map((option: { id: string; text: string }) => {
      const optionVotes = votes.filter(
        (vote) => vote.optionId === option.id,
      ).length;

      return {
        optionId: option.id,
        text: option.text,
        votes: optionVotes,
        percentage:
          totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0,
      };
    });

    return {
      pollId: poll._id,
      question: poll.question,
      totalVotes,
      multipleChoice: poll.multipleChoice,
      anonymous: poll.anonymous,
      closed: poll.closed,
      expiresAt: poll.expiresAt,
      results,
    };
  },
});

// ============================================================================
// RÉCUPÉRER LES VOTES DE L'UTILISATEUR
// ============================================================================

export const getMyVote = query({
  args: {
    pollId: v.id("polls"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    await requirePollAccess(ctx, args.pollId, user._id);

    const votes = await ctx.db
      .query("pollVotes")
      .withIndex("by_poll_and_user", (q) =>
        q.eq("pollId", args.pollId).eq("userId", user._id),
      )
      .collect();

    return votes.map((vote) => vote.optionId);
  },
});

// ============================================================================
// FERMER UN SONDAGE
// ============================================================================

export const closePoll = mutation({
  args: {
    pollId: v.id("polls"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const poll = await requirePollAccess(ctx, args.pollId, user._id);

    if (poll.creatorId !== user._id) {
      throw new Error("Seul le créateur peut fermer ce sondage");
    }

    if (poll.closed) {
      return poll;
    }

    const now = new Date().toISOString();

    await ctx.db.patch(args.pollId, {
      closed: true,
      updatedAt: now,
    });

    return await ctx.db.get(args.pollId);
  },
});

// ============================================================================
// RÉOUVRIR UN SONDAGE
// ============================================================================

export const reopenPoll = mutation({
  args: {
    pollId: v.id("polls"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const poll = await requirePollAccess(ctx, args.pollId, user._id);

    if (poll.creatorId !== user._id) {
      throw new Error("Seul le créateur peut rouvrir ce sondage");
    }

    if (poll.expiresAt && new Date(poll.expiresAt).getTime() <= Date.now()) {
      throw new Error("Impossible de rouvrir un sondage expiré");
    }

    await ctx.db.patch(args.pollId, {
      closed: false,
      updatedAt: new Date().toISOString(),
    });

    return await ctx.db.get(args.pollId);
  },
});

// ============================================================================
// SUPPRIMER UN SONDAGE
// ============================================================================

export const deletePoll = mutation({
  args: {
    pollId: v.id("polls"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const poll = await requirePollAccess(ctx, args.pollId, user._id);

    if (poll.creatorId !== user._id) {
      throw new Error("Seul le créateur peut supprimer ce sondage");
    }

    const votes = await ctx.db
      .query("pollVotes")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }

    await ctx.db.delete(args.pollId);

    return {
      success: true,
    };
  },
});

// ============================================================================
// LISTE DES SONDAGES D'UNE CONVERSATION
// ============================================================================

export const listConversationPolls = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    await requireConversationMember(ctx, args.conversationId, user._id);

    const limit = Math.min(Math.max(args.limit ?? 20, 1), 100);

    const polls = await ctx.db
      .query("polls")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    return polls
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  },
});
