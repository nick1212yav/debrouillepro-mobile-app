import { View } from "react-native";
import { EventTimeline } from "@/features/events/components/EventTimeline";
import type { Event } from "@/features/events/types";

interface Props {
  event: Event;
}

export function ProgramSection({ event }: Props) {
  return (
    <View className="pt-2">
      <EventTimeline event={event} />
    </View>
  );
}
