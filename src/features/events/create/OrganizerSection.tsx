import { View } from "react-native";
import { EventOrganizer } from "@/features/events/components/EventOrganizer";
import type { Event } from "@/features/events/types";
import { toast } from "sonner";

interface Props {
  event: Event;
}

export function OrganizerSection({ event }: Props) {
  return (
    <View className="pt-2">
      <EventOrganizer
        event={event}
        onContact={() => {
          toast.info("Contacter l'organisateur");
        }}
      />
    </View>
  );
}
