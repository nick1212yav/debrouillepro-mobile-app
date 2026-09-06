import { Text, View } from "react-native";

// src/features/events/components/EventCountdown.tsx
import { useState, useEffect } from "react";
import { Clock } from "lucide-react-native";

interface Props {
  startDate: string;
}

export function EventCountdown({ startDate }: Props) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    const target = new Date(startDate).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setIsPast(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startDate]);

  if (isPast) {
    return (
      <View
        className="rounded-2xl p-4 text-center"
        style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
      >
        <Text className="text-white/40 text-sm">🎉 Événement terminé</Text>
      </View>
    );
  }

  const items = [
    { label: "Jours", value: timeLeft.days },
    { label: "Heures", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Secondes", value: timeLeft.seconds },
  ];

  return (
    <View
      className="rounded-2xl p-4"
      style={{ backgroundColor: "rgba(139,92,246,0.08)", borderWidth: 1, borderColor: "rgba(139,92,246,0.15)", borderStyle: "solid" }}
    >
      <View className="flex items-center gap-2 mb-3">
        <Clock size={14} className="text-purple-400" />
        <Text className="text-purple-300/70 text-xs font-semibold uppercase tracking-wider">
          Compte à rebours
        </Text>
      </View>
      <View className="flex justify-around">
        {items.map((item) => (
          <View key={item.label} className="flex flex-col items-center gap-0.5">
            <Text
              key={item.value}
              className="text-white font-bold text-2xl tabular-nums"
              style={{  }}
            >
              {String(item.value).padStart(2, "0")}
            </Text>
            <Text className="text-white/30 text-[9px] uppercase tracking-wider">
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
