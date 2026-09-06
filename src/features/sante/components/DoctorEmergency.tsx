import { View, Text, Pressable } from "react-native";
// src/features/sante/components/DoctorEmergency.tsx
import { Ambulance, Phone, MapPin, Users, Heart } from "lucide-react-native";

interface DoctorEmergencyProps {
  onEmergency?: () => void;
  onCall?: () => void;
  onShareLocation?: () => void;
  phone?: string;
}

export function DoctorEmergency({
  onEmergency,
  onCall,
  onShareLocation,
  phone = "15",
}: DoctorEmergencyProps) {
  return (
    <View className="p-4 rounded-2xl bg-red-500/10 border-2 border-red-500/30">
      <View className="flex items-center gap-3 mb-3">
        <Ambulance size={24} className="text-red-400" />
        <View className="flex-1">
          <Text className="text-white font-bold text-sm">Urgence médicale</Text>
          <Text className="text-white/50 text-xs">
            En cas de danger vital, appelez immédiatement
          </Text>
        </View>
      </View>
      <View className="flex flex-wrap gap-2">
        <Pressable
          onPress={onCall || onEmergency}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500 text-white font-bold text-sm"
        >
          <Phone size={16} /> <Text>Appeler</Text>{phone}
        </Pressable>
        <Pressable
          onPress={onShareLocation}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 text-white/80 text-sm"
        >
          <MapPin size={16} /> <Text>Position</Text></Pressable>
        <Pressable
          onPress={onEmergency}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 text-white/80 text-sm"
        >
          <Heart size={16} /> <Text>Alerte</Text></Pressable>
      </View>
      <View className="mt-3 p-2 rounded-xl bg-red-500/10 text-center">
        <Text className="text-red-400 text-xs font-medium">
          <Text>🚨 Appel d'urgence – Disponible 24h/24</Text></Text>
      </View>
    </View>
  );
}
