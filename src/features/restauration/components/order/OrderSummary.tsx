import { View, Text } from "react-native";
import type { OrderItem } from "../../types/order.types";

interface OrderSummaryProps {
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
}

export function OrderSummary({
  items,
  subtotal,
  deliveryFee,
  tax,
  total,
}: OrderSummaryProps) {
  return (
    <View className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-left">
      <Text className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">
        Détail des Articles
      </Text>

      {/* Liste des Plats */}
      <View className="space-y-2.5 mb-4">
        {items.map((item) => (
          <View
            key={item.name}
            className="flex justify-between items-center text-xs"
          >
            <View className="min-w-0 pr-2">
              <Text className="font-bold text-white block truncate">
                {item.name}
              </Text>
              <Text className="text-[10px] text-white/40 block mt-0.5">
                Quantité : {item.quantity}
              </Text>
            </View>
            <Text className="font-semibold text-white/80 shrink-0">
              {(item.unitPrice * item.quantity).toLocaleString()} FCFA
            </Text>
          </View>
        ))}
      </View>

      {/* Ventilation Financière */}
      <View className="border-t border-white/[0.06] pt-3 space-y-2 text-xs">
        <View className="flex justify-between text-white/50">
          <Text>Sous-total</Text>
          <Text>{subtotal.toLocaleString()} FCFA</Text>
        </View>
        <View className="flex justify-between text-white/50">
          <Text>Frais de livraison</Text>
          <Text>{deliveryFee.toLocaleString()} FCFA</Text>
        </View>
        <View className="flex justify-between text-white/50">
          <Text>Taxes (5%)</Text>
          <Text>{tax.toLocaleString()} FCFA</Text>
        </View>
        <View className="flex justify-between text-sm font-black text-white pt-2 border-t border-white/[0.04]">
          <Text><Text>Montant Total</Text></Text>
          <Text className="text-orange-400">{total.toLocaleString()} <Text>FCFA</Text></Text>
        </View>
      </View>
    </View>
  );
}
