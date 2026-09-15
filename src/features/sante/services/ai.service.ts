// src/features/sante/services/ai.service.ts
import { toast } from "sonner";

export class AIService {
  async ask(question: string) {
    // Simulation – à remplacer par un vrai appel API
    await new Promise((r) => setTimeout(r, 500));
    return { answer: "Réponse simulée", confidence: 0.8 };
  }
}
