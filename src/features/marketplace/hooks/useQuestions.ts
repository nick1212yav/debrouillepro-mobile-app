// src/features/marketplace/hooks/useQuestions.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useQuestions(productId: Id<"products"> | undefined) {
  const questionsData = useQuery(
    api.commerce.getProductQuestions,
    productId ? { productId } : "skip",
  );

  const askMutation = useMutation(api.commerce.askQuestion);
  const answerMutation = useMutation(api.commerce.answerQuestion);

  const questions = (questionsData ?? []).map((q: any) => ({
    id: q._id,
    question: q.question,
    answer: q.answer,
    authorName: q.authorName,
    authorAvatar: q.authorAvatar,
    createdAt: q._creationTime,
    answeredAt: q.answeredAt,
  }));

  const ask = async (text: string) => {
    if (!productId) return;
    await askMutation({ productId, question: text });
  };

  const answer = async (questionId: string, text: string) => {
    await answerMutation({
      questionId: questionId as Id<"productQuestions">,
      answer: text,
    });
  };

  return { questions, ask, answer, isLoading: questionsData === undefined };
}
