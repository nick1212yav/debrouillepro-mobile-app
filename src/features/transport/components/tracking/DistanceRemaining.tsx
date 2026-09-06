import { View, Text } from "react-native";
// src/features/transport/components/tracking/DistanceRemaining.tsx
import { Compass, Clock } from "lucide-react-native";

interface DistanceRemainingProps {
  distanceRemainingKm: number;
  etaMinutes: number;
}

export function DistanceRemaining({
  distanceRemainingKm,
  etaMinutes,
}: DistanceRemainingProps) {
  return (
    <View className="p-4 rounded-3xl border border-white/5 bg-white/[0.02] flex items-center justify-between gap-4">
      {/* Distance */}
      <View className="flex items-center gap-3">
        <View className="w-10 h-10 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
          <Compass size={18} className="animate-spin-slow" />
        </View>
        <View>
          <Text className="text-[9px] text-white/40 uppercase tracking-widest font-black">
            Distance [2]
          </Text>
          <Text className="text-sm font-black text-white">
            {distanceRemainingKm} km restants [2]
          </Text>
        </View>
      </View>

      {/* Temps d'approche */}
      <View className="flex items-center gap-3 text-right">
        <View className="text-right">
          <Text className="text-[9px] text-white/40 uppercase tracking-widest font-black">
            Arrivée estimée [2]
          </Text>
          <Text className="text-sm font-black text-violet-400">
            dans {etaMinutes} min [2]
          </Text>
        </View>
        <View className="w-10 h-10 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
          <Clock size={18} />
        </View>
      </View>
    </View>
  );
}
