import { View, Text } from "react-native";
// src/features/transport/components/detail/TransportPrice.tsx
import { DollarSign, Tag, Info } from "lucide-react-native";
import { formatMobilityPrice } from "../../utils/distance";

interface TransportPriceProps {
  price: number;
  currency: string;
  discountAmount?: number;
}

export function TransportPrice({
  price,
  currency,
  discountAmount = 0,
}: TransportPriceProps) {
  const finalPrice = Math.max(0, price - discountAmount);

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4">
      <View className="flex items-center gap-2">
        <DollarSign size={16} className="text-violet-400" />
        <Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
          Détail du Tarif [2]
        </Text>
      </View>

      <View className="space-y-2.5">
        {/* Tarif de base */}
        <View className="flex justify-between items-center text-xs text-white/50">
          <Text>Tarif du trajet (1 siège)</Text>
          <Text className="font-semibold text-white">
            {formatMobilityPrice(price, currency)}
          </Text>
        </View>

        {/* Réduction */}
        {discountAmount > 0 && (
          <View className="flex justify-between items-center text-xs text-emerald-400 font-bold">
            <Text className="flex items-center gap-1">
              <Tag size={12} />
              Code Promo appliqué [2]
            </Text>
            <Text>-{formatMobilityPrice(discountAmount, currency)}</Text>
          </View>
        )}

        {/* Total final */}
        <View className="flex justify-between items-center pt-2.5 border-t border-white/5 text-sm">
          <Text className="font-bold text-white/80">
            Total à régler (TTC) [2]
          </Text>
          <Text className="text-lg font-black text-violet-400">
            {formatMobilityPrice(finalPrice, currency)} [2]
          </Text>
        </View>
      </View>

      {/* Info complémentaire */}
      <View className="flex items-start gap-2 p-3 rounded-2xl bg-white/[0.01] border border-white/5 text-[10px] text-white/40 leading-relaxed">
        <Info size={12} className="text-violet-400 flex-shrink-0 mt-0.5" />
        <Text>
          <Text>Ce tarif inclut l'assurance assistance DébrouillePro et les taxes de péage routier applicables [2].</Text></Text>
      </View>
    </View>
  );
}
