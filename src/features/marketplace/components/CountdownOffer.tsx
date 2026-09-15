import { View, Text } from "react-native";

// src/features/marketplace/components/CountdownOffer.tsx
import { useState, useEffect } from "react";
import { Zap } from "lucide-react-native";

interface Props {
  endDate: string;
  title: string;
  color?: string;
}

export function CountdownOffer({ endDate, title, color = "#EF4444" }: Props) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const target = new Date(endDate).getTime();
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
  }, [endDate]);

  if (timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0)
    return null;

  return (
    <View className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: `${color}15`, borderStyle: "solid" }}><Zap size={18} style={{ color }} /><View className="flex-1"><Text className="text-white text-sm font-medium">{title}</Text><View className="flex items-center gap-1 mt-0.5">{["heures", "minutes", "secondes"].map((label, i) => {
            const value = [timeLeft.hours, timeLeft.minutes, timeLeft.seconds][
              i
            ];
            return (
              <View key={label} className="flex items-center gap-1">
                <Text className="text-white font-bold text-lg tabular-nums" style={{ color }}>
                  {String(value).padStart(2, "0")}
                </Text>
                <Text className="text-white/30 text-[10px] uppercase">
                  {label[0]}
                </Text>
                {i < 2 && <Text className="text-white/20">:</Text>}
              </View>
            );
          })}</View></View></View>
  );
}
