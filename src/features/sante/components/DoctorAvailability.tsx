import { View, Text, Pressable } from "react-native";

// src/features/sante/components/DoctorAvailability.tsx
import { Clock, Calendar, CheckCircle } from "lucide-react-native";

export interface DoctorAvailabilityProps {
  available: string; // "Aujourd'hui", "Demain", etc.
  slots: string[];
  waitTime?: string;
  onSelectSlot?: (slot: string) => void;
}

export function DoctorAvailability({
  available,
  slots,
  waitTime,
  onSelectSlot,
}: DoctorAvailabilityProps) {
  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10"><View className="flex items-center justify-between mb-3"><View className="flex items-center gap-2"><Calendar size={16} className="text-white/40" /><Text className="text-white font-medium text-sm">Disponibilité</Text></View><Text className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">{available}</Text></View>{waitTime && (
        <Text className="text-xs text-white/40 mb-2 flex items-center gap-1"><Clock size={12} />Temps d'attente estimé : {waitTime}</Text>
      )}<View className="flex flex-wrap gap-2">{slots.map((slot) => (
          <Pressable key={slot} onPress={() => onSelectSlot?.(slot)} className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 text-white/70 border border-white/10 transition-colors">
            {slot}
          </Pressable>
        ))}{slots.length === 0 && (
          <Text className="text-xs text-white/30">Aucun créneau disponible</Text>
        )}</View></View>
  );
}
