export interface EnvironmentalContext {
  timeOfDay: "breakfast" | "lunch" | "afternoon" | "dinner" | "late_night";
  temperatureCelsius: number;
  weatherCondition: "sunny" | "rainy" | "cloudy" | "hot";
  isWeekend: boolean;
}

export interface SuggestedBundle {
  title: string;
  itemsRecommended: string[];
  discountPercent: number;
  marketingHook: string;
}

export class MenuSuggestor {
  /**
   * Suggère des compositions de menu adaptées au climat et à l'heure locale
   */
  public static suggestDailyHighlights(
    context: EnvironmentalContext,
  ): SuggestedBundle {
    // 1. Matinée ensoleillée ou pluvieuse
    if (context.timeOfDay === "breakfast") {
      if (
        context.temperatureCelsius < 22 ||
        context.weatherCondition === "rainy"
      ) {
        return {
          title: "Réveil Chaleureux",
          itemsRecommended: [
            "Café au Kinkeliba",
            "Pastels chauds",
            "Pain d'épices local",
          ],
          discountPercent: 10,
          marketingHook:
            "La douceur idéale pour entamer cette matinée pluvieuse.",
        };
      }
      return {
        title: "Énergie Tropicale",
        itemsRecommended: [
          "Smoothie mangue-passion",
          "Croissant pur beurre",
          "Salade de fruits frais",
        ],
        discountPercent: 5,
        marketingHook: "Faites le plein de vitamines fraîches sous le soleil.",
      };
    }

    // 2. Déjeuner (Lunch)
    if (context.timeOfDay === "lunch") {
      if (context.temperatureCelsius > 32) {
        return {
          title: "Fraîcheur du Midi",
          itemsRecommended: [
            "Salade avocat-crevettes",
            "Limonade glacée hibiscus",
            "Carpaccio d'ananas",
          ],
          discountPercent: 12,
          marketingHook:
            "Un repas léger et hydratant conçu pour surmonter les fortes chaleurs.",
        };
      }
      return {
        title: "Le Festin Tradition",
        itemsRecommended: [
          "Attiéké poisson braisé royal",
          "Sauce piment doux",
          "Bissap frais",
        ],
        discountPercent: 8,
        marketingHook:
          "Le grand classique indémodable du midi pour recharger vos batteries.",
      };
    }

    // 3. Après-midi (Goûter / Snacks)
    if (context.timeOfDay === "afternoon") {
      return {
        title: "Pause Gourmande",
        itemsRecommended: [
          "Alloco chaud",
          "Brochettes de soja",
          "Jus de gingembre pur",
        ],
        discountPercent: 15,
        marketingHook:
          "La pause goûter incontournable de l'après-midi, partagée en équipe.",
      };
    }

    // 4. Dîner (Dinner)
    if (context.timeOfDay === "dinner") {
      if (context.isWeekend) {
        return {
          title: "Soirée Prestige",
          itemsRecommended: [
            "Risotto au gombo et homard",
            "Vin sélectionné",
            "Tiramisu cacao sauvage",
          ],
          discountPercent: 10,
          marketingHook:
            "Sublimez votre fin de semaine avec une expérience culinaire raffinée.",
        };
      }
      return {
        title: "Dîner Réconfort",
        itemsRecommended: [
          "Soupe de poisson parfumée",
          "Igname bouillie",
          "Infusion de verveine citronnelle",
        ],
        discountPercent: 8,
        marketingHook:
          "Un dîner léger et réconfortant pour une excellente nuit de sommeil.",
      };
    }

    // 5. Milieu de nuit (Late Night)
    return {
      title: "Snack Nocturne",
      itemsRecommended: ["Garba complet", "Canette de boisson énergisante"],
      discountPercent: 0,
      marketingHook: "Pour les travailleurs de nuit et les fêtards exigeants.",
    };
  }
}
