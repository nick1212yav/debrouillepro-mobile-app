import { View, Text } from "react-native";

// src/features/voyages/components/map/VoyageRouteLine.tsx
import type { VoyageTrip } from "../../types/voyage.types";
import { ArrowRight, Clock } from "lucide-react-native";

interface VoyageRouteLineProps {
  trip: VoyageTrip;
}

export function VoyageRouteLine({ trip }: VoyageRouteLineProps) {
  const formatDuration = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h00`;
  };

  // ✅ Correction : durationMinutes [1]
  const duration =
    trip.durationMinutes > 0 ? formatDuration(trip.durationMinutes) : "–";

  return (
    <View className="flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-white/[0.01] border border-white/5"><View className="text-left"><Text className="text-[10px] text-white/40">Départ</Text><Text className="text-xs font-bold text-white mt-1">{trip.from}</Text></View><View className="flex-1 mx-4 flex flex-col items-center gap-1"><Text className="text-[9px] text-white/30 flex items-center gap-1"><Clock size={9} />{duration}</Text><View className="w-full h-px bg-white/10 relative flex items-center justify-center"><ArrowRight size={10} className="text-white/20 absolute" /></View></View><View className="text-right"><Text className="text-[10px] text-white/40">Arrivée</Text><Text className="text-xs font-bold text-white mt-1">{trip.to}</Text></View></View>
  );
}
