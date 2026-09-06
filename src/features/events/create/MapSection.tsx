import { View } from "react-native";
import { EventMap } from "@/features/events/components/EventMap";
import type { Event } from "@/features/events/types";

interface Props {
  event: Event;
}

export function MapSection({ event }: Props) {
  return (
    <View className="pt-2">
      <EventMap event={event} />
    </View>
  );
}
