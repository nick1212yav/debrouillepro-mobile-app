// src/features/sante/hooks/useHealthAI.ts
import { useState } from "react";

export function useHealthAI() {
  const [isLoading, setIsLoading] = useState(false);
  const askAI = async (question: string) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setIsLoading(false);
    return { answer: "Réponse simulée", confidence: 0.8 };
  };
  return { askAI, isLoading };
}
