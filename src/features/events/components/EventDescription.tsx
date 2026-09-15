import { View, Text } from "react-native";

// src/features/events/components/EventDescription.tsx
import type { Event } from "../types";

interface Props {
  event: Event;
}

export function EventDescription({ event }: Props) {
  return (
    <View className="space-y-3"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">Description
      </Text><View className="prose prose-invert prose-sm max-w-none"><Text className="text-white/70 text-sm leading-relaxed">{event.description}</Text></View>{}{event.tags.length > 0 && (
        <View className="flex flex-wrap gap-2 mt-4">
          {event.tags.map((tag) => (
            <Text key={tag} className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
              #{tag}
            </Text>
          ))}
        </View>
      )}</View>
  );
}
