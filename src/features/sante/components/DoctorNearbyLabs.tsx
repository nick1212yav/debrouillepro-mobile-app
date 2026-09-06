import { View, Text, Pressable } from "react-native";
// src/features/sante/components/DoctorNearbyLabs.tsx
import { FlaskRound, MapPin, Star } from "lucide-react-native";

export interface NearbyLab {
  id: string;
  name: string;
  address: string;
  distance: string;
  rating: number;
  tests: number;
  onSelect?: () => void;
}

interface DoctorNearbyLabsProps {
  labs: NearbyLab[];
  onLabSelect?: (lab: NearbyLab) => void;
}

export function DoctorNearbyLabs({ labs, onLabSelect }: DoctorNearbyLabsProps) {
  if (!labs || labs.length === 0) {
    return (
      <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
        <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3">
          <FlaskRound size={14} /> Laboratoires à proximité
        </Text>
        <Text className="text-xs text-white/30 text-center py-4">
          Aucun laboratoire trouvé
        </Text>
      </View>
    );
  }

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3">
        <FlaskRound size={14} /> Laboratoires à proximité ({labs.length})
      </Text>
      <View className="space-y-2">
        {labs.slice(0, 3).map((l) => (
          <Pressable
            key={l.id}
            onPress={() => onLabSelect?.(l)}
            className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10"
          >
            <View className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <FlaskRound size={18} className="text-purple-400" />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-white text-sm font-medium truncate">
                {l.name}
              </Text>
              <Text className="text-white/40 text-xs flex items-center gap-1">
                <MapPin size={10} /> {l.address}
              </Text>
            </View>
            <View className="text-right flex-shrink-0">
              <Text className="text-white/60 text-xs">{l.distance}</Text>
              <View className="flex items-center gap-0.5 text-yellow-400 text-[10px]">
                <Star size={10} fill="currentColor" />
                <Text>{l.rating.toFixed(1)}</Text>
              </View>
              <Text className="text-[8px] text-white/30">{l.tests} <Text>tests</Text></Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
