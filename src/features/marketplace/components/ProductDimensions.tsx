import { View, Text } from "react-native";
// src/features/marketplace/components/ProductDimensions.tsx

interface Dimensions {
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  unit?: string;
}

interface Props {
  dimensions: Dimensions;
}

export function ProductDimensions({ dimensions }: Props) {
  const hasDimensions =
    dimensions.length ||
    dimensions.width ||
    dimensions.height ||
    dimensions.weight;
  if (!hasDimensions) return null;

  const unit = dimensions.unit || "cm";

  return (
    <View className="space-y-2">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">
        Dimensions
      </Text>
      <View className="gap-2">
        {dimensions.length && (
          <View className="p-2 rounded-xl bg-white/5">
            <Text className="text-white/40 text-[10px]"><Text>Longueur</Text></Text>
            <Text className="text-white font-medium text-sm">
              {dimensions.length} {unit}
            </Text>
          </View>
        )}
        {dimensions.width && (
          <View className="p-2 rounded-xl bg-white/5">
            <Text className="text-white/40 text-[10px]"><Text>Largeur</Text></Text>
            <Text className="text-white font-medium text-sm">
              {dimensions.width} {unit}
            </Text>
          </View>
        )}
        {dimensions.height && (
          <View className="p-2 rounded-xl bg-white/5">
            <Text className="text-white/40 text-[10px]"><Text>Hauteur</Text></Text>
            <Text className="text-white font-medium text-sm">
              {dimensions.height} {unit}
            </Text>
          </View>
        )}
        {dimensions.weight && (
          <View className="p-2 rounded-xl bg-white/5">
            <Text className="text-white/40 text-[10px]"><Text>Poids</Text></Text>
            <Text className="text-white font-medium text-sm">
              {dimensions.weight} <Text>kg</Text></Text>
          </View>
        )}
      </View>
    </View>
  );
}
