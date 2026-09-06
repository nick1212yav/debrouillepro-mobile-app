import { View, Text } from "react-native";
import { Compass, Clock } from "lucide-react-native";

export function RestaurantDeliveryTracking() {
  return (
    <View className="px-4 py-2">
      <View className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
        <View className="flex items-center gap-2.5">
          <Compass size={16} className="text-orange-400 animate-spin" />
          <View className="text-left">
            <Text className="block text-[8px] text-orange-400 uppercase font-black tracking-wider">
              Suivi Livreur
            </Text>
            <Text className="text-xs text-white/95 font-bold">
              Votre coursier est en route
            </Text>
          </View>
        </View>
        <View className="flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded text-orange-400 text-xs font-bold">
          <Clock size={12} /> <Text>ETA : 12 min</Text></View>
      </View>
    </View>
  );
}
