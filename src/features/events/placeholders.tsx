import { View, Text } from "react-native";
// src/features/events/placeholders.tsx
export function EventPlaceholder() {
  return (
    <View
      className="rounded-3xl p-8 text-center"
      style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
    >
      <View className="text-4xl mb-3"><Text>🎫</Text></View>
      <Text className="text-white/60"><Text>Module événements</Text></Text>
      <Text className="text-white/30 text-sm"><Text>En construction</Text></Text>
    </View>
  );
}

export function EventCommentsPlaceholder() {
  return (
    <View className="text-white/40 text-sm py-4 text-center">
      💬 Les commentaires arrivent bientôt
    </View>
  );
}

export function EventTicketsPlaceholder() {
  return (
    <View className="text-white/40 text-sm py-4 text-center">
      🎟️ Billetterie disponible prochainement
    </View>
  );
}
