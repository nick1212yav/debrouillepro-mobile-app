import { Text, Pressable, View } from "react-native";

// src/features/sante/components/EmergencyButton.tsx
import { Ambulance, Phone } from "lucide-react-native";

interface EmergencyButtonProps {
  onPress: () => void;
  phoneNumber?: string;
  className?: string;
}

export function EmergencyButton({
  onPress,
  phoneNumber = "15",
  className = "",
}: EmergencyButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`relative flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-red-500 to-red-700 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all hover:scale-[1.02] active:scale-95 ${className}`}
    >
      <View className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-400 animate-ping" />
      <Ambulance size={24} />
      <Text className="text-lg">Urgence</Text>
      <Text className="text-sm font-normal opacity-80">| {phoneNumber}</Text>
      <Phone size={16} className="opacity-80" />
    </Pressable>
  );
}
