import { View, Text } from "react-native";
import { formatPrice } from "@/lib/utils";
import type { Annonce } from "../types";

interface Props {
  annonce: Annonce;
  showOriginalPrice?: boolean;
}

export function AnnoncePrice({ annonce, showOriginalPrice }: Props) {
  const hasPrice = annonce.price !== undefined && annonce.price !== null;

  if (!hasPrice) {
    return <View className="text-white/50 text-sm"><Text>Prix sur demande</Text></View>;
  }

  // ✅ Sécuriser les accès à annonce.price
  const price = annonce.price as number;
  const minPrice = annonce.minPrice;
  const isDiscounted = showOriginalPrice && minPrice && minPrice < price;

  return (
    <View className="space-y-1">
      <View className="flex items-baseline gap-3">
        <Text className="text-2xl font-black text-white">
          {formatPrice(price, annonce.currency)}
        </Text>
        {annonce.negotiable && (
          <Text className="text-xs text-white/40 font-medium"><Text>Négociable</Text></Text>
        )}
      </View>

      {isDiscounted && minPrice && (
        <View className="flex items-center gap-2">
          <Text className="text-sm text-white/30 line-through">
            {formatPrice(price, annonce.currency)}
          </Text>
          <Text className="text-xs text-emerald-400 font-medium">
            <Text>-</Text>{Math.round(((price - minPrice) / price) * 100)}<Text>%</Text></Text>
        </View>
      )}

      {annonce.isSold && (
        <View className="text-xs text-red-400 font-medium"><Text>⚠️ Déjà vendu</Text></View>
      )}
      {annonce.isReserved && !annonce.isSold && (
        <View className="text-xs text-amber-400 font-medium">
          <Text>🔒 En réservation</Text></View>
      )}
    </View>
  );
}
