import { View, Text } from "react-native";

// src/features/events/components/EventFooter.tsx
import { Calendar, Clock, MapPin } from "lucide-react-native";
import type { Event } from "../types";

interface Props {
  event: Event;
}

export function EventFooter({ event }: Props) {
  return (
    <View className="p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}><View className="flex items-center justify-between text-xs text-white/40"><Text>{new Date(event.startDate).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}</Text><Text>{event.location}</Text></View></View>
  );
}
