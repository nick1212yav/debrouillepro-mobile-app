import { Text, View } from "react-native";

// src/features/marketplace/components/LimitedStockBanner.tsx
import { AlertTriangle } from "lucide-react-native";

interface Props {
  stock: number;
  threshold?: number;
}

export function LimitedStockBanner({ stock, threshold = 10 }: Props) {
  if (stock <= 0) {
    return (
      <View className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/15">
        <AlertTriangle size={16} className="text-red-400" />
        <Text className="text-red-400 text-sm font-medium">Épuisé</Text>
      </View>
    );
  }

  if (stock > threshold) return null;

  return (
    <View className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/15">
      <AlertTriangle size={16} className="text-amber-400" />
      <Text className="text-amber-400 text-sm font-medium">
        Plus que {stock} exemplaire{stock > 1 ? "s" : ""}
      </Text>
    </View>
  );
}
