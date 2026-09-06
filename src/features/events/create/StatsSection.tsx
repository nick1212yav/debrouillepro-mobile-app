import { View } from "react-native";
import { EventStats } from "@/features/events/components/EventStats";
import type { Event } from "@/features/events/types";

interface Props {
  event: Event;
}

export function StatsSection({ event }: Props) {
  return (
    <View className="pt-2">
      <EventStats event={event} />
    </View>
  );
}
