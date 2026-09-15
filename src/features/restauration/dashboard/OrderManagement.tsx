import { View, Text, Pressable } from "react-native";
import type { OrderDetail } from "../types/order.types";
import { OrderStatus } from "../types/enums";
import { Check, Flame, Truck, AlertCircle } from "lucide-react-native";

interface OrderManagementProps {
  orders: OrderDetail[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

export function OrderManagement({
  orders,
  onUpdateOrderStatus,
}: OrderManagementProps) {
  const activeOrders = orders.filter(
    (o) =>
      o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED,
  );

  return (
    <View className="space-y-4 text-left"><View className="flex justify-between items-center px-1"><Text className="text-xs font-bold uppercase tracking-wider text-white">Gestion de Cuisine ({activeOrders.length})
        </Text><Text className="text-[10px] text-white/40 uppercase font-black">Actualisé en direct
        </Text></View>{activeOrders.length > 0 ? (
        <View className="space-y-3">{activeOrders.map((order) => (
            <View key={order.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col md:flex-row justify-between gap-4 md:items-center"><View className="min-w-0 flex-1"><View className="flex items-center gap-2 flex-wrap"><Text className="text-xs font-mono font-black text-white/80">{order.id}</Text><Text className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60">{order.paymentMethod.replace("_", " ").toUpperCase()}</Text></View><Text className="text-xs text-orange-400 font-bold mt-1.5 truncate">{order.items
                    .map((i) => `${i.quantity}x ${i.name}`)
                    .join(", ")}</Text><Text className="block text-[10px] text-white/40 mt-1">Adresse : {order.deliveryAddress}</Text></View>{}<View className="flex gap-2 shrink-0 md:self-center">{order.status === OrderStatus.RECEIVED && (
                  <Pressable onPress={() =>
                      onUpdateOrderStatus(order.id, OrderStatus.PREPARING)
                    } className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500 text-slate-950 text-[10px] font-black uppercase tracking-wider transition-all">
                    <Flame size={12} /> Lancer la cuisson
                  </Pressable>
                )}{order.status === OrderStatus.PREPARING && (
                  <Pressable onPress={() =>
                      onUpdateOrderStatus(
                        order.id,
                        OrderStatus.READY_FOR_PICKUP,
                      )
                    } className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider transition-all">
                    <Check size={12} /> Signaler Prêt
                  </Pressable>
                )}{order.status === OrderStatus.READY_FOR_PICKUP && (
                  <Pressable onPress={() =>
                      onUpdateOrderStatus(order.id, OrderStatus.IN_DELIVERY)
                    } className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-500 text-white text-[10px] font-black uppercase tracking-wider transition-all">
                    <Truck size={12} /> Remettre au Livreur
                  </Pressable>
                )}{order.status === OrderStatus.IN_DELIVERY && (
                  <Pressable onPress={() =>
                      onUpdateOrderStatus(order.id, OrderStatus.DELIVERED)
                    } className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider transition-all">
                    <Check size={12} /> Confirmer la remise
                  </Pressable>
                )}<Pressable onPress={() =>
                    onUpdateOrderStatus(order.id, OrderStatus.CANCELLED)
                  } className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/15 text-[10px] font-black uppercase tracking-wider">Rejeter
                </Pressable></View></View>
          ))}</View>
      ) : (
        <View className="p-8 rounded-2xl bg-white/[0.01] border border-white/[0.04] text-center text-white/30 text-xs flex flex-col items-center gap-2">
          <AlertCircle size={20} />
          <Text>Aucune commande active à afficher sur l'écran de cuisine.</Text>
        </View>
      )}</View>
  );
}
