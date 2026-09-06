import { Pressable, View, Text } from "react-native";

// src/features/voyages/components/detail/VoyageStickyBar.tsx
import { ShoppingCart, Users, AlertCircle } from "lucide-react-native";
import type { VoyageTrip } from "../../types";

interface VoyageStickyBarProps {
  trip: VoyageTrip;
  onBook: () => void;
}

export function VoyageStickyBar({ trip, onBook }: VoyageStickyBarProps) {
  const price = trip.price ?? 0;
  const currency = trip.currency || "FCFA";
  const available = trip.availableSeats ?? 0;
  const total = trip.totalSeats ?? 0;

  const isAvailable = available > 0;
  const occupancyRate =
    total > 0 ? Math.round(((total - available) / total) * 100) : 0;

  return (
    <View
      className="w-full bg-[#0e0e22] border-t border-white/10 px-4 py-3 md:px-6 md:py-4"
    >
      <View className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <View className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
          <View>
            <Text className="text-white font-bold text-lg md:text-xl">
              {price.toLocaleString()} {currency}
            </Text>
            <Text className="text-white/40 text-xs">par personne</Text>
          </View>

          <View className="flex items-center gap-2 text-xs">
            <Users size={14} className="text-indigo-400" />
            <Text className="text-white/60">
              {available} <Text>places disponibles</Text></Text>
            <Text className="text-white/30"><Text>(</Text>{occupancyRate}<Text>% occupé)</Text></Text>
            {!isAvailable && (
              <Text className="flex items-center gap-1 text-red-400">
                <AlertCircle size={12} />
                <Text>Complet</Text></Text>
            )}
          </View>
        </View>

        <Pressable
          onPress={onBook}
          disabled={!isAvailable}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold text-white transition-all ${
            isAvailable
              ? "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 shadow-lg shadow-indigo-500/25 active:scale-95"
              : "bg-white/10 text-white/30 cursor-not-allowed"
          }`}
        >
          <ShoppingCart size={16} />
          {isAvailable ? "Réserver" : "Complet"}
        </Pressable>
      </View>
    </View>
  );
}
