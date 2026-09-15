import { View, Text } from "react-native";

// src/features/marketplace/components/ProductSimilar.tsx
import { ProductMiniCard } from "./ProductMiniCard";
import type { Product } from "../types";

interface Props {
  products: Product[];
  onProductPress: (product: Product) => void;
  maxDisplay?: number;
}

export function ProductSimilar({
  products,
  onProductPress,
  maxDisplay = 4,
}: Props) {
  if (!products || products.length === 0) return null;

  return (
    <View className="space-y-2"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">Produits similaires
      </Text><View className="space-y-1.5">{products.slice(0, maxDisplay).map((product) => (
          <ProductMiniCard
            key={product._id}
            product={product}
            onPress={() => onProductPress(product)}
          />
        ))}</View></View>
  );
}
