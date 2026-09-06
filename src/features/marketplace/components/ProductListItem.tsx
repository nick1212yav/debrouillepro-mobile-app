import { View, Text, Pressable, Image } from "react-native";
// src/features/marketplace/components/ProductListItem.tsx
import { Package, Heart, ShoppingCart, Star } from "lucide-react-native";
import { formatPrice } from "../utils/formatter";
import { getStockLabel, getStockStatus } from "../utils/inventory";
import type { Product } from "../types";

interface Props {
  product: Product;
  index: number;
  onPress: () => void;
  onLike?: () => void;
  onAddToCart?: () => void;
}

export function ProductListItem({
  product,
  index,
  onPress,
  onLike,
  onAddToCart,
}: Props) {
  const stockStatus = getStockStatus(product.stock);
  const stockLabel = getStockLabel(stockStatus);
  const isAvailable = product.stock > 0;

  return (
    <Pressable
      onPress={onPress}
      className="w-full flex items-center gap-4 p-3 rounded-2xl text-left"
      style={{ backgroundColor: index % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
    >
      <View className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-black/20">
        {product.images && product.images.length > 0 ? (
          <Image
           
           
            className="w-full h-full object-cover"
            loading="lazy"
           source={{ uri: product.images[0] }} accessibilityLabel={product.title}/>
        ) : (
          <View className="w-full h-full flex items-center justify-center">
            <Package size={24} className="text-white/20" />
          </View>
        )}
      </View>

      <View className="flex-1 min-w-0">
        <View className="flex items-start justify-between gap-2">
          <View className="flex-1 min-w-0">
            <Text className="text-white font-semibold text-sm truncate">
              {product.title}
            </Text>
            <View className="flex items-center gap-2 mt-0.5">
              <Text className="text-orange-400 font-bold text-sm">
                {formatPrice(product.price, product.currency)}
              </Text>
              {product.rating && product.rating > 0 && (
                <Text className="flex items-center gap-0.5 text-xs text-yellow-400">
                  <Star size={10} fill="currentColor" />
                  {product.rating.toFixed(1)}
                </Text>
              )}
            </View>
            <View className="flex items-center gap-2 mt-0.5">
              <Text
                className="text-xs"
                style={{ color: isAvailable ? "#10B981" : "#EF4444" }}
              >
                {stockLabel}
              </Text>
              {product.deliveryAvailable && (
                <Text className="text-[10px] text-emerald-400">
                  ⚡ Livraison
                </Text>
              )}
            </View>
          </View>
          <View className="flex items-center gap-1 flex-shrink-0">
            {onLike && (
              <Pressable
                onPress={(e) => {
                  onLike();
                }}
                className="p-1.5 rounded-full"
              >
                <Heart
                  size={14}
                  className={
                    product.isLiked
                      ? "fill-red-500 text-red-500"
                      : "text-white/40"
                  }
                />
              </Pressable>
            )}
            {onAddToCart && isAvailable && (
              <Pressable
                onPress={(e) => {
                  onAddToCart();
                }}
                className="p-1.5 rounded-full bg-orange-500/20"
              >
                <ShoppingCart size={14} className="text-orange-400" />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
