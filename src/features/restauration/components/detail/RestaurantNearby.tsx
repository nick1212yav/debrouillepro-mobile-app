import { View, Text } from "react-native";
import { MapPin } from "lucide-react-native";

export function RestaurantNearby() {
  const nearbys = [{ name: "L'Avenue du Maquis", zone: "Cocody, à 450m" }];

  return (
    <View className="px-4 py-4 border-t border-white/[0.04]"><Text className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3 text-left">À proximité immédiate
      </Text>{nearbys.map((near) => (
        <View key={near.name} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-left"><View className="w-10 h-10 rounded-lg bg-orange-500/5 flex items-center justify-center text-orange-400"><MapPin size={16} /></View><View><Text className="block text-xs font-bold text-white">{near.name}</Text><Text className="block text-[10px] text-white/40 mt-0.5">{near.zone}</Text></View></View>
      ))}</View>
  );
}
