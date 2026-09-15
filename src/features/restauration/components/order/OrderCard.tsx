import { View, Text } from "react-native";
import type { OrderDetail } from "../../types/order.types";
import { OrderStatus } from "./OrderStatus";
import { Calendar, ShoppingBag } from "lucide-react-native";

interface OrderCardProps {
  order: OrderDetail;
  onSelect?: (orderId: string) => void;
}

export function OrderCard({ order, onSelect }: OrderCardProps) {
  const formattedDate = new Date(order.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View onPress={() => onSelect?.(order.id)} className={`p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-3 text-left ${
        onSelect ? "cursor-pointer hover:bg-white/[0.05] transition-all" : ""
      }`}><View className="flex justify-between items-start gap-2"><View><Text className="block text-[9px] text-white/40 uppercase font-bold">Numéro de Commande
          </Text><Text className="text-xs font-mono font-bold text-white/80">{order.id}</Text></View><OrderStatus status={order.status} /></View><View className="border-t border-b border-white/[0.04] py-2.5 my-0.5 space-y-1"><Text className="font-extrabold text-sm text-white">{order.restaurantName}</Text><Text className="text-xs text-white/50 truncate">{order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}</Text></View><View className="flex justify-between items-center text-xs"><View className="flex items-center gap-1.5 text-white/40"><Calendar size={13} /><Text>{formattedDate}</Text></View><View className="flex items-center gap-1"><ShoppingBag size={13} className="text-orange-400" /><Text className="font-black text-orange-400">{order.total.toLocaleString()}FCFA
          </Text></View></View></View>
  );
}
