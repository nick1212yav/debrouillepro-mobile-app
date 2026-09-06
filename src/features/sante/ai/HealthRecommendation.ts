// src/features/sante/ai/HealthRecommendation.ts

export interface HealthProfile {
  age: number;
  gender: "male" | "female" | "other";
  weight?: number; // kg
  height?: number; // cm
  bloodPressure?: { systolic: number; diastolic: number };
  cholesterol?: { total: number; hdl: number; ldl: number };
  smoking?: boolean;
  alcohol?: boolean;
  physicalActivity?: "low" | "moderate" | "high";
  knownConditions?: string[];
}

export interface Recommendation {
  category: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  reference?: string;
}

/**
 * Génère des recommandations de santé personnalisées (prévention, style de vie).
 */
export class HealthRecommendationEngine {
  /**
   * Recommande des actions basées sur le profil de santé.
   */
  async recommend(profile: HealthProfile): Promise<Recommendation[]> {
    const recs: Recommendation[] = [];

    // Âge
    if (profile.age >= 50) {
      recs.push({
        category: "dépistage",
        title: "Dépistage du cancer colorectal",
        description:
          "Test de recherche de sang dans les selles ou coloscopie tous les 2 ans.",
        priority: "high",
        reference: "Recommandations HAS",
      });
    }

    // IMC
    if (profile.weight && profile.height) {
      const heightM = profile.height / 100;
      const bmi = profile.weight / (heightM * heightM);
      if (bmi > 30) {
        recs.push({
          category: "nutrition",
          title: "Réduction du poids",
          description:
            "Objectif : perdre 5-10% du poids pour réduire les risques cardiovasculaires.",
          priority: "high",
        });
      } else if (bmi < 18.5) {
        recs.push({
          category: "nutrition",
          title: "Surveillance de la maigreur",
          description:
            "Consultez un nutritionniste pour un bilan et un conseil diététique.",
          priority: "medium",
        });
      }
    }

    // Pression artérielle
    if (profile.bloodPressure) {
      const { systolic, diastolic } = profile.bloodPressure;
      if (systolic >= 140 || diastolic >= 90) {
        recs.push({
          category: "cardiovasculaire",
          title: "Contrôle de la pression artérielle",
          description:
            "Mesure régulière, réduction du sel, activité physique. Traitement si besoin.",
          priority: "high",
        });
      }
    }

    // Tabac
    if (profile.smoking) {
      recs.push({
        category: "tabacologie",
        title: "Arrêt du tabac",
        description:
          "Consultation tabacologue, substituts nicotiniques, suivi.",
        priority: "high",
      });
    }

    // Activité physique
    if (profile.physicalActivity === "low") {
      recs.push({
        category: "activité physique",
        title: "Augmenter l'activité physique",
        description:
          "Objectif : 30 minutes de marche rapide par jour, 5 jours par semaine.",
        priority: "medium",
      });
    }

    if (recs.length === 0) {
      recs.push({
        category: "général",
        title: "Maintenir un mode de vie sain",
        description:
          "Alimentation équilibrée, activité régulière, sommeil suffisant.",
        priority: "low",
      });
    }

    return recs;
  }
}
