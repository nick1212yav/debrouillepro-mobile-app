// src/features/sante/ai/HealthAssistant.ts

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export interface HealthAssistantResponse {
  answer: string;
  suggestedQuestions?: string[];
  confidence?: number; // 0-1
}

/**
 * Assistant santé général – répond aux questions médicales courantes,
 * oriente vers des ressources et fournit des conseils de base.
 */
export class HealthAssistant {
  /**
   * Pose une question à l'assistant santé.
   * @param question – La question de l'utilisateur
   * @param context – Contexte optionnel (antécédents, symptômes, etc.)
   * @returns Réponse structurée
   */
  async ask(
    question: string,
    context?: Record<string, any>,
  ): Promise<HealthAssistantResponse> {
    // Simulation d'appel IA – à remplacer par un vrai appel API
    const normalized = question.toLowerCase().trim();

    if (normalized.includes("fièvre") || normalized.includes("température")) {
      return {
        answer:
          "Une fièvre modérée (38-39°C) peut être traitée avec du paracétamol et du repos. Si elle dépasse 39.5°C ou dure plus de 3 jours, consultez un médecin.",
        suggestedQuestions: [
          "Quand consulter ?",
          "Que prendre contre la fièvre ?",
        ],
        confidence: 0.85,
      };
    }

    if (normalized.includes("toux") || normalized.includes("gorge")) {
      return {
        answer:
          "Une toux persistante peut être d'origine virale ou allergique. Buvez beaucoup d'eau, utilisez du miel si vous n'êtes pas diabétique. Si elle s'accompagne de fièvre ou de difficultés respiratoires, consultez rapidement.",
        suggestedQuestions: ["Est-ce grave ?", "Quel médicament prendre ?"],
        confidence: 0.78,
      };
    }

    // Réponse générique
    return {
      answer:
        "Je ne peux pas fournir de diagnostic médical. Je vous recommande de consulter un professionnel de santé pour une évaluation personnalisée.",
      suggestedQuestions: [
        "Quel médecin consulter ?",
        "Où trouver un médecin ?",
      ],
      confidence: 0.5,
    };
  }

  /**
   * Génère des suggestions de questions basées sur un historique de conversation.
   */
  suggestQuestions(history: ChatMessage[]): string[] {
    const last = history[history.length - 1];
    if (!last) return ["Quels sont mes symptômes ?", "Que dois-je faire ?"];
    if (last.content.includes("fièvre"))
      return ["Que prendre contre la fièvre ?", "Quand consulter ?"];
    if (last.content.includes("toux"))
      return ["Comment soulager la toux ?", "Est-ce contagieux ?"];
    return ["Décrivez vos symptômes", "Où avez-vous mal ?"];
  }
}
