import { View, Text } from "react-native";

// src/features/marketplace/components/MarketplaceDashboard.tsx
import {
  TrendingUp,
  ShoppingBag,
  Package,
  DollarSign,
  Clock,
} from "lucide-react-native";
import { formatPrice, formatCompactNumber } from "../utils/formatter";

interface Props {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  pendingOrders: number;
  currency: string;
}

export function MarketplaceDashboard({
  totalRevenue,
  totalOrders,
  totalProducts,
  pendingOrders,
  currency,
}: Props) {
  const stats = [
    {
      icon: DollarSign,
      label: "Revenu",
      value: formatPrice(totalRevenue, currency),
      color: "#10B981",
    },
    {
      icon: ShoppingBag,
      label: "Commandes",
      value: formatCompactNumber(totalOrders),
      color: "#8B5CF6",
    },
    {
      icon: Package,
      label: "Produits",
      value: formatCompactNumber(totalProducts),
      color: "#3B82F6",
    },
    {
      icon: Clock,
      label: "En attente",
      value: formatCompactNumber(pendingOrders),
      color: "#F59E0B",
    },
  ];

  return (
    <View className="gap-3">{stats.map((stat) => (
        <View key={stat.label} className="p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}><View className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${stat.color}22` }}><stat.icon size={16} style={{  }} /></View><Text className="text-white font-black text-lg">{stat.value}</Text><Text className="text-white/50 text-xs">{stat.label}</Text></View>
      ))}</View>
  );
}
