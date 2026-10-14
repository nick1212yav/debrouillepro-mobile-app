import { Text, View } from "react-native";

interface Props {
  description: string;
}

export function ServiceDescription({ description }: Props) {
  const normalized = description?.trim() ?? "";
  if (!normalized) return null;

  return (
    <View className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <Text className="mb-2 text-sm font-medium text-white/50">
        Description
      </Text>
      <Text className="text-sm leading-6 text-white/80">{normalized}</Text>
    </View>
  );
}
