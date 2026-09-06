import { View, Text, Image } from "react-native";
// src/features/sante/components/DoctorBooking.tsx
import { Calendar, Clock, Video, Activity } from "lucide-react-native";

export interface DoctorBookingProps {
  doctor: {
    id: string;
    name: string;
    specialty: string;
    fees: number;
    currency: string;
    image?: string;
  };
  slots: string[];
  onBook: (slot: string, type: "consultation" | "teleconsultation") => void;
  isLoading?: boolean;
}

export function DoctorBooking({
  doctor,
  slots,
  onBook,
  isLoading = false,
}: DoctorBookingProps) {
  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
        <Calendar size={14} /> Prendre rendez-vous
      </Text>

      <View className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 mb-4">
        {doctor.image && (
          <Image
           
           
            className="w-10 h-10 rounded-xl object-cover"
           source={{ uri: doctor.image }} accessibilityLabel={doctor.name}/>
        )}
        <View className="flex-1">
          <Text className="text-white text-sm font-medium">{doctor.name}</Text>
          <Text className="text-white/40 text-xs">{doctor.specialty}</Text>
        </View>
        <Text className="text-sm font-bold text-white">
          {doctor.fees} {doctor.currency}
        </Text>
      </View>

      <View className="space-y-3">
        <View>
          <Text className="text-xs text-white/40 mb-2">Créneaux disponibles</Text>
          <View className="flex flex-wrap gap-2">
            {slots.length === 0 ? (
              <Text className="text-xs text-white/30"><Text>Aucun créneau disponible</Text></Text>
            ) : (
              slots.slice(0, 6).map((slot) => (
                <Pressable
                  key={slot}
                  onPress={() => onBook(slot, "consultation")}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 text-white/70 border border-white/10 disabled:opacity-50"
                >
                  <Clock size={10} className="inline mr-1" />
                  {slot}
                </Pressable>
              ))
            )}
          </View>
        </View>

        <Pressable
          onPress={() => slots[0] && onBook(slots[0], "consultation")}
          disabled={slots.length === 0 || isLoading}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-500 to-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading
            ? "Confirmation..."
            : `Réserver (${doctor.fees} ${doctor.currency})`}
        </Pressable>

        <Pressable
          onPress={() => slots[0] && onBook(slots[0], "teleconsultation")}
          disabled={slots.length === 0 || isLoading}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-blue-400 bg-blue-500/20 border border-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Video size={14} /> <Text>Téléconsultation</Text></Pressable>
      </View>
    </View>
  );
}
