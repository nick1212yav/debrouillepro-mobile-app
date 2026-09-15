import { Text, View, Pressable, Image } from "react-native";

// src/features/marketplace/components/ProductMiniCard.tsx
import { Package } from "lucide-react-native";
import { formatPrice } from "../utils/formatter";
import type { Product } from "../types";

interface Props {
  product: Product;
  onPress: () => void;
}

export function ProductMiniCard({ product, onPress }: Props) {
  return (
    <Pressable onPress={onPress} className="flex items-center gap-3 p-2 rounded-xl w-full text-left transition-colors">
      <View className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-black/20">
        {product.images && product.images.length > 0 ? (
          <Image className="w-full h-full object-cover"  source={{ uri: product.images[0] }} accessibilityLabel={product.title} />
        ) : (
          <View className="w-full h-full flex items-center justify-center">
            <Package size={20} className="text-white/20" />
          </View>
        )}
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-white text-sm font-medium truncate">
          {product.title}
        </Text>
        <Text className="text-orange-400 font-bold text-sm">
          {formatPrice(product.price, product.currency)}
        </Text>
      </View>
    </Pressable>
  );
}
