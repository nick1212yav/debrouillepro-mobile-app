import { View, Text, Alert, Linking } from "react-native";
import { Share2, Clipboard, MessageCircle } from "lucide-react-native";

interface SocialShareProps {
  url: string;
  title: string;
  text?: string;
}

export function SocialShare({
  url,
  title,
  text = "Découvrez ce restaurant incroyable sur DébrouillePro !",
}: SocialShareProps) {
  const handleSystemShare = async () => {
    if (undefined) {
      try {
        await undefined;
      } catch (err) {
        console.warn("Partage système annulé ou non supporté:", err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    undefined.writeText(url);
    Alert.alert("Lien de l'établissement copié !");
  };

  return (
    <View className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04] text-left space-y-3">
      <Text className="block text-[10px] text-white/40 uppercase font-black tracking-wider px-1">
        Partager l'établissement
      </Text>

      <View className="gap-2">
        <Pressable
          onPress={handleSystemShare}
          className="p-3 rounded-xl bg-white/5 border border-white/[0.06] text-white flex flex-col items-center justify-center"
        >
          <Share2 size={16} className="text-orange-400" />
          <Text className="text-[9px] font-bold uppercase tracking-wider mt-1.5">
            <Text>Système</Text></Text>
        </Pressable>

        <Pressable
          onPress={() =>
            Linking.openURL(String(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}`))
          }
          className="p-3 rounded-xl bg-white/5 border border-white/[0.06] text-white flex flex-col items-center justify-center"
        >
          <MessageCircle size={16} className="text-emerald-400" />
          <Text className="text-[9px] font-bold uppercase tracking-wider mt-1.5">
            <Text>WhatsApp</Text></Text>
        </Pressable>

        <Pressable
          onPress={() =>
            Linking.openURL(String(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`))
          }
          className="p-3 rounded-xl bg-white/5 border border-white/[0.06] text-white flex flex-col items-center justify-center"
        >
          {/* Logo Facebook personnalisé au format SVG natif pour éviter les dépendances manquantes */}
          <svg
            className="w-4 h-4 text-sky-400 fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M9 8H7v3h3v9h4v-9h3l.5-3H14V6.5c0-.8.5-1 1-1h2.5V2H14c-3.3 0-5 1.8-5 4.5V8z" />
          </svg>
          <Text className="text-[9px] font-bold uppercase tracking-wider mt-1.5">
            <Text>Facebook</Text></Text>
        </Pressable>

        <Pressable
          onPress={handleCopyLink}
          className="p-3 rounded-xl bg-white/5 border border-white/[0.06] text-white flex flex-col items-center justify-center"
        >
          <Clipboard size={16} className="text-white/50" />
          <Text className="text-[9px] font-bold uppercase tracking-wider mt-1.5">
            <Text>Copier</Text></Text>
        </Pressable>
      </View>
    </View>
  );
}
