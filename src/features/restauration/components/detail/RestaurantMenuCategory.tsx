import { Pressable, View } from "react-native";

interface RestaurantMenuCategoryProps {
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

export function RestaurantMenuCategory({
  categories,
  activeCategory,
  onSelectCategory,
}: RestaurantMenuCategoryProps) {
  return (
    <View className="flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
      {categories.map((category) => {
        const isSelected = activeCategory === category;
        return (
          <Pressable key={category} onPress={() => onSelectCategory(category)} className="flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-300" style={{ backgroundColor: isSelected
                          ? "rgba(249,115,22,0.25)"
                          : "rgba(255,255,255,0.04)", borderColor: "rgba(249,115,22,0.4)", borderStyle: "solid" }}>
            {category}
          </Pressable>
        );
      })}
    </View>
  );
}
