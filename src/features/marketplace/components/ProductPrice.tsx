import { View, Text } from "react-native";

// src/features/marketplace/components/ProductPrice.tsx
import { formatPrice } from "../utils/formatter";
import { applyDiscount, discountAmount } from "../utils/pricing";
import type { Product } from "../types";

interface Props {
  product: Product;
  discountPercent?: number;
  showOriginal?: boolean;
}

export function ProductPrice({
  product,
  discountPercent = 0,
  showOriginal = true,
}: Props) {
  const finalPrice =
    discountPercent > 0
      ? applyDiscount(product.price, discountPercent)
      : product.price;
  const hasDiscount = discountPercent > 0;

  return (
    <View className="space-y-1"><View className="flex items-end gap-3"><Text className="text-3xl font-black text-white">{formatPrice(finalPrice, product.currency)}</Text>{hasDiscount && showOriginal && (
          <Text className="text-sm text-white/40 line-through">
            {formatPrice(product.price, product.currency)}
          </Text>
        )}{hasDiscount && (
          <Text className="text-sm font-bold text-green-400">
            -{discountPercent}%
          </Text>
        )}</View>{hasDiscount && (
        <Text className="text-xs text-white/40">
          Économisez{" "}
          {formatPrice(
            discountAmount(product.price, discountPercent),
            product.currency,
          )}
        </Text>
      )}</View>
  );
}
