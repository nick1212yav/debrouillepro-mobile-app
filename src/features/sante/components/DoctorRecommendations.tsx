import { View, Text, Image, Pressable } from "react-native";
// src/features/sante/components/DoctorRecommendations.tsx
import { Users, Star, MapPin } from "lucide-react-native";

export interface RecommendedDoctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  distance: string;
  image?: string;
  available: boolean;
}

interface DoctorRecommendationsProps {
  professionals: RecommendedDoctor[];
  onSelect?: (doctor: RecommendedDoctor) => void;
}

export function DoctorRecommendations({
  professionals,
  onSelect,
}: DoctorRecommendationsProps) {
  if (!professionals || professionals.length === 0) {
    return (
      <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
        <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3">
          <Users size={14} /> Recommandations
        </Text>
        <Text className="text-xs text-white/30 text-center py-4">
          Aucune recommandation
        </Text>
      </View>
    );
  }

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3">
        <Users size={14} /> Médecins recommandés
      </Text>
      <View className="space-y-2">
        {professionals.slice(0, 3).map((doc) => (
          <Pressable
            key={doc.id}
            onPress={() => onSelect?.(doc)}
            className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10"
          >
            <Image
             
             
              className="w-10 h-10 rounded-xl object-cover"
             source={{ uri: doc.image ||
                "https://ui-avatars.com/api/?name=" +
                  encodeURIComponent(doc.name) }} accessibilityLabel={doc.name}/>
            <View className="flex-1 min-w-0">
              <Text className="text-white text-sm font-medium truncate">
                {doc.name}
              </Text>
              <Text className="text-white/40 text-xs">{doc.specialty}</Text>
            </View>
            <View className="text-right flex-shrink-0">
              <View className="flex items-center gap-0.5 text-yellow-400 text-xs">
                <Star size={10} fill="currentColor" />
                <Text>{doc.rating.toFixed(1)}</Text>
              </View>
              <View className="flex items-center gap-0.5 text-white/30 text-[10px]">
                <MapPin size={8} /> {doc.distance}
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
