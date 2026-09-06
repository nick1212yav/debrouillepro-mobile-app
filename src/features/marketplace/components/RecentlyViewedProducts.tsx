import { View, Text, Image } from "react-native";
// src/features/marketplace/components/RecentlyViewedProducts.tsx
import { Package } from "lucide-react-native";
import { formatPrice } from "../utils/formatter";
import type { Product } from "../types";

interface Props {
  products: Product[];
  onProductPress: (product: Product) => void;
  maxDisplay?: number;
}

export function RecentlyViewedProducts({
  products,
  onProductPress,
  maxDisplay = 4,
}: Props) {
  if (!products || products.length === 0) return null;

  return (
    <View className="space-y-2">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">
        Récemment consultés
      </Text>
      <View
        className="flex gap-2 overflow-x-auto pb-1"
        style={{  }}
      >
        {products.slice(0, maxDisplay).map((product) => (
          <Pressable
            key={product._id}
            onPress={() => onProductPress(product)}
            className="flex-shrink-0 w-40 p-2 rounded-xl bg-white/5 border border-white/5 text-left"
          >
            {product.images?.[0] ? (
              <Image
               
               
                className="w-full h-28 object-cover rounded-lg mb-1.5"
               source={{ uri: product.images[0] }} accessibilityLabel={product.title}/>
            ) : (
              <View className="w-full h-28 rounded-lg bg-white/5 flex items-center justify-center mb-1.5">
                <Package size={24} className="text-white/20" />
              </View>
            )}
            <Text className="text-white/70 text-xs truncate">{product.title}</Text>
            <Text className="text-orange-400 font-bold text-xs">
              {formatPrice(product.price, product.currency)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
