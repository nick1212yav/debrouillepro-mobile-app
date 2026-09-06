import { View, Text } from "react-native";
// src/features/sante/components/StickyAppointmentBar.tsx
import { Phone, Video, MessageCircle, Calendar, Ambulance } from "lucide-react-native";

export interface Doctor {
  id: string;
  name: string;
  fees: number;
  currency: string;
}

interface StickyAppointmentBarProps {
  doctor: Doctor;
  onBooking: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onChat?: () => void;
  onEmergency?: () => void;
}

export function StickyAppointmentBar({
  doctor,
  onBooking,
  onCall,
  onVideoCall,
  onChat,
  onEmergency,
}: StickyAppointmentBarProps) {
  return (
    <View
      className="flex-shrink-0 p-4 border-t border-white/10"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
    >
      <View className="flex items-center gap-2">
        <Pressable
          onPress={onBooking}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-sm"
        >
          <Calendar size={16} />
          <Text>Prendre RDV</Text></Pressable>

        {onCall && (
          <Pressable
            onPress={onCall}
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-500/20 text-green-400"
          >
            <Phone size={18} />
          </Pressable>
        )}

        {onVideoCall && (
          <Pressable
            onPress={onVideoCall}
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400"
          >
            <Video size={18} />
          </Pressable>
        )}

        {onChat && (
          <Pressable
            onPress={onChat}
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400"
          >
            <MessageCircle size={18} />
          </Pressable>
        )}

        {onEmergency && (
          <Pressable
            onPress={onEmergency}
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/20 text-red-400"
          >
            <Ambulance size={18} />
          </Pressable>
        )}
      </View>
      <Text className="text-xs text-white/30 text-center mt-2">
        <Text>Consultation à partir de</Text>{doctor.fees} {doctor.currency}
      </Text>
    </View>
  );
}
