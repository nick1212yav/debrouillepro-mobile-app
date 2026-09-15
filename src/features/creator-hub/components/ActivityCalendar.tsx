import { View, Text } from "react-native";

// src/features/creator-hub/components/ActivityCalendar.tsx

import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Flame } from "lucide-react-native";

interface ActivityCalendarProps {
  data: Array<{ date: string; count: number }>;
}

export function ActivityCalendar({ data }: ActivityCalendarProps) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <View><Text className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5"><Flame size={11} className="text-orange-400" />Activité (14 derniers
        jours)
      </Text><View className="flex gap-1.5 items-end">{data.map((d) => {
          const intensity = d.count / max;
          const color =
            d.count === 0
              ? "rgba(255,255,255,0.05)"
              : `rgba(99,102,241,${0.2 + intensity * 0.8})`;
          const dayLabel = format(parseISO(d.date), "d", { locale: fr });
          return (
            <View key={d.date} className="flex flex-col items-center gap-1 flex-1">
              <View className="w-full rounded-md transition-all" style={{ height: `${Math.max(6, intensity * 40 + 6)}px`, backgroundColor: color, borderWidth: 0, borderColor: "rgba(99,102,241,0.4)", borderStyle: "solid" }} title={`${d.date}: ${d.count} pub${d.count > 1 ? "s" : ""}`} />
              <Text className="text-white/20 text-[9px]">{dayLabel}</Text>
            </View>
          );
        })}</View></View>
  );
}
