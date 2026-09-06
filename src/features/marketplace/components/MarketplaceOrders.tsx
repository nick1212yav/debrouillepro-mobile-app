import { Text, View } from "react-native";

// src/features/marketplace/components/MarketplaceOrders.tsx
import { ShoppingBag, Clock, CheckCircle, XCircle } from "lucide-react-native";
import { formatCompactNumber } from "../utils/formatter";

interface Props {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
}

export function MarketplaceOrders({
  total,
  pending,
  completed,
  cancelled,
}: Props) {
  const stats = [
    {
      icon: ShoppingBag,
      label: "Total",
      value: formatCompactNumber(total),
      color: "#8B5CF6",
    },
    {
      icon: Clock,
      label: "En attente",
      value: formatCompactNumber(pending),
      color: "#F59E0B",
    },
    {
      icon: CheckCircle,
      label: "Livrées",
      value: formatCompactNumber(completed),
      color: "#10B981",
    },
    {
      icon: XCircle,
      label: "Annulées",
      value: formatCompactNumber(cancelled),
      color: "#EF4444",
    },
  ];

  return (
    <View className="gap-2">
      {stats.map((stat) => (
        <View
          key={stat.label}
          className="p-3 rounded-xl text-center bg-white/5 border border-white/5"
        >
          <stat.icon
            size={14}
            style={{ color: stat.color }}
            className="mx-auto mb-0.5"
          />
          <Text className="text-white font-bold text-sm">{stat.value}</Text>
          <Text className="text-white/30 text-[9px]">{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}
