import { View, Image, Text, Pressable } from "react-native";

// src/features/voyages/components/detail/VoyageHero.tsx
import type { VoyageTrip } from "../../types/voyage.types";
import { Star, Bus, Plane } from "lucide-react-native"; // ✅ Correction : 'Minibus' remplacé par 'Bus'

interface VoyageHeroProps {
  trip: VoyageTrip;
  onGallery: () => void;
}

export function VoyageHero({ trip, onGallery }: VoyageHeroProps) {
  const Icon = trip.type === "Avion" ? Plane : Bus;

  return (
    <View className="relative w-full h-64 bg-white/[0.01] rounded-[28px] overflow-hidden border border-white/5">{trip.imageUrl ? (
        <Image className="w-full h-full object-cover" source={{ uri: trip.imageUrl }} accessibilityLabel={`${trip.from} → ${trip.to}`} />
      ) : (
        <View className="w-full h-full flex flex-col items-center justify-center text-white/10 gap-3"><Icon size={48} /></View>
      )}{}<View className="absolute inset-0 bg-gradient-to-t from-[#050812] via-transparent to-black/30 pointer-events-none" />{}<View className="absolute bottom-5 left-6 right-5 flex items-end justify-between gap-4"><View className="space-y-1"><View className="flex items-center gap-2"><Text className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"><Icon size={14} /></Text><Text className="text-white/50 text-[10px] font-bold uppercase tracking-wider">{trip.type}</Text></View><Text className="text-white font-black text-xl leading-none pt-1">{trip.from}<Text className="text-indigo-400">→</Text>{trip.to}</Text><View className="flex items-center gap-1.5 text-[10px] text-white/40 pt-1"><Star size={10} className="fill-yellow-500 text-yellow-500" /><Text className="font-bold text-white/80">{trip.rating.toFixed(1)}</Text><Text>({trip.reviewCount}avis)</Text></View></View><Pressable onPress={onGallery} className="px-3.5 py-2 rounded-xl bg-black/50 backdrop-blur-md border border-white/5 text-[10px] font-bold text-white/80 transition">Voir les photos
        </Pressable></View></View>
  );
}
