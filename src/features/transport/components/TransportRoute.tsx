import { View, Text } from "react-native";

// src/features/transport/components/TransportRoute.tsx
import { MapPin, Circle, CheckCircle } from "lucide-react-native";

interface Stop {
  name: string;
  time?: string;
  completed?: boolean;
}

interface TransportRouteProps {
  origin: string;
  destination: string;
  departureTime: string;
  stops?: Stop[];
}

export function TransportRoute({
  origin,
  destination,
  departureTime,
  stops = [],
}: TransportRouteProps) {
  // Construction du plan de route unifié
  const fullItinerary: Stop[] = [
    { name: origin, time: departureTime, completed: true },
    ...stops,
    { name: destination, time: undefined, completed: false },
  ];

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4"><Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Plan de route [2]
      </Text><View className="relative pl-6 space-y-6">{}<View className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-white/10" />{fullItinerary.map((stop, i) => {
          const isFirst = i === 0;
          const isLast = i === fullItinerary.length - 1;

          return (
            <View key={i} className="relative flex items-start gap-4">{}<View className="absolute -left-[23px] top-1 z-10">{stop.completed ? (
                  <CheckCircle
                    size={16}
                    className="text-emerald-400 fill-[#0c0d1e]"
                  />
                ) : isLast ? (
                  <MapPin size={16} className="text-violet-400" />
                ) : (
                  <Circle
                    size={14}
                    className="text-white/40 fill-[#0c0d1e] stroke-[3]"
                  />
                )}</View>{}<View className="flex-1"><Text className={`text-xs font-bold ${stop.completed ? "text-white" : "text-white/60"}`}>{stop.name}</Text>{stop.time && (
                  <Text className="text-[10px] text-white/40 mt-0.5">
                    Heure de passage : {stop.time}
                  </Text>
                )}</View></View>
          );
        })}</View></View>
  );
}
