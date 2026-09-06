// src/features/sante/ai/DrugInteraction.ts

export interface Drug {
  name: string;
  dosage?: string;
  route?: string;
}

export interface Interaction {
  drug1: string;
  drug2: string;
  severity: "minor" | "moderate" | "major";
  description: string;
  recommendation: string;
}

export interface DrugInteractionResponse {
  interactions: Interaction[];
  summary: string;
}

/**
 * Vérificateur d'interactions médicamenteuses.
 * À utiliser avec précaution – toujours consulter un pharmacien ou médecin.
 */
export class DrugInteractionChecker {
  /**
   * Vérifie les interactions entre deux ou plusieurs médicaments.
   */
  async check(drugs: Drug[]): Promise<DrugInteractionResponse> {
    // Simulation – en réalité, appeler une API comme DrugBank ou openFDA
    const interactions: Interaction[] = [];

    // Exemple simplifié
    for (let i = 0; i < drugs.length; i++) {
      for (let j = i + 1; j < drugs.length; j++) {
        const d1 = drugs[i].name.toLowerCase();
        const d2 = drugs[j].name.toLowerCase();

        if (d1.includes("paracetamol") && d2.includes("ibuprofene")) {
          interactions.push({
            drug1: drugs[i].name,
            drug2: drugs[j].name,
            severity: "moderate",
            description:
              "Risque augmenté d'effets secondaires rénaux si utilisation prolongée.",
            recommendation:
              "Éviter l'association prolongée. Préférer un seul antalgique.",
          });
        }

        if (d1.includes("amoxicilline") && d2.includes("allopurinol")) {
          interactions.push({
            drug1: drugs[i].name,
            drug2: drugs[j].name,
            severity: "minor",
            description: "Risque d'éruption cutanée augmenté.",
            recommendation: "Surveillance clinique.",
          });
        }

        if (d1.includes("warfarin") && d2.includes("aspirine")) {
          interactions.push({
            drug1: drugs[i].name,
            drug2: drugs[j].name,
            severity: "major",
            description: "Risque hémorragique augmenté.",
            recommendation: "Éviter l'association sauf indication formelle.",
          });
        }
      }
    }

    const summary =
      interactions.length === 0
        ? "Aucune interaction majeure détectée dans notre base."
        : `${interactions.length} interaction(s) identifiée(s). Veuillez consulter votre pharmacien.`;

    return { interactions, summary };
  }

  /**
   * Vérifie les interactions avec des aliments ou boissons.
   */
  async checkFoodInteractions(drug: Drug, food: string): Promise<string> {
    const drugName = drug.name.toLowerCase();
    if (drugName.includes("warfarin") && food.toLowerCase().includes("chou")) {
      return "La vitamine K des choux peut réduire l'efficacité de la warfarine. Maintenez une alimentation constante.";
    }
    if (
      drugName.includes("statine") &&
      food.toLowerCase().includes("pamplemousse")
    ) {
      return "Le pamplemousse augmente le risque d'effets secondaires des statines. Évitez la consommation.";
    }
    return "Aucune interaction alimentaire majeure connue.";
  }
}
