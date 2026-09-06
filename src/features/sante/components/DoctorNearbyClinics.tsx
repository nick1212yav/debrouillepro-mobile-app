import { View, Text, Pressable } from "react-native";
// src/features/sante/components/DoctorNearbyClinics.tsx
import { Building, MapPin, Star } from "lucide-react-native";

export interface NearbyClinic {
  id: string;
  name: string;
  address: string;
  distance: string;
  rating: number;
  specialties: string[];
  onSelect?: () => void;
}

interface DoctorNearbyClinicsProps {
  clinics: NearbyClinic[];
  onClinicSelect?: (clinic: NearbyClinic) => void;
}

export function DoctorNearbyClinics({
  clinics,
  onClinicSelect,
}: DoctorNearbyClinicsProps) {
  if (!clinics || clinics.length === 0) {
    return (
      <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
        <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3">
          <Building size={14} /> Cliniques à proximité
        </Text>
        <Text className="text-xs text-white/30 text-center py-4">
          Aucune clinique trouvée
        </Text>
      </View>
    );
  }

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3">
        <Building size={14} /> Cliniques à proximité ({clinics.length})
      </Text>
      <View className="space-y-2">
        {clinics.slice(0, 3).map((c) => (
          <Pressable
            key={c.id}
            onPress={() => onClinicSelect?.(c)}
            className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10"
          >
            <View className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Building size={18} className="text-blue-400" />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-white text-sm font-medium truncate">
                {c.name}
              </Text>
              <Text className="text-white/40 text-xs flex items-center gap-1">
                <MapPin size={10} /> {c.address}
              </Text>
              <View className="flex gap-1 mt-0.5 flex-wrap">
                {c.specialties.slice(0, 2).map((s) => (
                  <Text
                    key={s}
                    className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/50"
                  >
                    {s}
                  </Text>
                ))}
                {c.specialties.length > 2 && (
                  <Text className="text-[8px] text-white/30">
                    +{c.specialties.length - 2}
                  </Text>
                )}
              </View>
            </View>
            <View className="text-right flex-shrink-0">
              <Text className="text-white/60 text-xs">{c.distance}</Text>
              <View className="flex items-center gap-0.5 text-yellow-400 text-[10px]">
                <Star size={10} fill="currentColor" />
                <Text>{c.rating.toFixed(1)}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
