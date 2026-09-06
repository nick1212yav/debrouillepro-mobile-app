export interface Macros {
  proteins: number;
  carbs: number;
  lipids: number;
}

export class NutritionUtils {
  /**
   * Calcule le total calorique basé sur le bilan des macronutriments (Formule d'Atwater)
   * Protéines: 4 kcal/g, Glucides: 4 kcal/g, Lipides: 9 kcal/g
   */
  public static calculateCaloriesFromMacros(macros: Macros): number {
    return Math.round(
      macros.proteins * 4 + macros.carbs * 4 + macros.lipids * 9,
    );
  }

  /**
   * Calcule le pourcentage de répartition calorique de chaque macro-nutriment
   */
  public static getMacroPercentageDistribution(macros: Macros): {
    proteinsPct: number;
    carbsPct: number;
    lipidsPct: number;
  } {
    const totalCalories = this.calculateCaloriesFromMacros(macros);
    if (totalCalories === 0) {
      return { proteinsPct: 0, carbsPct: 0, lipidsPct: 0 };
    }

    const proteinsKcal = macros.proteins * 4;
    const carbsKcal = macros.carbs * 4;
    const lipidsKcal = macros.lipids * 9;

    return {
      proteinsPct: Number(((proteinsKcal / totalCalories) * 100).toFixed(1)),
      carbsPct: Number(((carbsKcal / totalCalories) * 100).toFixed(1)),
      lipidsPct: Number(((lipicsKcal() / totalCalories) * 100).toFixed(1)),
    };

    function lipicsKcal() {
      return lipidsKcal;
    }
  }

  /**
   * Analyse l'équilibre d'une assiette selon les standards nutritionnels (Équilibre recherché: 50% Glucides, 20% Protéines, 30% Lipides)
   */
  public static analyzeAssietteBalance(macros: Macros): {
    isBalanced: boolean;
    feedback: string;
  } {
    const { proteinsPct, carbsPct, lipidsPct } =
      this.getMacroPercentageDistribution(macros);

    if (proteinsPct === 0 && carbsPct === 0 && lipidsPct === 0) {
      return {
        isBalanced: false,
        feedback: "Aucune valeur nutritionnelle détectée.",
      };
    }

    if (lipidsPct > 40) {
      return {
        isBalanced: false,
        feedback:
          "Ce plat présente une concentration lipidique élevée. Idéal pour un repas de triche, mais à limiter au quotidien.",
      };
    }

    if (proteinsPct < 15) {
      return {
        isBalanced: false,
        feedback:
          "Le taux de protéines de cette assiette est un peu bas. Pensez à l'associer à une source de viande blanche ou légumineuse.",
      };
    }

    return {
      isBalanced: true,
      feedback:
        "L'assiette présente un équilibre macronutritionnel remarquable, favorable à une bonne digestion.",
    };
  }
}
