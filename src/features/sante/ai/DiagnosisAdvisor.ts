// src/features/sante/ai/DiagnosisAdvisor.ts

export interface Symptom {
  id: string;
  name: string;
  severity: "mild" | "moderate" | "severe";
  duration?: string; // ex: "2 jours"
}

export interface PossibleDiagnosis {
  condition: string;
  probability: number; // 0-1
  urgency: "low" | "medium" | "high";
  suggestedSpecialty?: string;
  description: string;
}

export interface DiagnosisAdvisorResponse {
  possibleDiagnoses: PossibleDiagnosis[];
  disclaimer: string;
  recommendedAction: string;
}

/**
 * Aide au diagnostic différentiel basé sur des symptômes.
 * Ce n'est pas un diagnostic médical, mais un outil d'orientation.
 */
export class DiagnosisAdvisor {
  /**
   * Analyse les symptômes et retourne des hypothèses de diagnostic.
   */
  async analyze(
    symptoms: Symptom[],
    context?: Record<string, any>,
  ): Promise<DiagnosisAdvisorResponse> {
    // Simulation d'un moteur de règles – à remplacer par un vrai modèle IA
    const diagnoses: PossibleDiagnosis[] = [];

    const hasFever = symptoms.some(
      (s) =>
        s.name.toLowerCase().includes("fièvre") || s.name.includes("fever"),
    );
    const hasCough = symptoms.some(
      (s) => s.name.toLowerCase().includes("toux") || s.name.includes("cough"),
    );
    const hasHeadache = symptoms.some(
      (s) =>
        s.name.toLowerCase().includes("maux de tête") ||
        s.name.includes("headache"),
    );

    if (hasFever && hasCough) {
      diagnoses.push({
        condition: "Infection respiratoire (grippe, COVID-19, etc.)",
        probability: 0.7,
        urgency: "medium",
        suggestedSpecialty: "Médecin généraliste",
        description:
          "Symptômes compatibles avec une infection virale respiratoire.",
      });
    }

    if (hasHeadache && hasFever) {
      diagnoses.push({
        condition: "Migraine fébrile ou méningite ?",
        probability: 0.2,
        urgency: "high",
        suggestedSpecialty: "Urgences",
        description:
          "Possible infection méningée, nécessite une évaluation rapide.",
      });
    }

    if (
      symptoms.some(
        (s) =>
          s.name.toLowerCase().includes("douleur") && s.severity === "severe",
      )
    ) {
      diagnoses.push({
        condition: "Douleur aiguë d'origine inconnue",
        probability: 0.5,
        urgency: "high",
        suggestedSpecialty: "Urgences",
        description: "Douleur sévère justifiant une consultation en urgence.",
      });
    }

    if (diagnoses.length === 0) {
      diagnoses.push({
        condition: "Symptômes non spécifiques",
        probability: 0.3,
        urgency: "low",
        suggestedSpecialty: "Médecin généraliste",
        description:
          "Les symptômes sont peu spécifiques. Une consultation est recommandée si persistance.",
      });
    }

    return {
      possibleDiagnoses: diagnoses,
      disclaimer:
        "⚠️ Ceci est une analyse préliminaire non médicale. Ne remplace pas un diagnostic professionnel.",
      recommendedAction: diagnoses.some((d) => d.urgency === "high")
        ? "Consultez immédiatement les urgences ou appelez le 15."
        : "Prenez un rendez-vous chez un médecin généraliste.",
    };
  }

  /**
   * Vérifie si les symptômes nécessitent une urgence.
   */
  isEmergency(symptoms: Symptom[]): boolean {
    return symptoms.some(
      (s) =>
        s.severity === "severe" ||
        s.name.toLowerCase().includes("perte de conscience"),
    );
  }
}
