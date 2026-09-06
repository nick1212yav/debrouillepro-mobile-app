import { Text, View } from "react-native";

// src/features/voyages/components/detail/VoyageNearby.tsx
import { MapPin, Compass } from "lucide-react-native";
import type { VoyageTrip } from "../../types";

interface VoyageNearbyProps {
  trip: VoyageTrip;
}

export function VoyageNearby({ trip }: VoyageNearbyProps) {
  // Pour l'instant, un placeholder. Plus tard, on pourra afficher des lieux à proximité.
  return (
    <View
      className="rounded-3xl p-6 bg-white/5 border border-white/10"
    >
      <View className="flex items-center gap-2 mb-4">
        <Compass size={16} className="text-indigo-400" />
        <Text className="text-white font-bold text-base">À proximité</Text>
      </View>

      <View className="flex items-center gap-2 text-white/40 text-sm">
        <MapPin size={14} className="text-indigo-400" />
        <Text>
          Découvrez les lieux autour de {trip.from} et {trip.to}
        </Text>
      </View>
      <Text className="text-white/30 text-xs mt-2">Fonctionnalité à venir</Text>
    </View>
  );
}
