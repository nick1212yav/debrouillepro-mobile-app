import { View, Text } from "react-native";
import { CalendarRange } from "lucide-react-native";

export interface TransportAvailabilityProps {
  seatsAvailable: number;
}

export function TransportAvailability({
  seatsAvailable,
}: TransportAvailabilityProps) {
  return (
    <View className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between"><View className="flex items-center gap-3"><View className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400"><CalendarRange size={16} /></View><View><Text className="text-xs font-black text-white">Disponibilité immédiate
          </Text><Text className="text-[10px] text-white/40 mt-0.5">{seatsAvailable}places restantes sur 6
          </Text></View></View><View className="text-right"><Text className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">Forte demande
        </Text></View></View>
  );
}
