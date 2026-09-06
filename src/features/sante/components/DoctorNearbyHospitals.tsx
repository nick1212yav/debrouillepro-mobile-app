import { View, Text, Pressable } from "react-native";
// src/features/sante/components/DoctorNearbyHospitals.tsx
import { Hospital, MapPin, Star } from "lucide-react-native";

export interface NearbyHospital {
  id: string;
  name: string;
  address: string;
  distance: string; // "1.2 km"
  rating: number;
  emergency: boolean;
  onSelect?: () => void;
}

interface DoctorNearbyHospitalsProps {
  hospitals: NearbyHospital[];
  onHospitalSelect?: (hospital: NearbyHospital) => void;
}

export function DoctorNearbyHospitals({
  hospitals,
  onHospitalSelect,
}: DoctorNearbyHospitalsProps) {
  if (!hospitals || hospitals.length === 0) {
    return (
      <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
        <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3">
          <Hospital size={14} /> Hôpitaux à proximité
        </Text>
        <Text className="text-xs text-white/30 text-center py-4">
          Aucun hôpital trouvé
        </Text>
      </View>
    );
  }

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3">
        <Hospital size={14} /> Hôpitaux à proximité ({hospitals.length})
      </Text>
      <View className="space-y-2">
        {hospitals.slice(0, 3).map((h) => (
          <Pressable
            key={h.id}
            onPress={() => onHospitalSelect?.(h)}
            className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10"
          >
            <View className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <Hospital size={18} className="text-red-400" />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-white text-sm font-medium truncate">
                {h.name}
              </Text>
              <Text className="text-white/40 text-xs flex items-center gap-1">
                <MapPin size={10} /> {h.address}
              </Text>
            </View>
            <View className="text-right flex-shrink-0">
              <Text className="text-white/60 text-xs">{h.distance}</Text>
              <View className="flex items-center gap-0.5 text-yellow-400 text-[10px]">
                <Star size={10} fill="currentColor" />
                <Text>{h.rating.toFixed(1)}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
