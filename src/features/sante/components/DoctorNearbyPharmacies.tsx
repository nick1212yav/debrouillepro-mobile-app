import { View, Text, Pressable } from "react-native";
// src/features/sante/components/DoctorNearbyPharmacies.tsx
import { Pill, MapPin, Star } from "lucide-react-native";

export interface NearbyPharmacy {
  id: string;
  name: string;
  address: string;
  distance: string;
  rating: number;
  openNow: boolean;
  onSelect?: () => void;
}

interface DoctorNearbyPharmaciesProps {
  pharmacies: NearbyPharmacy[];
  onPharmacySelect?: (pharmacy: NearbyPharmacy) => void;
}

export function DoctorNearbyPharmacies({
  pharmacies,
  onPharmacySelect,
}: DoctorNearbyPharmaciesProps) {
  if (!pharmacies || pharmacies.length === 0) {
    return (
      <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
        <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3">
          <Pill size={14} /> Pharmacies à proximité
        </Text>
        <Text className="text-xs text-white/30 text-center py-4">
          Aucune pharmacie trouvée
        </Text>
      </View>
    );
  }

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3">
        <Pill size={14} /> Pharmacies à proximité ({pharmacies.length})
      </Text>
      <View className="space-y-2">
        {pharmacies.slice(0, 3).map((p) => (
          <Pressable
            key={p.id}
            onPress={() => onPharmacySelect?.(p)}
            className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10"
          >
            <View className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <Pill size={18} className="text-green-400" />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-white text-sm font-medium truncate">
                {p.name}
              </Text>
              <Text className="text-white/40 text-xs flex items-center gap-1">
                <MapPin size={10} /> {p.address}
              </Text>
            </View>
            <View className="text-right flex-shrink-0">
              <Text className="text-white/60 text-xs">{p.distance}</Text>
              <View className="flex items-center gap-0.5 text-yellow-400 text-[10px]">
                <Star size={10} fill="currentColor" />
                <Text>{p.rating.toFixed(1)}</Text>
              </View>
              <Text
                className={`text-[8px] ${p.openNow ? "text-green-400" : "text-white/30"}`}
              >
                {p.openNow ? "Ouvert" : "Fermé"}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
