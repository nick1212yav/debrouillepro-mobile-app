import { View, Text } from "react-native";
import { useServiceAvailability } from "../hooks/useServiceAvailability";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  providerId: Id<"serviceProviders">;
}

export function ServiceAvailability({ providerId }: Props) {
  const { slots } = useServiceAvailability(providerId);
  if (!slots || slots.length === 0) return null;
  return (
    <View className="bg-white/5 rounded-2xl p-4">
      <Text className="text-sm font-medium text-white/50 mb-2">Disponibilités</Text>
      <View className="flex flex-wrap gap-2">
        {slots.map((slot, i) => (
          <Text
            key={i}
            className="px-3 py-1 rounded-lg text-xs bg-green-500/10 text-green-400 border border-green-500/20"
          >
            {slot.date} {slot.slots.length} <Text>créneaux</Text></Text>
        ))}
      </View>
    </View>
  );
}
