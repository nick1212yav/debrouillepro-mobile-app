import { View, Text } from "react-native";

// src/features/marketplace/components/Cashback.tsx
import { Coins, TrendingUp } from "lucide-react-native";

interface Props {
  amount: number;
  rate: number;
  currency: string;
  available: boolean;
}

export function Cashback({ amount, rate, currency, available }: Props) {
  const cashbackAmount = amount * (rate / 100);

  return (
    <View className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/15"><Coins size={18} className="text-green-400" /><View className="flex-1"><Text className="text-white text-sm font-medium">Cashback {rate}%
          {available && (
            <Text className="text-green-400 ml-1">✓ Disponible</Text>
          )}</Text><Text className="text-white/40 text-xs">{cashbackAmount > 0
            ? `Vous gagnez ${cashbackAmount} ${currency} de cashback`
            : "Gagnez du cashback sur cet achat"}</Text></View><TrendingUp size={14} className="text-green-400" /></View>
  );
}
