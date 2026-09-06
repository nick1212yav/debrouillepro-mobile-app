import { View, Text, Pressable, Image } from "react-native";
import { useState } from "react";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  MapPin,
} from "lucide-react-native";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  id: string;
  title: string;
  price: number;
  currency: string;
  quantity: number;
  image?: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  currency: string;
  status:
    | "pending"
    | "paid"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded";
  createdAt: number;
  updatedAt: number;
  trackingNumber?: string;
  deliveryAddress?: string;
  paymentMethod: string;
}

interface Props {
  order: Order;
  onTrack?: () => void;
  onReturn?: () => void;
  onContact?: () => void;
}

const STATUS_LABELS: Record<
  Order["status"],
  { label: string; color: string; icon: any }
> = {
  pending: { label: "En attente", color: "#F59E0B", icon: Clock },
  paid: { label: "Payée", color: "#60A5FA", icon: CheckCircle },
  shipped: { label: "Expédiée", color: "#6366F1", icon: Truck },
  delivered: { label: "Livrée", color: "#10B981", icon: CheckCircle },
  cancelled: { label: "Annulée", color: "#EF4444", icon: XCircle },
  refunded: { label: "Remboursée", color: "#6B7280", icon: XCircle },
};

export function AnnonceOrder({ order, onTrack, onReturn, onContact }: Props) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_LABELS[order.status];

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      {/* En-tête */}
      <Pressable
        onPress={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        <Package size={18} className="text-white/40" />
        <View className="flex-1 min-w-0">
          <View className="flex items-center gap-2">
            <Text className="text-white font-medium text-sm">
              Commande #{order.id.slice(0, 8)}
            </Text>
            <Text
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${status.color}20`, color: status.color }}
            >
              {status.label}
            </Text>
          </View>
          <Text className="text-white/40 text-xs">
            {formatDate(order.createdAt)} · {order.items.length} articles
          </Text>
        </View>
        <View className="flex items-center gap-2">
          <Text className="text-white font-bold text-sm">
            {formatPrice(order.total, order.currency)}
          </Text>
          <status.icon size={16} style={{ color: status.color }} />
        </View>
      </Pressable>

      {/* Détails expansibles */}
      {expanded && (
        <View
          className="px-4 pb-4 space-y-3 border-t border-white/5"
        >
          {/* Articles */}
          <View className="space-y-2">
            {order.items.map((item) => (
              <View key={item.id} className="flex items-center gap-3">
                {item.image ? (
                  <Image
                   
                   
                    className="w-10 h-10 rounded-lg object-cover"
                   source={{ uri: item.image }} accessibilityLabel={item.title}/>
                ) : (
                  <View className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                    <Package size={14} className="text-white/20" />
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-white/80 text-sm">{item.title}</Text>
                  <Text className="text-white/40 text-xs"><Text>Qté:</Text>{item.quantity}</Text>
                </View>
                <Text className="text-white/80 text-sm font-medium">
                  {formatPrice(item.price * item.quantity, item.currency)}
                </Text>
              </View>
            ))}
          </View>

          {/* Livraison */}
          {order.deliveryAddress && (
            <View className="flex items-center gap-2 text-white/40 text-xs">
              <MapPin size={12} />
              <Text>{order.deliveryAddress}</Text>
            </View>
          )}
          {order.trackingNumber && (
            <View className="flex items-center gap-2 text-white/40 text-xs">
              <Truck size={12} />
              <Text><Text>Suivi:</Text>{order.trackingNumber}</Text>
            </View>
          )}

          {/* Actions */}
          <View className="flex gap-2 pt-1">
            {order.status === "shipped" && onTrack && (
              <Pressable
                onPress={onTrack}
                className="flex-1 py-2 rounded-xl text-xs font-medium text-white/70 bg-white/5"
              >
                <Text>Suivre le colis</Text></Pressable>
            )}
            {(order.status === "delivered" || order.status === "paid") &&
              onReturn && (
                <Pressable
                  onPress={onReturn}
                  className="flex-1 py-2 rounded-xl text-xs font-medium text-amber-400 bg-amber-500/10"
                >
                  <Text>Demander un retour</Text></Pressable>
              )}
            <Pressable
              onPress={onContact}
              className="flex-1 py-2 rounded-xl text-xs font-medium text-blue-400 bg-blue-500/10"
            >
              <Text>Contacter le vendeur</Text></Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
