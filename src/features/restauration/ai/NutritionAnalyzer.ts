export interface NutritionValues {
  calories: number;
  proteins: number; // en grammes
  carbohydrates: number; // en grammes
  lipids: number; // en grammes
  sodium: number; // en milligrammes
  fiber: number; // en grammes
}

export interface MealAnalysisResult {
  totalMacros: NutritionValues;
  healthScore: "A" | "B" | "C" | "D" | "E";
  nutritionAdvice: string[];
  warnings: string[];
}

export class NutritionAnalyzer {
  /**
   * Analyse le profil nutritionnel global d'une sélection de plats
   */
  public static analyzeMeal(
    dishes: {
      item: { name: string; price: number };
      quantity: number;
      nutrition: NutritionValues;
    }[],
  ): MealAnalysisResult {
    const totalMacros: NutritionValues = {
      calories: 0,
      proteins: 0,
      carbohydrates: 0,
      lipids: 0,
      sodium: 0,
      fiber: 0,
    };

    let totalWeightFactor = 0;

    for (const entry of dishes) {
      const q = entry.quantity;
      totalMacros.calories += entry.nutrition.calories * q;
      totalMacros.proteins += entry.nutrition.proteins * q;
      totalMacros.carbohydrates += entry.nutrition.carbohydrates * q;
      totalMacros.lipids += entry.nutrition.lipids * q;
      totalMacros.sodium += entry.nutrition.sodium * q;
      totalMacros.fiber += entry.nutrition.fiber * q;
      totalWeightFactor += q;
    }

    const warnings: string[] = [];
    const nutritionAdvice: string[] = [];

    if (totalWeightFactor === 0) {
      return {
        totalMacros,
        healthScore: "C",
        nutritionAdvice: ["Ajoutez des articles pour démarrer l'analyse."],
        warnings: [],
      };
    }

    // Calcul empirique du score de santé (Heuristique basée sur la densité calorique et les apports)
    let penaltyPoints = 0;

    // Densité calorique par portion théorique
    const avgCalories = totalMacros.calories / totalWeightFactor;
    if (avgCalories > 600) penaltyPoints += 15;
    else if (avgCalories > 400) penaltyPoints += 7;

    // Lipides élevés
    const avgLipids = totalMacros.lipids / totalWeightFactor;
    if (avgLipids > 25) {
      penaltyPoints += 10;
      warnings.push("Taux de matières grasses élevé détecté.");
    }

    // Sodium élevé
    const avgSodium = totalMacros.sodium / totalWeightFactor;
    if (avgSodium > 1000) {
      penaltyPoints += 12;
      warnings.push("Teneur en sel importante.");
    }

    // Bonus pour les protéines et les fibres
    const avgProteins = totalMacros.proteins / totalWeightFactor;
    const avgFiber = totalMacros.fiber / totalWeightFactor;
    let bonusPoints = 0;
    if (avgProteins > 20) bonusPoints += 8;
    if (avgFiber > 5) bonusPoints += 10;

    const netScore = penaltyPoints - bonusPoints;

    let healthScore: "A" | "B" | "C" | "D" | "E" = "C";
    if (netScore <= 0) healthScore = "A";
    else if (netScore <= 10) healthScore = "B";
    else if (netScore <= 20) healthScore = "C";
    else if (netScore <= 30) healthScore = "D";
    else healthScore = "E";

    // Recommandations intelligentes
    if (avgProteins < 12) {
      nutritionAdvice.push(
        "Envisagez d'associer ce repas à une source de protéines maigres (poulet, poisson blanc, tofu).",
      );
    } else {
      nutritionAdvice.push(
        "Excellent apport en protéines pour soutenir votre métabolisme.",
      );
    }

    if (avgFiber < 3) {
      nutritionAdvice.push(
        "Pensez à ajouter des légumes verts ou des légumineuses pour enrichir votre apport en fibres digestes.",
      );
    }

    if (totalMacros.calories > 1000) {
      nutritionAdvice.push(
        "Ce panier constitue un apport énergétique majeur. Idéal pour une phase de récupération intensive.",
      );
    }

    return {
      totalMacros,
      healthScore,
      nutritionAdvice,
      warnings,
    };
  }
}
