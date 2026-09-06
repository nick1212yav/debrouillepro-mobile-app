import { Pressable, View, Text } from "react-native";
// src/features/marketplace/components/StickyPurchaseBar.tsx
import { formatPrice } from "../utils/formatter";
import type { Product } from "../types";

interface Props {
  product: Product;
  quantity: number;
  onQuantityChange: (q: number) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
}

export function StickyPurchaseBar({
  product,
  quantity,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
}: Props) {
  const total = product.price * quantity;

  return (
    <View
      className="fixed bottom-0 left-0 right-0 px-5 pt-4 pb-8"
      style={{ zIndex: 20 }}
    >
      <View className="flex items-center gap-3">
        <View className="flex-1">
          <Text className="text-white/40 text-xs">Total</Text>
          <Text className="text-white font-bold text-xl">
            {formatPrice(total, product.currency)}
          </Text>
        </View>
        <View className="flex items-center gap-2">
          <Pressable
            onPress={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5"
          >
            <Text className="text-white"><Text>−</Text></Text>
          </Pressable>
          <Text className="text-white font-bold text-sm w-6 text-center">
            {quantity}
          </Text>
          <Pressable
            onPress={() => onQuantityChange(quantity + 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5"
          >
            <Text className="text-white"><Text>+</Text></Text>
          </Pressable>
        </View>
        <Pressable
          onPress={onBuyNow}
          className="px-6 py-3 rounded-2xl font-bold text-white"
          style={{  }}
        >
          <Text>Acheter</Text></Pressable>
      </View>
    </View>
  );
}
