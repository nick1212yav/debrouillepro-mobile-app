import { Pressable, View, Alert, Linking } from "react-native";
import { Phone, MessageSquare, ExternalLink } from "lucide-react-native";

export function RestaurantSocialActions() {
  return (
    <View className="gap-2 px-4 py-2">
      <Pressable
        onPress={() => Alert.alert("Appel du restaurant au +225 07 00 00 00")}
        className="p-3 rounded-xl flex items-center justify-center gap-2 bg-white/[0.03] border border-white/[0.06] text-xs font-bold"
      >
        <Phone size={14} className="text-orange-400" />
        Appeler
      </Pressable>

      <Pressable
        onPress={() => Alert.alert("Ouverture du Chat de service...")}
        className="p-3 rounded-xl flex items-center justify-center gap-2 bg-white/[0.03] border border-white/[0.06] text-xs font-bold"
      >
        <MessageSquare size={14} className="text-sky-400" />
        Chat Live
      </Pressable>

      <Pressable
        onPress={() => Linking.openURL("https://wa.me/22507000000")}
        className="p-3 rounded-xl flex items-center justify-center gap-2 bg-white/[0.03] border border-white/[0.06] text-xs font-bold"
      >
        <ExternalLink size={14} className="text-emerald-400" />
        WhatsApp
      </Pressable>
    </View>
  );
}
