import { View, Text, Alert, Pressable } from "react-native";
import { Radio } from "lucide-react-native";

export function RestaurantLive() {
  return (
    <View className="px-4 py-2">
      <Pressable
        onPress={() => Alert.alert("Connexion au flux vidéo direct de la cuisine...")}
        className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/15 flex items-center justify-between"
      >
        <View className="flex items-center gap-2.5">
          <Text className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <View className="text-left">
            <Text className="block text-[8px] text-rose-400 uppercase font-black tracking-wider">
              <Text>Cuisine en direct</Text></Text>
            <Text className="text-xs text-white/90 font-bold">
              <Text>Suivre la préparation des plats</Text></Text>
          </View>
        </View>
        <Radio size={16} className="text-rose-400" />
      </Pressable>
    </View>
  );
}
