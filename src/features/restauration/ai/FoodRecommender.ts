export interface MenuItem {
  name: string;
  price: number;
  description: string;
  tag: string;
  calories: number;
  prepTime: string;
  allergens: string[];
  dietaryRestrictions: string[]; // e.g., "vegan", "vegetarian", "halal", "gluten-free"
  category: string;
}

export interface RestaurantDetail {
  id: number;
  name: string;
  cuisine: string;
  location: string;
  rating: number;
  priceRange: string; // "$", "$$", "$$$"
  menu: {
    category: string;
    items: MenuItem[];
  }[];
}

export interface UserPreferenceProfile {
  favoriteCuisines: string[];
  allergens: string[];
  dietaryRestrictions: string[];
  budgetPreference: "low" | "medium" | "high";
  orderHistory: Array<{ dishName: string; category: string; rating?: number }>;
}

export interface RecommendationResult {
  item: MenuItem;
  restaurant: RestaurantDetail;
  score: number;
  matchingCriteria: string[];
}

export class FoodRecommender {
  /**
   * Génère des recommandations de plats personnalisées pour un profil utilisateur
   */
  public static getRecommendations(
    profile: UserPreferenceProfile,
    restaurants: RestaurantDetail[],
    limit: number = 5,
  ): RecommendationResult[] {
    const recommendations: RecommendationResult[] = [];

    for (const restaurant of restaurants) {
      for (const group of restaurant.menu) {
        for (const item of group.items) {
          // 1. Filtrage strict sur les allergènes
          const hasAllergen = item.allergens.some((allergen) =>
            profile.allergens
              .map((a) => a.toLowerCase())
              .includes(allergen.toLowerCase()),
          );
          if (hasAllergen) continue;

          // 2. Filtrage strict sur les restrictions alimentaires (Halal, Vegan, etc.)
          const respectsRestrictions = profile.dietaryRestrictions.every(
            (restriction) =>
              item.dietaryRestrictions
                .map((r) => r.toLowerCase())
                .includes(restriction.toLowerCase()),
          );
          if (!respectsRestrictions && profile.dietaryRestrictions.length > 0)
            continue;

          // 3. Calcul du score de pertinence
          let score = 50; // Score de base
          const matchingCriteria: string[] = [];

          // Critère de cuisine favorite du restaurant
          const isFavoriteCuisine = profile.favoriteCuisines
            .map((c) => c.toLowerCase())
            .includes(restaurant.cuisine.toLowerCase());
          if (isFavoriteCuisine) {
            score += 30;
            matchingCriteria.push("Cuisine favorite");
          }

          // Critère de budget
          const budgetMatch = this.checkBudgetMatch(
            profile.budgetPreference,
            restaurant.priceRange,
          );
          if (budgetMatch) {
            score += 20;
            matchingCriteria.push("Budget adapté");
          }

          // Critère d'historique de commande (catégorie similaire ou plat identique)
          const orderHistoryMatch = profile.orderHistory.some(
            (order) =>
              order.category.toLowerCase() === item.category.toLowerCase(),
          );
          if (orderHistoryMatch) {
            score += 15;
            matchingCriteria.push("Similaire à vos habitudes");
          }

          // Bonus pour les restaurants bien notés
          if (restaurant.rating >= 4.7) {
            score += 10;
            matchingCriteria.push("Établissement d'élite");
          }

          recommendations.push({
            item,
            restaurant,
            score,
            matchingCriteria,
          });
        }
      }
    }

    // Tri par score décroissant et limitation de taille
    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  private static checkBudgetMatch(
    preference: "low" | "medium" | "high",
    priceRange: string,
  ): boolean {
    if (preference === "low" && priceRange === "$") return true;
    if (preference === "medium" && (priceRange === "$" || priceRange === "$$"))
      return true;
    if (preference === "high") return true;
    return false;
  }
}
