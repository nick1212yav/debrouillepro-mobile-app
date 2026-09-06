import { View, Text } from "react-native";
// src/features/marketplace/components/ProductDiscount.tsx
import { Zap } from "lucide-react-native";
import { formatPrice } from "../utils/formatter";
import { applyDiscount, discountAmount } from "../utils/pricing";

interface Props {
  originalPrice: number;
  discountPercent: number;
  currency: string;
  endDate?: string;
}

export function ProductDiscount({
  originalPrice,
  discountPercent,
  currency,
  endDate,
}: Props) {
  const finalPrice = applyDiscount(originalPrice, discountPercent);
  const saved = discountAmount(originalPrice, discountPercent);

  return (
    <View
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{ backgroundColor: "rgba(239,68,68,0.08)", borderWidth: 1, borderColor: "rgba(239,68,68,0.15)", borderStyle: "solid" }}
    >
      <Zap size={18} className="text-red-400" />
      <View className="flex-1">
        <Text className="text-white font-bold text-sm">-{discountPercent}%</Text>
        <Text className="text-white/40 text-xs line-through">
          {formatPrice(originalPrice, currency)}
        </Text>
        <Text className="text-red-400 font-bold text-sm">
          {formatPrice(finalPrice, currency)}
        </Text>
        {endDate && (
          <Text className="text-red-400/60 text-[10px]">
            Offre valable jusqu'au{" "}
            {new Date(endDate).toLocaleDateString("fr-FR")}
          </Text>
        )}
      </View>
      <View className="text-right">
        <Text className="text-xs text-green-400 font-bold">
          <Text>Économisez</Text>{formatPrice(saved, currency)}
        </Text>
      </View>
    </View>
  );
}
