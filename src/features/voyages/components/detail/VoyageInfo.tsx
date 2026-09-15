import { View, Text } from "react-native";

// src/features/voyages/components/detail/VoyageInfo.tsx
import type { VoyageTrip } from "../../types/voyage.types";
import { Clock, Users, ShieldAlert } from "lucide-react-native";

interface VoyageInfoProps {
  trip: VoyageTrip;
}

export function VoyageInfo({ trip }: VoyageInfoProps) {
  const formatDuration = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h00`;
  };

  return (
    <View className="rounded-[24px] p-4 bg-white/[0.02] border border-white/5 space-y-4"><Text className="text-xs font-bold text-white/40 uppercase tracking-widest">Informations pratiques
      </Text><View className="gap-3 text-xs">{}{trip.durationMinutes > 0 && (
          <View className="flex items-center gap-3"><Clock size={16} className="text-white/30" /><View><Text className="text-white/40 text-[10px]">Durée estimée</Text><Text className="text-white font-medium">{formatDuration(trip.durationMinutes)}</Text></View></View>
        )}<View className="flex items-center gap-3"><Users size={16} className="text-white/30" /><View><Text className="text-white/40 text-[10px]">Capacité totale</Text><Text className="text-white font-medium">{trip.totalSeats}places</Text></View></View></View></View>
  );
}
