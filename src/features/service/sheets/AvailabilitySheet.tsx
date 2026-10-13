import { Text, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  providerId: Id<"serviceProviders">;
}

export function AvailabilitySheet({ providerId }: Props) {
  const slots = useQuery(api.serviceProviders.getAvailability, {
    providerId,
  });

  if (slots === undefined) {
    return (
      <View className="rounded-xl bg-white/5 p-4">
        <Text className="text-sm text-white/50">
          Chargement des disponibilités...
        </Text>
      </View>
    );
  }

  if (slots.length === 0) {
    return (
      <View className="rounded-xl bg-white/5 p-4">
        <Text className="text-sm text-white/50">
          Aucune disponibilité pour le moment.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      {slots.map((slot) => (
        <View
          key={slot._id}
          className="rounded-xl border border-white/5 bg-white/5 p-3"
        >
          <Text className="text-sm font-medium text-white/80">{slot.date}</Text>

          <View className="mt-2 flex-row flex-wrap gap-2">
            {slot.slots.map((timeSlot, index) => (
              <View
                key={`${timeSlot.start}-${timeSlot.end}-${index}`}
                className="rounded-lg bg-green-500/10 px-2 py-1"
              >
                <Text className="text-xs text-green-400">
                  {timeSlot.start} – {timeSlot.end}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
