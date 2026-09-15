import { View, Text } from "react-native";

// src/features/transport/components/detail/TransportWeather.tsx
import { CloudRain, Sun, AlertTriangle } from "lucide-react-native";

interface TransportWeatherProps {
  condition?: "sunny" | "rainy" | "cloudy";
  tempCelsius?: number;
}

export function TransportWeather({
  condition = "rainy",
  tempCelsius = 26,
}: TransportWeatherProps) {
  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4"><Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Météo Routière [2]
      </Text><View className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0c0d1e] border border-white/5"><View className="flex items-center gap-3 text-xs">{condition === "rainy" ? (
            <CloudRain size={20} className="text-blue-400 animate-bounce" />
          ) : (
            <Sun size={20} className="text-amber-400 animate-spin-slow" />
          )}<View><Text className="font-bold text-white">{condition === "rainy" ? "Pluie battante" : "Temps sec"}</Text><Text className="text-[10px] text-white/40">Température de route : {tempCelsius}°C
            </Text></View></View></View>{condition === "rainy" && (
        <View className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/15 text-[10px] text-amber-400 font-bold flex items-start gap-2 leading-relaxed">
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          <Text>
            Ralentissements majeurs prévisibles. Augmentez la vigilance de
            sécurité routière [2].
          </Text>
        </View>
      )}</View>
  );
}
