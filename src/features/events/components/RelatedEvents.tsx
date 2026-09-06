import { useRouter } from "expo-router";
import { View, Text, Pressable, Image } from "react-native";
// src/features/events/components/RelatedEvents.tsx
import { Calendar, MapPin } from "lucide-react-native";
import type { Event } from "../types";

interface Props {
  events: Event[];
  currentEventId: string;
}

export function RelatedEvents({ events, currentEventId }: Props) {
  const router = useRouter();
  const related = events.filter((e) => e._id !== currentEventId).slice(0, 4);

  if (related.length === 0) return null;

  return (
    <View className="space-y-3">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">
        Événements similaires
      </Text>
      <View className="space-y-2">
        {related.map((event) => (
          <Pressable
            key={event._id}
            onPress={() => router.push(`/events/${event._id}`)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-left"
          >
            {event.coverImage ? (
              <Image
               
               
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
               source={{ uri: event.coverImage }} accessibilityLabel={event.title}/>
            ) : (
              <View className="w-16 h-16 rounded-xl flex items-center justify-center bg-white/5 text-2xl flex-shrink-0">
                <Text>🎫</Text></View>
            )}
            <View className="flex-1 min-w-0">
              <Text className="text-white font-semibold text-sm truncate">
                {event.title}
              </Text>
              <View className="flex items-center gap-2 text-xs text-white/40">
                <Calendar size={10} />
                <Text>{new Date(event.startDate).toLocaleDateString()}</Text>
                <MapPin size={10} />
                <Text className="truncate">{event.location}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
