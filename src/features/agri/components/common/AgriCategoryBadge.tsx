import { Text, View } from "react-native";

// src/features/agri/components/common/AgriCategoryBadge.tsx
import type { AgriCategory } from "../../types/product.types";
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
} from "../../constants/agri.categories";

interface AgriCategoryBadgeProps {
  category: AgriCategory;
  className?: string;
}

export function AgriCategoryBadge({
  category,
  className = "",
}: AgriCategoryBadgeProps) {
  const label = CATEGORY_LABELS[category] || category;
  const icon = CATEGORY_ICONS[category] || "🌱";
  const color = CATEGORY_COLORS[category] || "#10B981";

  return (
    <View className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider border border-white/5 backdrop-blur-md ${className}`} style={{ backgroundColor: `${color}1a` }}>
      <Text>{icon}</Text>
      <Text>{label}</Text>
    </View>
  );
}
