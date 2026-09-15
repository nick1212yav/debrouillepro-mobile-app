import { View, Text } from "react-native";

// src/features/marketplace/components/DailyDeals.tsx
import { ProductMiniCard } from "./ProductMiniCard";
import type { Product } from "../types";

interface Props {
  products: Product[];
  onProductPress: (product: Product) => void;
  maxDisplay?: number;
}

export function DailyDeals({
  products,
  onProductPress,
  maxDisplay = 4,
}: Props) {
  if (!products || products.length === 0) return null;

  return (
    <View className="space-y-2"><View className="flex items-center gap-2"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">Offres du jour
        </Text><Text className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">🔥
        </Text></View><View className="flex gap-2 overflow-x-auto pb-1" style={{  }}>{products.slice(0, maxDisplay).map((product) => (
          <ProductMiniCard
            key={product._id}
            product={product}
            onPress={() => onProductPress(product)}
          />
        ))}</View></View>
  );
}
