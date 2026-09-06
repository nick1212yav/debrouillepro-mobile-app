import { Text, View } from "react-native";

// src/features/marketplace/components/ProductAvailability.tsx
import { Check, AlertCircle } from "lucide-react-native";

interface Props {
  inStock: boolean;
  quantity?: number;
}

export function ProductAvailability({ inStock, quantity }: Props) {
  return (
    <View className="flex items-center gap-2">
      {inStock ? (
        <>
          <Check size={16} className="text-emerald-400" />
          <Text className="text-emerald-400 text-sm font-medium">En stock</Text>
          {quantity !== undefined && (
            <Text className="text-white/40 text-xs">
              ({quantity} disponibles)
            </Text>
          )}
        </>
      ) : (
        <>
          <AlertCircle size={16} className="text-red-400" />
          <Text className="text-red-400 text-sm font-medium">Épuisé</Text>
        </>
      )}
    </View>
  );
}
