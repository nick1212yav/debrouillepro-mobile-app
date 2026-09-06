import { Text, View } from "react-native";

// src/features/marketplace/components/ProductStock.tsx
import { getStockLabel, getStockStatus } from "../utils/inventory";

interface Props {
  stock: number;
}

export function ProductStock({ stock }: Props) {
  const status = getStockStatus(stock);
  const label = getStockLabel(status);

  const color =
    status === "available"
      ? "#10B981"
      : status === "low_stock"
        ? "#F59E0B"
        : "#EF4444";

  return (
    <View className="flex items-center gap-2">
      <View className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-sm" style={{ color }}>
        {label}
      </Text>
      {stock > 0 && (
        <Text className="text-xs text-white/40">({stock} disponibles)</Text>
      )}
    </View>
  );
}
