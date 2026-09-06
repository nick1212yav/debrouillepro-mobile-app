import { View, Text } from "react-native";
// src/features/transport/components/detail/TransportSchedule.tsx
import { Clock, CalendarRange } from "lucide-react-native";

interface TransportScheduleProps {
  schedule?: string; // "Lun-Ven 08:00 - 18:00"
}

export function TransportSchedule({
  schedule = "Lun-Ven 08:00 - 18:00",
}: TransportScheduleProps) {
  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4">
      <View className="flex items-center gap-2">
        <CalendarRange size={16} className="text-violet-400" />
        <Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
          Grille Horaire [2]
        </Text>
      </View>

      <View className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0c0d1e] border border-white/5 text-xs">
        <View className="flex items-center gap-2 text-white/70">
          <Clock size={14} className="text-violet-400" />
          <Text className="font-bold"><Text>Horaires opérationnels</Text></Text>
        </View>
        <strong className="text-white font-black">{schedule} <Text>[2]</Text></strong>
      </View>

      <Text className="text-[10px] text-white/40 leading-relaxed text-center">
        <Text>Les départs sont assujettis aux conditions réelles de trafic et de météo régionale [2].</Text></Text>
    </View>
  );
}
