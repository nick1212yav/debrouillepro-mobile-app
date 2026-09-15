import { View, Text } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  providerId: Id<"serviceProviders">;
}

export function AvailabilitySheet({ providerId }: Props) {
  const slots = useQuery(api.serviceProviders.getAvailability, { providerId });
  if (!slots || slots.length === 0)
    return <View className="text-white/40 text-sm"><Text>Aucune disponibilité</Text></View>;
  return (
    <View className="space-y-2">{slots.map((slot) => (
        <View key={slot._id} className="p-3 rounded-xl bg-white/5 border border-white/5"><Text className="text-white/80 text-sm font-medium">{slot.date}</Text><View className="flex flex-wrap gap-1 mt-1">{slot.slots.map((s, i) => (
              <Text key={i} className="px-2 py-0.5 rounded-lg text-xs bg-green-500/10 text-green-400">
                {s.start} - {s.end}
              </Text>
            ))}</View></View>
      ))}</View>
  );
}
