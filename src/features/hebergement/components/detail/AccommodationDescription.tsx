import { Text, Pressable, View } from "react-native";
import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react-native";

interface AccommodationDescriptionProps {
  description: string;
}

export const AccommodationDescription: React.FC<
  AccommodationDescriptionProps
> = ({ description }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 250;
  const isLong = description.length > maxLength;

  const displayDescription = isExpanded
    ? description
    : description.slice(0, maxLength) + "...";

  return (
    <View className="p-4 md:p-6 border-b border-white/5 flex flex-col gap-3">
      <Text className="text-white font-semibold text-sm">
        À propos de ce logement
      </Text>
      <Text className="text-sm leading-relaxed text-white/70">
        {isLong ? displayDescription : description}
      </Text>
      {isLong && (
        <Pressable
          onPress={() => setIsExpanded(!isExpanded)}
          className="self-start inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 mt-1"
        >
          {isExpanded ? (
            <>
              <Text>Voir moins</Text>
              <ChevronUp size={12} />
            </>
          ) : (
            <>
              <Text>Lire la suite</Text>
              <ChevronDown size={12} />
            </>
          )}
        </Pressable>
      )}
    </View>
  );
};
