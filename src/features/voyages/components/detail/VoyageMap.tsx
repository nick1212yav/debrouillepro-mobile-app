import { View, Text } from "react-native";

// src/features/voyages/components/detail/VoyageMap.tsx
import { MapPin, Map as MapIcon, ArrowRight } from "lucide-react-native";
import type { VoyageTrip } from "../../types";

interface VoyageMapProps {
  trip: VoyageTrip;
}

export function VoyageMap({ trip }: VoyageMapProps) {
  // Pour l'instant, on affiche un placeholder. Plus tard, on intégrera une vraie carte (MapLibre/Mapbox).
  return (
    <View
      className="rounded-3xl p-6 bg-white/5 border border-white/10"
    >
      <View className="flex items-center gap-2 mb-4">
        <MapIcon size={16} className="text-indigo-400" />
        <Text className="text-white font-bold text-base">Carte du trajet</Text>
      </View>

      <View className="relative h-48 rounded-2xl bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-white/10 overflow-hidden flex items-center justify-center">
        <View className="text-center text-white/40">
          <MapPin size={32} className="mx-auto mb-2 opacity-30" />
          <Text className="text-xs">
            {trip.from} → {trip.to}
          </Text>
          <View className="flex items-center justify-center gap-2 mt-2 text-white/20">
            <Text className="text-sm font-medium">{trip.from}</Text>
            <ArrowRight size={14} />
            <Text className="text-sm font-medium">{trip.to}</Text>
          </View>
          <Text className="text-[10px] mt-2 opacity-60">
            <Text>Carte interactive bientôt disponible</Text></Text>
        </View>
      </View>
    </View>
  );
}
