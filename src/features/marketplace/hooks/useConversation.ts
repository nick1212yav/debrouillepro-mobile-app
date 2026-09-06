// src/features/marketplace/hooks/useConversation.ts
import type { Id } from "@/convex/_generated/dataModel";

export function useConversation() {
  // Stub en attendant l'implémentation Convex
  const getOrCreate = async (participantIds: Id<"users">[]) => {
    console.log("[useConversation] stub - participants:", participantIds);
    // Simuler un ID de conversation
    return `conversation_${Date.now()}` as Id<"conversations">;
  };

  return { getOrCreate };
}
