import { View, Text } from "react-native";
// src/features/events/components/EventMap.tsx
import { MapPin, Navigation } from "lucide-react-native";
import type { Event } from "../types";

interface Props {
  event: Event;
}

export function EventMap({ event }: Props) {
  const hasCoordinates = event.latitude && event.longitude;
  const googleMapsUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${event.latitude},${event.longitude}`
    : `https://www.google.com/maps?q=${encodeURIComponent(event.location)}`;

  return (
    <View className="space-y-3">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">
        Localisation
      </Text>
      <View
        className="relative rounded-2xl overflow-hidden h-40"
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        {/* Grid de fond simulant une carte */}
        <View className="absolute inset-0 opacity-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <View
              key={`v${i}`}
              className="absolute border-white/20"
              style={{
                left: `${i * 20}%`,
                top: 0,
                bottom: 0,
                borderLeftWidth: 1,
              }}
            />
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <View
              key={`h${i}`}
              className="absolute border-white/20"
              style={{
                top: `${i * 25}%`,
                left: 0,
                right: 0,
                borderTopWidth: 1,
              }}
            />
          ))}
        </View>

        {/* Pin */}
        <View className="absolute inset-0 flex items-center justify-center">
          <Pressable
            className="flex flex-col items-center gap-1 group" accessibilityHint={googleMapsUrl}
          >
            <View
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl"
              style={{  }}
            >
              <MapPin size={24} className="text-white" />
            </View>
            <View
              className="px-3 py-1 rounded-xl text-xs font-bold text-white"
              style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
            >
              {event.location.split(",")[0]}
            </View>
            <View
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] text-white/60"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            >
              <Navigation size={10} />
              <Text>Ouvrir dans Maps</Text></View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
