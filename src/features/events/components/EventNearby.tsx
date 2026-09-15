import { View, Text } from "react-native";

// src/features/events/components/EventNearby.tsx
import { Hotel, Utensils, Navigation, Building } from "lucide-react-native";

interface Props {
  location: string;
  latitude?: number;
  longitude?: number;
}

export function EventNearby({ location, latitude, longitude }: Props) {
  const places = [
    { icon: Hotel, label: "Hôtels", count: 12 },
    { icon: Utensils, label: "Restaurants", count: 8 },
    { icon: Navigation, label: "Parkings", count: 5 },
    { icon: Building, label: "Transports", count: 4 },
  ];

  if (!latitude || !longitude) return null;

  return (
    <View className="space-y-3"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">À proximité
      </Text><View className="gap-2">{places.map(({ icon: Icon, label, count }) => (
          <View key={label} className="rounded-2xl p-3 text-center bg-white/5 border border-white/5">
            <Icon size={16} className="text-purple-400 mx-auto mb-1" />
            <Text className="text-white font-bold text-sm">{count}</Text>
            <Text className="text-white/30 text-xs">{label}</Text>
          </View>
        ))}</View></View>
  );
}
