import { View, Text } from "react-native";
// src/features/marketplace/components/ProductFlashSale.tsx
import { useState, useEffect } from "react";
import { Zap } from "lucide-react-native";
import { formatPrice } from "../utils/formatter";

interface Props {
  originalPrice: number;
  flashPrice: number;
  currency: string;
  endsAt: string;
  stock: number;
}

export function ProductFlashSale({
  originalPrice,
  flashPrice,
  currency,
  endsAt,
  stock,
}: Props) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const target = new Date(endsAt).getTime();
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0)
    return null;

  return (
    <View
      className="p-4 rounded-2xl"
      style={{ borderWidth: 1, borderColor: "rgba(239,68,68,0.2)", borderStyle: "solid" }}
    >
      <View className="flex items-center gap-2 mb-2">
        <Zap size={16} className="text-red-400" />
        <Text className="text-red-400 font-bold text-sm">Vente Flash</Text>
      </View>
      <View className="flex items-center justify-between">
        <View>
          <Text className="text-white/40 text-xs line-through">
            {formatPrice(originalPrice, currency)}
          </Text>
          <Text className="text-white font-black text-2xl">
            {formatPrice(flashPrice, currency)}
          </Text>
        </View>
        <View className="text-right">
          <Text className="text-white/40 text-xs">Stock limité</Text>
          <Text className="text-white font-bold text-sm">
            {stock} restant{stock > 1 ? "s" : ""}
          </Text>
        </View>
      </View>
      <View className="flex items-center gap-1 mt-2">
        {["heures", "minutes", "secondes"].map((label, i) => {
          const value = [timeLeft.hours, timeLeft.minutes, timeLeft.seconds][i];
          return (
            <View key={label} className="flex-1 text-center">
              <View className="bg-black/40 rounded-lg py-1 px-2">
                <Text className="text-white font-bold text-lg">
                  {String(value).padStart(2, "0")}
                </Text>
              </View>
              <Text className="text-[8px] text-white/30 uppercase">
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
