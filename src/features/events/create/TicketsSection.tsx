import { View } from "react-native";
import { EventTickets } from "@/features/events/components/EventTickets";
import type { Event } from "@/features/events/types";

interface Props {
  event: Event;
}

export function TicketsSection({ event }: Props) {
  return (
    <View className="pt-2">
      <EventTickets event={event} onPurchase={() => {}} />
    </View>
  );
}
