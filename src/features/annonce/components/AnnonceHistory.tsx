import { View, Text } from "react-native";
import { Clock, TrendingDown, TrendingUp } from "lucide-react-native";
import { formatPrice } from "@/lib/utils";

interface PriceHistoryEntry {
  date: number;
  price: number;
}

interface Props {
  createdAt: number;
  priceHistory?: PriceHistoryEntry[];
  currentPrice?: number;
  currency?: string;
}

export function AnnonceHistory({
  createdAt,
  priceHistory = [],
  currentPrice,
  currency = "USD",
}: Props) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Déterminer la tendance des prix
  const getPriceTrend = () => {
    if (!priceHistory.length || !currentPrice) return null;
    const firstPrice = priceHistory[0]?.price || currentPrice;
    const lastPrice =
      priceHistory[priceHistory.length - 1]?.price || currentPrice;
    if (lastPrice > firstPrice)
      return {
        icon: TrendingUp,
        color: "text-emerald-400",
        label: "en hausse",
      };
    if (lastPrice < firstPrice)
      return { icon: TrendingDown, color: "text-red-400", label: "en baisse" };
    return null;
  };

  const trend = getPriceTrend();

  return (
    <View className="space-y-2"><View className="flex items-center gap-2"><Clock size={14} className="text-white/30" /><Text className="text-sm font-medium text-white/50">Historique</Text></View><Text className="text-xs text-white/40">Publiée le {formatDate(createdAt)}</Text>{priceHistory.length > 0 && (
        <View className="space-y-1"><View className="flex items-center gap-2"><Text className="text-xs text-white/30">Évolution du prix :</Text>{trend && (
              <View className={`flex items-center gap-1 text-xs ${trend.color}`}><trend.icon size={12} /><Text>{trend.label}</Text></View>
            )}</View><View className="flex items-center gap-2 overflow-x-auto pb-1">{priceHistory.map((entry, i) => (
              <View key={i} className="flex-shrink-0 px-2 py-1 rounded-lg bg-white/5 text-xs text-white/40">
                {formatDate(entry.date)}: {formatPrice(entry.price, currency)}
              </View>
            ))}{currentPrice && (
              <View className="flex-shrink-0 px-2 py-1 rounded-lg bg-orange-500/20 text-xs text-orange-400 font-medium">
                Actuel: {formatPrice(currentPrice, currency)}
              </View>
            )}</View></View>
      )}</View>
  );
}
