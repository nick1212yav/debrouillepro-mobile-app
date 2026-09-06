import { Text, View } from "react-native";

// src/features/voyages/components/detail/VoyageSimilar.tsx
import { ArrowRight, Star } from "lucide-react-native";
import type { VoyageTrip } from "../../types";

interface VoyageSimilarProps {
  trip: VoyageTrip;
  onSelect?: (id: string) => void;
}

export function VoyageSimilar({ trip, onSelect }: VoyageSimilarProps) {
  // Pour l'instant, un placeholder. Plus tard, on utilisera une requête Convex.
  // On affiche simplement un message.
  return (
    <View
      className="rounded-3xl p-6 bg-white/5 border border-white/10"
    >
      <View className="flex items-center gap-2 mb-4">
        <ArrowRight size={16} className="text-indigo-400" />
        <Text className="text-white font-bold text-base">
          Vous pourriez aussi aimer
        </Text>
      </View>

      <View className="text-white/40 text-sm">
        <Text>Découvrez d'autres trajets similaires.</Text>
        <Text className="text-white/30 text-xs mt-1">Fonctionnalité à venir</Text>
      </View>
    </View>
  );
}
