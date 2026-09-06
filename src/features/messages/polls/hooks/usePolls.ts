import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { pollsService, type CreatePollInput } from "../services/polls.service";

export function usePolls(conversationId?: Id<"conversations">) {
  const { isAuthenticated } = useConvexAuth();

  const polls = useQuery(
    api.messages.polls.listConversationPolls,
    isAuthenticated && conversationId
      ? {
          conversationId,
          limit: 100,
        }
      : "skip",
  );

  const createPollMutation = useMutation(api.messages.polls.createPoll);

  const voteMutation = useMutation(api.messages.polls.vote);

  const removeVoteMutation = useMutation(api.messages.polls.removeVote);

  const closePollMutation = useMutation(api.messages.polls.closePoll);

  const reopenPollMutation = useMutation(api.messages.polls.reopenPoll);

  const deletePollMutation = useMutation(api.messages.polls.deletePoll);

  const createPoll = async (input: CreatePollInput) => {
    return pollsService.createPoll(createPollMutation, input);
  };

  const vote = async (pollId: Id<"polls">, optionIds: string[]) => {
    return pollsService.vote(voteMutation, {
      pollId,
      optionIds,
    });
  };

  const removeVote = async (pollId: Id<"polls">) => {
    return pollsService.removeVote(removeVoteMutation, pollId);
  };

  const closePoll = async (pollId: Id<"polls">) => {
    return pollsService.closePoll(closePollMutation, pollId);
  };

  const reopenPoll = async (pollId: Id<"polls">) => {
    return pollsService.reopenPoll(reopenPollMutation, pollId);
  };

  const deletePoll = async (pollId: Id<"polls">) => {
    return pollsService.deletePoll(deletePollMutation, pollId);
  };

  return {
    polls: polls ?? [],
    isLoading: polls === undefined,

    createPoll,
    vote,
    removeVote,

    closePoll,
    reopenPoll,
    deletePoll,
  };
}

export function usePoll(pollId?: Id<"polls">) {
  const { isAuthenticated } = useConvexAuth();

  const poll = useQuery(
    api.messages.polls.getPoll,
    isAuthenticated && pollId ? { pollId } : "skip",
  );

  const voteMutation = useMutation(api.messages.polls.vote);

  const removeVoteMutation = useMutation(api.messages.polls.removeVote);

  const closePollMutation = useMutation(api.messages.polls.closePoll);

  const reopenPollMutation = useMutation(api.messages.polls.reopenPoll);

  const deletePollMutation = useMutation(api.messages.polls.deletePoll);

  const vote = async (optionIds: string[]) => {
    if (!pollId) {
      throw new Error("Sondage introuvable");
    }

    return pollsService.vote(voteMutation, {
      pollId,
      optionIds,
    });
  };

  const removeVote = async () => {
    if (!pollId) {
      throw new Error("Sondage introuvable");
    }

    return pollsService.removeVote(removeVoteMutation, pollId);
  };

  const closePoll = async () => {
    if (!pollId) {
      throw new Error("Sondage introuvable");
    }

    return pollsService.closePoll(closePollMutation, pollId);
  };

  const reopenPoll = async () => {
    if (!pollId) {
      throw new Error("Sondage introuvable");
    }

    return pollsService.reopenPoll(reopenPollMutation, pollId);
  };

  const deletePoll = async () => {
    if (!pollId) {
      throw new Error("Sondage introuvable");
    }

    return pollsService.deletePoll(deletePollMutation, pollId);
  };

  return {
    poll: poll ?? null,
    isLoading: poll === undefined,

    vote,
    removeVote,

    closePoll,
    reopenPoll,
    deletePoll,
  };
}
