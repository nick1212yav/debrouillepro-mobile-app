import { useState, useCallback } from "react";
import { AIService } from "../services/AIService";
import type { NutritionValues } from "../types/menu.types";
import type { RecipeIngredient } from "../ai/ChefAssistant";

export function useAIRecommendations() {
  const [isProcessing, setIsProcessing] = useState(false);

  const getMealNutritionAnalysis = useCallback(
    (
      dishes: Array<{
        item: { name: string; price: number };
        quantity: number;
        nutrition: NutritionValues;
      }>,
    ) => {
      setIsProcessing(true);
      try {
        return AIService.analyzeMealNutrition(dishes);
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  const getRecipeOptimization = useCallback(
    (
      recipeName: string,
      ingredients: RecipeIngredient[],
      targetPrice: number,
    ) => {
      setIsProcessing(true);
      try {
        return AIService.analyzeChefRecipe(
          recipeName,
          ingredients,
          targetPrice,
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  return { getMealNutritionAnalysis, getRecipeOptimization, isProcessing };
}
