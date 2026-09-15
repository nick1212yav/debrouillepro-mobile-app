import { View, Text } from "react-native";

// src/features/events/components/EventPlaceholder.tsx
import { Calendar } from "lucide-react-native";

export function EventPlaceholder() {
  return (
    <View className="rounded-3xl p-8 text-center" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}><View className="text-4xl mb-3"><Text>🎫</Text></View><Text className="text-white/60">Aucun événement</Text><Text className="text-white/30 text-sm">Revenez plus tard</Text></View>
  );
}
