import { View, Text } from "react-native";
import { Truck } from "lucide-react-native";
import { formatPrice } from "@/lib/utils";

interface Props {
  available: boolean;
  price?: number;
  currency?: string;
}

export function AnnonceShipping({ available, price, currency = "USD" }: Props) {
  if (!available) return null;

  return (
    <View className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
      <Truck size={16} className="text-white/40" />
      <View className="flex-1">
        <Text className="text-xs text-white/80 font-medium">
          <Text>Livraison disponible</Text></Text>
        {price !== undefined && (
          <Text className="text-xs text-white/40">
            <Text>Frais de livraison :</Text>{formatPrice(price, currency)}
          </Text>
        )}
      </View>
    </View>
  );
}
