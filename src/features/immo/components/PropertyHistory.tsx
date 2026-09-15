import { View, Text } from "react-native";
import { Clock, TrendingUp, TrendingDown } from "lucide-react-native";

interface Props {
  price: number;
  currency: string;
  createdAt: number;
  // Historique des prix simulé
  priceHistory?: Array<{ date: number; price: number }>;
}

export function PropertyHistory({
  price,
  currency,
  createdAt,
  priceHistory,
}: Props) {
  const timeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    return `Il y a ${days} jours`;
  };

  const hasHistory = priceHistory && priceHistory.length > 0;

  return (
    <View className="bg-white/5 rounded-2xl p-4"><Text className="text-sm font-medium text-white/70 mb-2">Historique</Text><View className="space-y-2"><View className="flex justify-between text-sm"><Text className="text-white/40">Prix actuel</Text><Text className="text-white font-bold">{price.toLocaleString()}{currency}</Text></View><View className="flex justify-between text-sm"><Text className="text-white/40">Publié le</Text><Text className="text-white/60">{new Date(createdAt).toLocaleDateString()}</Text></View>{hasHistory && (
          <>
            <View className="border-t border-white/5 pt-2 mt-2">
              <Text className="text-xs text-white/40">Évolution des prix</Text>
              {priceHistory.slice(0, 5).map((item, idx) => (
                <View key={idx} className="flex justify-between text-xs text-white/50 py-1 border-b border-white/5 last:border-0">
                  <Text>{new Date(item.date).toLocaleDateString()}</Text>
                  <Text className="flex items-center gap-1">
                    {item.price >
                    (priceHistory[idx - 1]?.price || item.price) ? (
                      <TrendingUp size={10} className="text-green-400" />
                    ) : item.price <
                      (priceHistory[idx - 1]?.price || item.price) ? (
                      <TrendingDown size={10} className="text-red-400" />
                    ) : null}
                    {item.price.toLocaleString()} {currency}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}</View></View>
  );
}
