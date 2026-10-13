import { View, Text } from "react-native";
import { useServiceAvailability } from "../hooks/useServiceAvailability";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  providerId: Id<"serviceProviders">;
  /** Dev/preview : autorise la lecture des prestataires isDemo. */
  allowDemo?: boolean;
}

export function ServiceAvailability({ providerId, allowDemo }: Props) {
  const { slots, loading } = useServiceAvailability(providerId, {
    allowDemo,
  });

  if (loading) {
    return (
      <View className="p-4 rounded-2xl bg-white/5">
        <Text className="text-sm text-white/40">
          Chargement des disponibilités…
        </Text>
      </View>
    );
  }

  if (slots.length === 0) {
    return (
      <View className="p-4 rounded-2xl bg-white/5">
        <Text className="text-sm text-white/40">
          Aucune disponibilité pour le moment.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <Text className="text-sm font-medium text-white/50">Disponibilités</Text>

      {slots.map((slot) => (
        <View
          key={slot._id}
          className="p-3 rounded-xl bg-white/5 border border-white/5"
        >
          <Text className="text-white/80 text-sm font-medium">{slot.date}</Text>
          <View className="flex-row flex-wrap gap-2 mt-2">
            {slot.slots.map((time, idx) => (
              <View
                key={`${time.start}-${time.end}-${idx}`}
                className="px-2 py-1 rounded-lg bg-green-500/10"
              >
                <Text className="text-xs text-green-400">
                  {time.start} – {time.end}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
