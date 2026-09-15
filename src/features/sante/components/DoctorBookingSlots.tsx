import { Text, View, Pressable } from "react-native";

// src/features/sante/components/DoctorBookingSlots.tsx
import { Clock } from "lucide-react-native";

interface DoctorBookingSlotsProps {
  slots: string[];
  selectedSlot?: string;
  onSelectSlot: (slot: string) => void;
}

export function DoctorBookingSlots({
  slots,
  selectedSlot,
  onSelectSlot,
}: DoctorBookingSlotsProps) {
  if (!slots || slots.length === 0) {
    return <Text className="text-xs text-white/30">Aucun créneau disponible</Text>;
  }

  return (
    <View className="space-y-2"><Text className="text-xs text-white/40">Créneaux disponibles</Text><View className="flex flex-wrap gap-2">{slots.map((slot) => (
          <Pressable key={slot} onPress={() => onSelectSlot(slot)} className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
              ${
                selectedSlot === slot
                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                  : "bg-white/10 text-white/70 border border-white/10 hover:bg-white/20"
              }
            `}>
            <Clock size={10} />
            {slot}
          </Pressable>
        ))}</View></View>
  );
}
