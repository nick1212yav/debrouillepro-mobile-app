// src/features/sante/ai/SymptomChecker.ts

export interface SymptomCheckResult {
  condition: string;
  matchScore: number; // 0-100
  commonSymptoms: string[];
  rareSymptoms: string[];
  advice: string;
}

/**
 * Vérificateur de symptômes – compare les symptômes saisis avec une base de connaissances.
 */
export class SymptomChecker {
  /**
   * Analyse les symptômes et retourne les conditions possibles.
   */
  async check(symptoms: string[]): Promise<SymptomCheckResult[]> {
    // Simulation d'un moteur de règles / IA
    const results: SymptomCheckResult[] = [];

    const hasFever = symptoms.some((s) => s.toLowerCase().includes("fièvre"));
    const hasCough = symptoms.some((s) => s.toLowerCase().includes("toux"));
    const hasFatigue = symptoms.some(
      (s) => s.toLowerCase().includes("fatigue") || s.includes("épuisement"),
    );
    const hasHeadache = symptoms.some((s) =>
      s.toLowerCase().includes("maux de tête"),
    );

    if (hasFever && hasCough) {
      results.push({
        condition: "Grippe / COVID-19",
        matchScore: 80,
        commonSymptoms: ["Fièvre", "Toux", "Fatigue", "Courbatures"],
        rareSymptoms: ["Perte d'odorat", "Douleur thoracique"],
        advice:
          "Repos, hydratation, surveillance de la température. Consultez si essoufflement.",
      });
    }

    if (hasHeadache && hasFever) {
      results.push({
        condition: "Migraine fébrile ou infection",
        matchScore: 60,
        commonSymptoms: ["Maux de tête", "Fièvre"],
        rareSymptoms: ["Raideur de la nuque", "Photophobie"],
        advice:
          "Si raideur de la nuque, consultez en urgence (possible méningite).",
      });
    }

    if (hasFatigue && !hasFever) {
      results.push({
        condition: "Fatigue chronique / Anémie",
        matchScore: 40,
        commonSymptoms: ["Fatigue", "Baisse d'énergie"],
        rareSymptoms: ["Pâleur", "Essoufflement"],
        advice: "Consultez pour bilan sanguin (fer, vitamines).",
      });
    }

    if (results.length === 0) {
      results.push({
        condition: "Symptômes non spécifiques",
        matchScore: 20,
        commonSymptoms: symptoms,
        rareSymptoms: [],
        advice: "Surveillez l'évolution. Consultez si aggravation.",
      });
    }

    return results;
  }

  /**
   * Évalue la gravité globale des symptômes.
   */
  assessSeverity(symptoms: string[]): "low" | "moderate" | "high" {
    const severeKeywords = [
      "douleur intense",
      "perte de connaissance",
      "hémorragie",
      "difficulté respiratoire",
    ];
    if (
      symptoms.some((s) =>
        severeKeywords.some((k) => s.toLowerCase().includes(k)),
      )
    ) {
      return "high";
    }
    if (symptoms.length > 3) return "moderate";
    return "low";
  }
}
