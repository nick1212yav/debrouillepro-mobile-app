import { Text, View } from "react-native";

// src/features/voyages/components/detail/VoyageAmenities.tsx
import {
  Wifi,
  Wind,
  BatteryCharging,
  Coffee,
  UtensilsCrossed,
  Package,
  Sparkles,
  X,
} from "lucide-react-native";
import type { VoyageTrip } from "../../types";

interface VoyageAmenitiesProps {
  amenities?: string[];
}

const AMENITY_ICONS: Record<string, React.ElementType> = {
  "Wi-Fi": Wifi,
  Climatisation: Wind,
  USB: BatteryCharging,
  Collation: Coffee,
  Repas: UtensilsCrossed,
  "Bagage inclus": Package,
  Premium: Sparkles,
};

export function VoyageAmenities({ amenities = [] }: VoyageAmenitiesProps) {
  if (!amenities || amenities.length === 0) {
    return null;
  }

  return (
    <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl p-6 bg-white/5 border border-white/10">
      <Text className="text-white font-bold text-base mb-4">Équipements</Text>
      <View className="flex flex-wrap gap-3">
        {amenities.map((item) => {
          const Icon = AMENITY_ICONS[item] || X;
          return (
            <View key={item} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
              <Icon size={14} className="text-indigo-400" />
              <Text className="text-white/80 text-xs">{item}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
