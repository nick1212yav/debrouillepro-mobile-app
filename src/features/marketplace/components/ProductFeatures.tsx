import { View, Text } from "react-native";

// src/features/marketplace/components/ProductFeatures.tsx
import { Check } from "lucide-react-native";

interface Props {
  features: string[];
}

export function ProductFeatures({ features }: Props) {
  if (!features || features.length === 0) return null;

  return (
    <View className="space-y-2"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">Caractéristiques principales
      </Text><View className="gap-1.5">{features.map((feature, index) => (
          <View key={index} className="flex items-center gap-2 text-sm text-white/70">
            <Check size={14} className="text-emerald-400 flex-shrink-0" />
            <Text>{feature}</Text>
          </View>
        ))}</View></View>
  );
}
