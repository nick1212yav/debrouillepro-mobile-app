import { View } from "react-native";
import { EventAttendees } from "@/features/events/components/EventAttendees";
import type { Event } from "@/features/events/types";

interface Props {
  event: Event;
}

export function AttendeesSection({ event }: Props) {
  return (
    <View className="pt-2">
      <EventAttendees event={event} />
    </View>
  );
}
