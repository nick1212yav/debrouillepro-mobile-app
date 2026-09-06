import { Text, View } from "react-native";

interface Props {
  description: string;
  maxLength?: number;
}

export function JobDescription({ description, maxLength = 120 }: Props) {
  if (!description) return null;

  const truncated =
    description.length > maxLength
      ? description.slice(0, maxLength) + "..."
      : description;

  return (
    <View className="mt-2">
      <Text className="text-xs text-white/60 leading-relaxed">
        {truncated}
      </Text>
    </View>
  );
}
