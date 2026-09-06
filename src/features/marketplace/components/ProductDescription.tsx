import { Text, View } from "react-native";

// src/features/marketplace/components/ProductDescription.tsx
interface Props {
  description: string;
}

export function ProductDescription({ description }: Props) {
  if (!description) return null;
  return (
    <View className="space-y-2">
      <Text className="text-white/70 text-sm leading-relaxed">
        {description}
      </Text>
    </View>
  );
}
