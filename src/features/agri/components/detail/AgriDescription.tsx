import { Pressable, Text, View } from "react-native";

// src/features/agri/components/detail/AgriDescription.tsx
import { useState } from "react";

interface AgriDescriptionProps {
  description: string;
}

export function AgriDescription({ description }: AgriDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = description.length > 250;
  const displayDescription =
    expanded || !isLong ? description : `${description.slice(0, 250)}...`;

  return (
    <View className="rounded-[24px] p-4 bg-white/[0.02] border border-white/5 space-y-2">
      <Text className="text-xs font-bold text-white/40 uppercase tracking-widest">
        Description
      </Text>
      <Text className="text-white/80 text-xs leading-relaxed">
        {displayDescription}
      </Text>
      {isLong && (
        <Pressable
          onPress={() => setExpanded(!expanded)}
          className="text-xs font-semibold text-green-400 pt-1 block text-left"
        >
          {expanded ? "Voir moins" : "Lire la suite"}
        </Pressable>
      )}
    </View>
  );
}
