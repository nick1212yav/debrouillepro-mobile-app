import { View, Text } from "react-native";

// src/features/marketplace/components/ProductDelivery.tsx
import { Truck, MapPin, Zap } from "lucide-react-native";

interface Props {
  deliveryAvailable: boolean;
  location?: string;
  estimatedDays?: number;
}

export function ProductDelivery({
  deliveryAvailable,
  location,
  estimatedDays = 3,
}: Props) {
  if (!deliveryAvailable) return null;

  return (
    <View className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "rgba(16,185,129,0.08)", borderWidth: 1, borderColor: "rgba(16,185,129,0.15)", borderStyle: "solid" }}><Truck size={18} className="text-emerald-400" /><View className="flex-1"><Text className="text-white text-sm font-medium">Livraison disponible</Text><Text className="text-white/40 text-xs">{location ? `Depuis ${location}` : "Livraison à domicile"}{estimatedDays > 0 &&
            ` · Livraison sous ${estimatedDays} jour${estimatedDays > 1 ? "s" : ""}`}</Text></View><Zap size={16} className="text-emerald-400" /></View>
  );
}
