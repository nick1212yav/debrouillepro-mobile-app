import { View } from "react-native";
import { EventQR } from "@/features/events/components/EventQR";

interface Props {
  eventTitle: string;
}

export function QRSection({ eventTitle }: Props) {
  const ticketNumber = `TICKET-${Date.now().toString().slice(-6)}`;
  return (
    <View className="pt-2">
      <EventQR
        ticketNumber={ticketNumber}
        eventTitle={eventTitle || "Événement"}
        isValid={true}
      />
    </View>
  );
}
