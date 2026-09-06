import { Link } from "expo-router";
import { View, Text, Image } from "react-native";
// src/features/events/components/EventAttendees.tsx
import { Users, CheckCircle, Clock } from "lucide-react-native";
import type { Event } from "../types";

interface Props {
  event: Event;
}

export function EventAttendees({ event }: Props) {
  const attendees = event.attendees || [];

  if (attendees.length === 0) {
    return null;
  }

  const displayCount = Math.min(attendees.length, 12);
  const remaining = attendees.length - displayCount;

  return (
    <View className="space-y-3">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">
        Participants ({attendees.length})
      </Text>
      <View className="flex flex-wrap gap-2">
        {attendees.slice(0, displayCount).map((attendee) => (
          <Link
            key={attendee.userId}
            href={`/profile/${attendee.userId}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5"
          >
            {attendee.avatar ? (
              <Image
               
               
                className="w-6 h-6 rounded-full object-cover"
               source={{ uri: attendee.avatar }} accessibilityLabel={attendee.name}/>
            ) : (
              <View className="w-6 h-6 rounded-full flex items-center justify-center bg-purple-500/20 text-[10px] font-bold text-purple-400">
                {attendee.name.charAt(0).toUpperCase()}
              </View>
            )}
            <Text className="text-white/70 text-xs">{attendee.name}</Text>
            {attendee.status === "attending" && (
              <CheckCircle size={10} className="text-green-400" />
            )}
          </Link>
        ))}
        {remaining > 0 && (
          <View
            className="flex items-center px-3 py-1.5 rounded-full text-xs text-white/40"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <Text>+</Text>{remaining}
          </View>
        )}
      </View>
    </View>
  );
}
