import { Text, View } from "react-native";

// src/features/events/components/TicketPlaceholder.tsx
import { Ticket } from "lucide-react-native";

export function TicketPlaceholder() {
  return (
    <View
      className="rounded-2xl p-6 text-center"
      style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
    >
      <Ticket size={24} className="text-white/20 mx-auto mb-2" />
      <Text className="text-white/40 text-sm">Billetterie disponible</Text>
      <Text className="text-white/20 text-xs">
        Les billets seront en vente prochainement
      </Text>
    </View>
  );
}
