import { View, Text } from "react-native";
import { MapPin } from "lucide-react-native";

export interface TransportRecommendationsProps {
  origin: string;
}

export function TransportRecommendations({
  origin,
}: TransportRecommendationsProps) {
  const list = [
    { route: "Matadi", price: "25 000 FC", time: "3h 45" },
    { route: "Kikwit", price: "40 000 FC", time: "6h 20" },
  ];

  return (
    <View className="space-y-3">
      <Text className="text-[10px] font-black text-white/40 uppercase tracking-widest">
        Vous pourriez aimer
      </Text>
      <View className="space-y-2">
        {list.map((item) => (
          <View
            key={item.route}
            className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02]"
          >
            <View className="flex items-center gap-2">
              <MapPin size={12} className="text-violet-400" />
              <Text className="text-xs font-bold text-white">
                {origin} → {item.route}
              </Text>
            </View>
            <View className="text-right">
              <Text className="text-xs font-bold text-violet-400">{item.price}</Text>
              <Text className="text-[9px] text-white/40">{item.time}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
