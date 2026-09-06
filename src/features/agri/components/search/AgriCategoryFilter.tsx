import { Text, View, Pressable } from "react-native";

// src/features/agri/components/search/AgriCategoryFilter.tsx
import type { AgriCategory } from "../../types/product.types";
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
} from "../../constants/agri.categories";

interface AgriCategoryFilterProps {
  selectedCategory: AgriCategory | null;
  onSelectCategory: (category: AgriCategory | null) => void;
}

export function AgriCategoryFilter({
  selectedCategory,
  onSelectCategory,
}: AgriCategoryFilterProps) {
  const categories = Object.keys(CATEGORY_LABELS) as AgriCategory[];

  return (
    <View className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {/* Option Global par défaut */}
      <Pressable
        onPress={() => onSelectCategory(null)}
        className={`flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all border ${
          selectedCategory === null
            ? "bg-green-500/10 border-green-500/30 text-green-400"
            : "bg-white/[0.02] border-white/5 text-white/50 hover:text-white/80"
        }`}
      >
        <Text>🌍 Tous</Text>
      </Pressable>

      {categories.map((cat) => {
        const isSelected = selectedCategory === cat;
        const icon = CATEGORY_ICONS[cat];
        const label = CATEGORY_LABELS[cat];
        const color = CATEGORY_COLORS[cat];

        return (
          <Pressable
            key={cat}
            onPress={() => onSelectCategory(isSelected ? null : cat)}
            className={`flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all border`}
            style={{ backgroundColor: isSelected
                            ? `${color}15`
                            : "rgba(255,255,255,0.02)", borderColor: isSelected ? `${color}50` : "rgba(255,255,255,0.05)" }}
          >
            <Text>
              {icon} {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
