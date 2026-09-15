import { View, Text } from "react-native";

// src/features/marketplace/components/ProductShipping.tsx
import { Truck, Package, Clock, MapPin } from "lucide-react-native";

interface Props {
  method: string;
  cost: number;
  currency: string;
  estimatedDays: number;
  trackingAvailable: boolean;
}

export function ProductShipping({
  method,
  cost,
  currency,
  estimatedDays,
  trackingAvailable,
}: Props) {
  return (
    <View className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"><Truck size={16} className="text-purple-400" /><View className="flex-1"><Text className="text-white text-sm font-medium">{method}</Text><Text className="text-white/40 text-xs">{cost === 0 ? "Gratuit" : `${cost} ${currency}`}{estimatedDays > 0 && ` · ${estimatedDays} jours`}</Text></View>{trackingAvailable && (
        <Text className="text-[10px] text-emerald-400 flex items-center gap-0.5">
          <Package size={10} /> Suivi
        </Text>
      )}</View>
  );
}
