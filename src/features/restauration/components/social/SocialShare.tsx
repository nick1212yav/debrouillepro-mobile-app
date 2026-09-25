// src/features/restauration/components/social/SocialShare.tsx

import { View, Text, Alert, Linking, Pressable, Share } from "react-native";
import {
  Share2,
  Clipboard as ClipboardIcon,
  MessageCircle,
} from "lucide-react-native";
import { Clipboard } from "@react-native-clipboard/clipboard";

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
    try {
      await Share.share({
        title,
        message: `${text} ${url}`,
        url,
      });
    } catch (error) {
      console.warn("Partage système annulé ou non supporté :", error);
    }
  };

  const handleCopyLink = () => {
    Clipboard.setString(url);
    Alert.alert("Lien copié", "Le lien de l'établissement a été copié.");
  };

  const handleWhatsApp = () => {
    void Linking.openURL(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(
        `${text} ${url}`,
      )}`,
    );
  };

  const handleFacebook = () => {
    void Linking.openURL(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    );
  };

  return (
    <View className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04]">
      <Text className="text-[10px] text-white/40 uppercase font-black tracking-wider px-1 mb-3">
        Partager l'établissement
      </Text>

      <View className="gap-2">
        <Pressable
          onPress={handleSystemShare}
          className="p-3 rounded-xl bg-white/5 border border-white/[0.06] items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Partager avec le système"
        >
          <Share2 size={16} color="#FB923C" />

          <Text className="text-[9px] text-white font-bold uppercase tracking-wider mt-1.5">
            Système
          </Text>
        </Pressable>

        <Pressable
          onPress={handleWhatsApp}
          className="p-3 rounded-xl bg-white/5 border border-white/[0.06] items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Partager sur WhatsApp"
        >
          <MessageCircle size={16} color="#34D399" />

          <Text className="text-[9px] text-white font-bold uppercase tracking-wider mt-1.5">
            WhatsApp
          </Text>
        </Pressable>

        <Pressable
          onPress={handleFacebook}
          className="p-3 rounded-xl bg-white/5 border border-white/[0.06] items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Partager sur Facebook"
        >
          <Text className="text-[18px] text-sky-400 font-black">f</Text>

          <Text className="text-[9px] text-white font-bold uppercase tracking-wider mt-1.5">
            Facebook
          </Text>
        </Pressable>

        <Pressable
          onPress={handleCopyLink}
          className="p-3 rounded-xl bg-white/5 border border-white/[0.06] items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Copier le lien"
        >
          <ClipboardIcon size={16} color="rgba(255,255,255,0.5)" />

          <Text className="text-[9px] text-white font-bold uppercase tracking-wider mt-1.5">
            Copier
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
