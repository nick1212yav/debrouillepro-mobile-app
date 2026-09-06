import { View, Text } from "react-native";
import { Share2 } from "lucide-react-native";

export function ShareSection() {
  return (
    <View className="pt-2">
      <View className="text-center text-white/40 text-sm p-4 bg-white/5 rounded-xl">
        <Share2 size={24} className="mx-auto mb-2 text-white/20" />
        <Text><Text>Après création, partagez votre événement</Text></Text>
        <Text className="text-xs text-white/20 mt-1">
          <Text>Les liens de partage seront disponibles</Text></Text>
      </View>
    </View>
  );
}
