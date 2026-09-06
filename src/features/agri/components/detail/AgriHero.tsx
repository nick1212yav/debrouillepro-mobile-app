import { View, Text, Image } from "react-native";
// src/features/agri/components/detail/AgriHero.tsx
import type { AgriProduct } from "../../types/product.types";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
} from "../../constants/agri.categories";

interface AgriHeroProps {
  product: AgriProduct;
}

export function AgriHero({ product }: AgriHeroProps) {
  return (
    <View className="relative w-full h-[320px] bg-white/[0.01] overflow-hidden">
      {product.media.images && product.media.images.length > 0 ? (
        <Image
         
         
          className="w-full h-full object-cover"
         source={{ uri: product.media.images[0] }} accessibilityLabel={product.title}/>
      ) : (
        <View className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-white/[0.03] to-transparent text-white/10 gap-3">
          <Text className="text-7xl">
            {CATEGORY_ICONS[product.category] || "🌱"}
          </Text>
        </View>
      )}

      {/* Masque de dégradé inférieur doux pour assurer le contraste avec les boutons */}
      <View className="absolute inset-0 bg-gradient-to-t from-[#020d06] via-transparent to-black/30" />

      {/* Badge de catégorie superposé */}
      <View
        className="absolute bottom-4 left-5 px-3 py-1 rounded-full text-xs font-bold tracking-wider border border-white/5"
        style={{ backgroundColor: `${CATEGORY_COLORS[product.category]}20` }}
      >
        {CATEGORY_ICONS[product.category]} {CATEGORY_LABELS[product.category]}
      </View>
    </View>
  );
}
