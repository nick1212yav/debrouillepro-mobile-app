import { View, Text, Pressable } from "react-native";

// src/features/voyages/components/detail/VoyageOperator.tsx
import { Building2, Star, Users, Shield, ChevronRight } from "lucide-react-native";
import type { VoyageTrip } from "../../types";

interface VoyageOperatorProps {
  trip: VoyageTrip;
  onViewProfile?: () => void;
}

export function VoyageOperator({ trip, onViewProfile }: VoyageOperatorProps) {
  const rating = trip.rating ?? 0;
  const reviewCount = trip.reviewCount ?? 0;

  return (
    <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl p-6 bg-white/5 border border-white/10">
      <View className="flex items-center gap-3 mb-4"><View className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400"><Building2 size={18} /></View><View><Text className="text-white font-bold text-base">Opérateur</Text><Text className="text-white/40 text-xs">Transporteur vérifié</Text></View></View>

      <View className="flex items-start justify-between gap-3"><View><Text className="text-white font-semibold text-lg">{trip.operator}</Text><View className="flex items-center gap-3 mt-1 text-sm"><Text className="flex items-center gap-1 text-white/60"><Star size={14} className="fill-amber-400 text-amber-400" />{rating.toFixed(1)}({reviewCount}avis)
            </Text><Text className="w-1 h-1 rounded-full bg-white/20" /><Text className="flex items-center gap-1 text-emerald-400"><Shield size={14} />Vérifié
            </Text></View><Text className="text-white/40 text-xs mt-1 flex items-center gap-1"><Users size={12} />Des milliers de voyageurs satisfaits
          </Text></View>{onViewProfile && (
          <Pressable onPress={onViewProfile} className="flex items-center gap-1 text-indigo-400 text-sm font-medium transition">
            Voir profil
            <ChevronRight size={14} />
          </Pressable>
        )}</View>
    </View>
  );
}
