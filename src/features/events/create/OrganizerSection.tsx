import { UIService } from "@/core/sdk/ui/UIService";
import { View } from "react-native";
import { EventOrganizer } from "@/features/events/components/EventOrganizer";
import type { Event } from "@/features/events/types";

interface Props {
  event: Event;
}

export function OrganizerSection({ event }: Props) {
  return (
    <View className="pt-2">
      <EventOrganizer
        event={event}
        onContact={() => {
          UIService.openToast("Contacter l'organisateur", "info");
        }}
      />
    </View>
  );
}
