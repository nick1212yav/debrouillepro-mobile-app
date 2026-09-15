import { View, Text } from "react-native";
import {
  Shield,
  Wifi,
  Droplets,
  Zap,
  School,
  ShoppingBag,
  Bus,
} from "lucide-react-native";

interface Props {
  city: string;
}

export function PropertyNeighborhood({ city }: Props) {
  // Données simulées – à remplacer par des données réelles plus tard
  const scores = [
    { label: "Sécurité", value: 85, icon: Shield, color: "#10B981" },
    { label: "Internet", value: 80, icon: Wifi, color: "#3B82F6" },
    { label: "Eau", value: 75, icon: Droplets, color: "#06B6D4" },
    { label: "Électricité", value: 70, icon: Zap, color: "#FBBF24" },
    { label: "Écoles", value: 90, icon: School, color: "#8B5CF6" },
    { label: "Commerces", value: 88, icon: ShoppingBag, color: "#F97316" },
    { label: "Transports", value: 78, icon: Bus, color: "#6366F1" },
  ];

  return (
    <View className="bg-white/5 rounded-2xl p-4"><Text className="text-sm font-medium text-white/70 mb-3">Quartier {city}</Text><View className="gap-3">{scores.map((item) => (
          <View key={item.label} className="flex items-center justify-between"><View className="flex items-center gap-1.5"><item.icon size={12} style={{  }} /><Text className="text-xs text-white/50">{item.label}</Text></View><View className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden"><View className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} /></View></View>
        ))}</View></View>
  );
}
