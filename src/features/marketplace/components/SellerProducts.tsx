import { View, Text } from "react-native";

// src/features/marketplace/components/SellerProducts.tsx
import { Package } from "lucide-react-native";
import { ProductMiniCard } from "./ProductMiniCard";
import type { Product } from "../types";

interface Props {
  products: Product[];
  onProductPress: (product: Product) => void;
  maxDisplay?: number;
}

export function SellerProducts({
  products,
  onProductPress,
  maxDisplay = 4,
}: Props) {
  const display = products.slice(0, maxDisplay);
  if (display.length === 0) return null;

  return (
    <View className="space-y-2"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">Autres produits du vendeur
      </Text><View className="space-y-1.5">{display.map((product) => (
          <ProductMiniCard
            key={product._id}
            product={product}
            onPress={() => onProductPress(product)}
          />
        ))}</View></View>
  );
}
