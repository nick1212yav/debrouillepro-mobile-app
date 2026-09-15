import { View, Text } from "react-native";

// src/features/marketplace/components/ProductSpecifications.tsx

interface Specification {
  label: string;
  value: string;
}

interface Props {
  specifications: Specification[];
}

export function ProductSpecifications({ specifications }: Props) {
  if (!specifications || specifications.length === 0) return null;

  return (
    <View className="space-y-2"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">Spécifications
      </Text><View className="space-y-1">{specifications.map((spec, index) => (
          <View key={index} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
            <Text className="text-white/60 text-sm">{spec.label}</Text>
            <Text className="text-white text-sm font-medium">{spec.value}</Text>
          </View>
        ))}</View></View>
  );
}
