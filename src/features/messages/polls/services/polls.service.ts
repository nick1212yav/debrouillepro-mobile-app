import type { Id } from "@/convex/_generated/dataModel";

export interface PollOptionInput {
  id: string;
  text: string;
}

export interface CreatePollInput {
  conversationId: Id<"conversations">;
  question: string;
  options: PollOptionInput[];
  multipleChoice: boolean;
  anonymous: boolean;
  expiresAt?: string;
  messageId?: Id<"messages">;
}

export interface VotePollInput {
  pollId: Id<"polls">;
  optionIds: string[];
}

type Mutation<TArgs, TResult> = (args: TArgs) => Promise<TResult>;

export const pollsService = {
  async createPoll<TResult>(
    mutation: Mutation<CreatePollInput, TResult>,
    input: CreatePollInput,
  ): Promise<TResult> {
    const question = input.question.trim();

    if (!question) {
      throw new Error("La question du sondage est obligatoire");
    }

    const options = input.options
      .map((option) => ({
        id: option.id,
        text: option.text.trim(),
      }))
      .filter((option) => option.text.length > 0);

    if (options.length < 2) {
      throw new Error("Un sondage doit avoir au moins deux choix");
    }

    if (options.length > 20) {
      throw new Error("Un sondage ne peut pas contenir plus de 20 choix");
    }

    return mutation({
      ...input,
      question,
      options,
    });
  },

  async vote<TResult>(
    mutation: Mutation<VotePollInput, TResult>,
    input: VotePollInput,
  ): Promise<TResult> {
    const optionIds = [...new Set(input.optionIds)];

    if (optionIds.length === 0) {
      throw new Error("Sélectionnez au moins une réponse");
    }

    return mutation({
      pollId: input.pollId,
      optionIds,
    });
  },

  async removeVote<TResult>(
    mutation: Mutation<{ pollId: Id<"polls"> }, TResult>,
    pollId: Id<"polls">,
  ): Promise<TResult> {
    return mutation({ pollId });
  },

  async closePoll<TResult>(
    mutation: Mutation<{ pollId: Id<"polls"> }, TResult>,
    pollId: Id<"polls">,
  ): Promise<TResult> {
    return mutation({ pollId });
  },

  async reopenPoll<TResult>(
    mutation: Mutation<{ pollId: Id<"polls"> }, TResult>,
    pollId: Id<"polls">,
  ): Promise<TResult> {
    return mutation({ pollId });
  },

  async deletePoll<TResult>(
    mutation: Mutation<{ pollId: Id<"polls"> }, TResult>,
    pollId: Id<"polls">,
  ): Promise<TResult> {
    return mutation({ pollId });
  },
};
