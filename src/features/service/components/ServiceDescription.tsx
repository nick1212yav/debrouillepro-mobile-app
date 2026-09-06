import { Text, View } from "react-native";

interface Props {
  description: string;
}

export function ServiceDescription({ description }: Props) {
  if (!description) return null;
  return (
    <View className="bg-white/5 rounded-2xl p-4">
      <Text className="text-sm font-medium text-white/50 mb-2">Description</Text>
      <Text className="text-white/80 text-sm leading-relaxed">
        {description}
      </Text>
    </View>
  );
}
