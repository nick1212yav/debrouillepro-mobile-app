import { View, Text, Pressable } from "react-native";
import { Mail, MessageCircle, Phone } from "lucide-react-native";

interface Props {
  ownerName?: string;
  ownerPhone?: string;
  ownerId?: string;
  onContact?: () => void;
}

export function AnnonceContact({
  ownerName,
  ownerPhone,
  ownerId,
  onContact,
}: Props) {
  if (!ownerName) return null;

  return (
    <View className="bg-white/5 rounded-2xl p-4 space-y-3">
      <Text className="text-sm font-medium text-white/50">Contacter</Text>

      <View className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
        <View className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500/30 to-orange-600/10">
          <Text className="text-orange-400 font-bold text-sm">
            {ownerName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-white font-medium text-sm">{ownerName}</Text>
          <Text className="text-white/30 text-xs">Répond généralement en 1h</Text>
        </View>
        <Pressable
          onPress={onContact}
          className="p-2 rounded-xl bg-orange-500/20 text-orange-400"
        >
          <MessageCircle size={18} />
        </Pressable>
      </View>

      <View className="flex gap-2">
        {ownerPhone && (
          <Pressable
            onPress={() => (undefined.href = `tel:${ownerPhone}`)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium"
            style={{ backgroundColor: "rgba(16,185,129,0.15)", borderWidth: 1, borderColor: "rgba(16,185,129,0.15)", borderStyle: "solid" }}
          >
            <Phone size={14} /> <Text>Appel</Text></Pressable>
        )}
        {ownerId && (
          <Pressable
            onPress={onContact}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium"
            style={{ backgroundColor: "rgba(59,130,246,0.15)", borderWidth: 1, borderColor: "rgba(59,130,246,0.15)", borderStyle: "solid" }}
          >
            <Mail size={14} /> <Text>Message</Text></Pressable>
        )}
      </View>
    </View>
  );
}
