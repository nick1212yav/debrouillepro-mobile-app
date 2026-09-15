import { View, Text } from "react-native";

// src/features/voyages/components/detail/VoyageRoute.tsx
import type { VoyageTrip } from "../../types/voyage.types";
import { ArrowRight, MapPin, Clock } from "lucide-react-native";

interface VoyageRouteProps {
  trip: VoyageTrip;
}

export function VoyageRoute({ trip }: VoyageRouteProps) {
  const formatDuration = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h00`;
  };

  // ✅ Correction : durationMinutes [1]
  const duration =
    trip.durationMinutes > 0 ? formatDuration(trip.durationMinutes) : "–";

  return (
    <View className="rounded-[24px] p-4 bg-white/[0.02] border border-white/5 space-y-4"><View className="flex items-center justify-between"><Text className="text-xs font-bold text-white/40 uppercase tracking-widest">Itinéraire
        </Text><Text className="text-[10px] text-green-400 font-bold border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 rounded-full">Départ garanti
        </Text></View><View className="flex items-center justify-between gap-2"><View className="flex items-center gap-3"><View className="w-8 h-8 rounded-xl bg-white/[0.03] flex items-center justify-center text-white/60"><MapPin size={15} /></View><View><Text className="text-xs text-white/40 leading-none">Départ</Text><Text className="text-sm font-black text-white mt-1.5">{trip.from}</Text></View></View><View className="flex-1 mx-3 flex flex-col items-center gap-1"><Text className="text-[9px] text-white/30 flex items-center gap-1 font-semibold"><Clock size={9} />{duration}</Text><View className="w-full h-px bg-white/10 relative flex items-center justify-center"><ArrowRight size={10} className="text-white/20 absolute" /></View></View><View className="flex items-center gap-3 text-right"><View><Text className="text-xs text-white/40 leading-none">Arrivée</Text><Text className="text-sm font-black text-white mt-1.5">{trip.to}</Text></View><View className="w-8 h-8 rounded-xl bg-white/[0.03] flex items-center justify-center text-white/60"><MapPin size={15} /></View></View></View></View>
  );
}
