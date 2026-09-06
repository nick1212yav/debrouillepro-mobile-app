import { Text, View } from "react-native";

interface Props {
  description: string;
  maxLength?: number;
}

export function PropertyDescription({ description, maxLength = 300 }: Props) {
  if (!description) return null;

  const truncated =
    description.length > maxLength
      ? description.slice(0, maxLength) + "..."
      : description;

  return (
    <View>
      <Text className="text-sm font-medium text-white/70 mb-2">Description</Text>
      <Text className="text-sm text-white/60 leading-relaxed">
        {truncated}
      </Text>
    </View>
  );
}
