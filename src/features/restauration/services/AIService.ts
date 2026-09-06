import { FoodRecommender } from "../ai/FoodRecommender";
import type {
  UserPreferenceProfile,
  RecommendationResult,
  RestaurantDetail,
} from "../ai/FoodRecommender";
import { NutritionAnalyzer } from "../ai/NutritionAnalyzer";
import type {
  MealAnalysisResult,
  NutritionValues,
} from "../ai/NutritionAnalyzer";
import { PriceOptimizer } from "../ai/PriceOptimizer";
import type { MarketConditions } from "../ai/PriceOptimizer";
import { ChefAssistant } from "../ai/ChefAssistant";
import type { RecipeIngredient, ChefFeedback } from "../ai/ChefAssistant";

export class AIService {
  public static getPersonalizedFoodRecommendations(
    profile: UserPreferenceProfile,
    restaurants: RestaurantDetail[],
    limit: number = 5,
  ): RecommendationResult[] {
    return FoodRecommender.getRecommendations(profile, restaurants, limit);
  }

  public static analyzeMealNutrition(
    dishes: {
      item: { name: string; price: number };
      quantity: number;
      nutrition: NutritionValues;
    }[],
  ): MealAnalysisResult {
    return NutritionAnalyzer.analyzeMeal(dishes);
  }

  public static computeSurgePricing(
    basePrice: number,
    conditions: MarketConditions,
  ): { finalPrice: number; multiplier: number; reason: string } {
    return PriceOptimizer.calculateDynamicPrice(basePrice, conditions);
  }

  public static analyzeChefRecipe(
    recipeName: string,
    ingredients: RecipeIngredient[],
    targetPrice: number,
  ): ChefFeedback {
    return ChefAssistant.optimizeRecipe(recipeName, ingredients, targetPrice);
  }
}
