import { Pressable, View, Text } from "react-native";
import type { MenuItem } from "../../types/menu.types";
import { ChefHat, Flame } from "lucide-react-native";

interface ChefRecipesProps {
  recipes: MenuItem[];
  onAddRecipe?: (recipe: MenuItem) => void;
}

export function ChefRecipes({ recipes, onAddRecipe }: ChefRecipesProps) {
  return (
    <View className="py-2 text-left">
      <View className="flex items-center gap-2 mb-3 px-1">
        <ChefHat size={16} className="text-orange-400" />
        <Text className="text-xs font-bold uppercase tracking-wider text-white">
          Créations du Chef
        </Text>
      </View>

      <View className="space-y-3">
        {recipes.map((recipe) => (
          <View
            key={recipe.name}
            className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex gap-3 items-center justify-between"
          >
            <View className="min-w-0 pr-2">
              <Text className="font-extrabold text-sm text-white truncate">
                {recipe.name}
              </Text>
              <Text className="text-white/40 text-xs mt-0.5 font-normal">
                {recipe.description}
              </Text>
              <View className="flex items-center gap-2.5 mt-2">
                <Text className="inline-flex items-center gap-1 text-[10px] text-orange-400/80 font-bold">
                  <Flame size={10} /> {recipe.calories} kcal
                </Text>
                <Text className="text-[10px] text-white/30">
                  • Prep : {recipe.prepTime}
                </Text>
              </View>
            </View>

            <View className="shrink-0 text-right">
              <Text className="block font-black text-xs text-white mb-2">
                {recipe.price.toLocaleString()} <Text>FCFA</Text></Text>
              {onAddRecipe && (
                <Pressable
                  onPress={() => onAddRecipe(recipe)}
                  className="px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-400 text-[9px] font-black uppercase tracking-wider border border-orange-500/25"
                >
                  <Text>Ajouter</Text></Pressable>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
