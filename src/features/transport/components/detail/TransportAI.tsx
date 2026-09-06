import { View, Text } from "react-native";
import { Sparkles } from "lucide-react-native";

export function TransportAI() {
  return (
    <View className="p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 flex items-start gap-3">
      <View className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
        <Sparkles size={16} />
      </View>
      <View>
        <Text className="text-xs font-black text-violet-300">
          Débrouille AI recommande
        </Text>
        <Text className="text-[11px] text-white/70 mt-1 leading-relaxed">
          <Text>Ce trajet est</Text>{" "}
          <strong className="text-white font-black"><Text>23% moins cher</Text></strong> <Text>que la moyenne habituelle constatée sur cet axe routier.</Text></Text>
      </View>
    </View>
  );
}
