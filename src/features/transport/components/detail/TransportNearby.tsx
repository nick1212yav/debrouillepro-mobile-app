import { View, Text } from "react-native";
import { Navigation } from "lucide-react-native";

export function TransportNearby() {
  const hubs = [
    { name: "Gare Centrale de Kinshasa", dist: "850 m" },
    { name: "Station de Taxi Boulevard", dist: "1,2 km" },
  ];

  return (
    <View className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] space-y-3"><Text className="text-[10px] font-black text-white/40 uppercase tracking-widest">Stations proches de vous
      </Text><View className="space-y-2">{hubs.map((hb) => (
          <View key={hb.name} className="flex items-center justify-between text-xs">
            <Text className="text-white/80 flex items-center gap-1.5">
              <Navigation size={10} className="text-violet-400" />
              {hb.name}
            </Text>
            <Text className="text-white/40 font-mono">{hb.dist}</Text>
          </View>
        ))}</View></View>
  );
}
