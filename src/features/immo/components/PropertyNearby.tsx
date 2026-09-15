import { View, Text } from "react-native";
import {
  School,
  Hospital,
  ShoppingBag,
  UtensilsCrossed,
  Building2,
  Bus,
} from "lucide-react-native";

interface Props {
  city: string;
}

export function PropertyNearby({ city }: Props) {
  // Données simulées
  const places = [
    { icon: School, label: "Écoles", count: 5, distance: "500m" },
    { icon: Hospital, label: "Hôpitaux", count: 2, distance: "1.2km" },
    { icon: ShoppingBag, label: "Commerces", count: 12, distance: "300m" },
    { icon: UtensilsCrossed, label: "Restaurants", count: 8, distance: "400m" },
    { icon: Building2, label: "Banques", count: 3, distance: "800m" },
    { icon: Bus, label: "Transports", count: 4, distance: "150m" },
  ];

  return (
    <View className="bg-white/5 rounded-2xl p-4"><Text className="text-sm font-medium text-white/70 mb-3">À proximité</Text><View className="gap-2">{places.map((place) => (
          <View key={place.label} className="flex items-center gap-2"><place.icon size={14} className="text-white/30" /><View><Text className="text-xs text-white/60">{place.label}</Text><Text className="text-[10px] text-white/30">{place.count}· {place.distance}</Text></View></View>
        ))}</View></View>
  );
}
