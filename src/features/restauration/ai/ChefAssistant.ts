export interface RecipeIngredient {
  name: string;
  cost: number; // en FCFA ou devise locale
  quantity: number;
  unit: string;
  isImported: boolean;
  perishableDays: number;
}

export interface ChefFeedback {
  localAlternatives: Array<{
    original: string;
    replacement: string;
    estimatedSavings: number;
    reason: string;
  }>;
  costReductionTips: string[];
  shelfLifeAlerts: string[];
  fusionSuggestion: string;
}

export class ChefAssistant {
  /**
   * Analyse une recette professionnelle et fournit des ajustements opérationnels et créatifs
   */
  public static optimizeRecipe(
    recipeName: string,
    ingredients: RecipeIngredient[],
    targetPrice: number,
  ): ChefFeedback {
    const localAlternatives: ChefFeedback["localAlternatives"] = [];
    const costReductionTips: string[] = [];
    const shelfLifeAlerts: string[] = [];

    let totalCost = ingredients.reduce(
      (sum, item) => sum + item.cost * item.quantity,
      0,
    );

    // Analyse des ingrédients importés et recherche d'alternatives subsahariennes / locales
    for (const ing of ingredients) {
      if (ing.isImported) {
        const lowerName = ing.name.toLowerCase();
        if (
          lowerName.includes("pomme de terre") ||
          lowerName.includes("frite")
        ) {
          localAlternatives.push({
            original: ing.name,
            replacement: "Banane Plantain (Alloco) ou Igname locale",
            estimatedSavings: ing.cost * 0.4,
            reason:
              "Réduit l'empreinte carbone et tire parti des productions agricoles locales abondantes.",
          });
        } else if (
          lowerName.includes("riz parfumé") ||
          lowerName.includes("riz basmati")
        ) {
          localAlternatives.push({
            original: ing.name,
            replacement: "Riz local de l'Ouest (Riz de Man ou de Gagnoa)",
            estimatedSavings: ing.cost * 0.3,
            reason:
              "Valorise l'agriculture régionale tout en réduisant les coûts de douane.",
          });
        } else if (lowerName.includes("crème fraîche")) {
          localAlternatives.push({
            original: ing.name,
            replacement: "Lait de coco pressé à chaud",
            estimatedSavings: ing.cost * 0.25,
            reason:
              "Une alternative végétale onctueuse qui confère une note tropicale unique.",
          });
        }
      }

      // Alerte péremption rapide
      if (ing.perishableDays <= 3) {
        shelfLifeAlerts.push(
          `L'ingrédient '${ing.name}' se périme sous ${ing.perishableDays} jours. Planifiez des portions limitées.`,
        );
      }
    }

    // Conseils de réduction de coûts
    if (totalCost > targetPrice) {
      const difference = totalCost - targetPrice;
      costReductionTips.push(
        `Le coût de revient est supérieur de ${difference.toLocaleString()} FCFA à votre objectif.`,
      );
      costReductionTips.push(
        "Envisagez d'ajuster la portion à la baisse ou d'optimiser l'approvisionnement en gros volumes pour les ingrédients non périssables.",
      );
    } else {
      costReductionTips.push(
        "Structure financière de la recette équilibrée et optimisée.",
      );
    }

    // Heuristique de suggestion gastronomique
    let fusionSuggestion = "";
    const names = ingredients.map((i) => i.name.toLowerCase());
    if (names.some((n) => n.includes("chocolat") || n.includes("cacao"))) {
      fusionSuggestion = `Associez votre cacao brut avec une réduction de gingembre ou de piment de Cayenne pour créer un dessert signature afro-fusion dynamique.`;
    } else if (
      names.some((n) => n.includes("poulet") || n.includes("poisson"))
    ) {
      fusionSuggestion = `Proposez une marinade sèche (Rub) aux épices locales (mélange de poivre de Penja, de soumara et d'ail sauvage) avant la cuisson au braisé.`;
    } else {
      fusionSuggestion =
        "Intégrez des herbes fraîches en fin de dressage pour renforcer le parfum olfactif à l'ouverture de la cloche.";
    }

    return {
      localAlternatives,
      costReductionTips,
      shelfLifeAlerts,
      fusionSuggestion,
    };
  }
}
