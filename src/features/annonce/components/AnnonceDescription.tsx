import { Pressable, View, Text } from "react-native";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react-native";

interface Props {
  description: string;
  maxLength?: number;
}

export function AnnonceDescription({ description, maxLength = 400 }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!description) return null;

  const shouldTruncate = description.length > maxLength;
  const displayText =
    shouldTruncate && !isExpanded
      ? description.slice(0, maxLength) + "..."
      : description;

  return (
    <View className="space-y-2">
      <Text className="text-sm font-medium text-white/50">Description</Text>
      <View className="text-white/80 text-sm leading-relaxed">
        {displayText}
      </View>

      {shouldTruncate && (
        <Pressable
          onPress={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-orange-400"
        >
          {isExpanded ? (
            <>
              <ChevronUp size={14} /> <Text>Voir moins</Text></>
          ) : (
            <>
              <ChevronDown size={14} /> <Text>Voir plus</Text></>
          )}
        </Pressable>
      )}
    </View>
  );
}
