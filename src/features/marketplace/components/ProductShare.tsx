import { View, Text, Pressable, TextInput, Linking } from "react-native";

// src/features/marketplace/components/ProductShare.tsx
import { useState } from "react";
import { X, Copy, Share2, MessageCircle, Link } from "lucide-react-native";
import { toast } from "sonner";
import { Clipboard } from "@react-native-clipboard/clipboard";

interface Props {
  productId: string;
  title: string;
  onClose: () => void;
}

export function ProductShare({ productId, title, onClose }: Props) {
  const url = `${window.location.origin}/marketplace/${productId}`;
  const text = `Découvrez ${title} sur DébrouillePro !`;

  const copyLink = () => {
    Clipboard.setString(url);
    toast.success("Lien copié !");
  };

  const share = (platform: string) => {
    let shareUrl = "";
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`;
        break;
    }
    if (shareUrl) Linking.openURL(String(shareUrl));
  };

  return (
    <View className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm"><View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="w-full max-w-md rounded-3xl overflow-hidden" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="p-5"><View className="flex items-center justify-between mb-4"><Text className="text-white font-bold text-lg">Partager</Text><Pressable onPress={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5 transition-colors"><X size={18} className="text-white/60" /></Pressable></View><View className="gap-2 mb-4">{[
              {
                icon: Copy,
                label: "Copier",
                onClick: copyLink,
                color: "#8B5CF6",
              },
              {
                icon: Share2,
                label: "Twitter",
                onClick: () => share("twitter"),
                color: "#1DA1F2",
              },
              {
                icon: Share2,
                label: "Facebook",
                onClick: () => share("facebook"),
                color: "#1877F2",
              },
              {
                icon: MessageCircle,
                label: "WhatsApp",
                onClick: () => share("whatsapp"),
                color: "#25D366",
              },
            ].map((item) => (
              <Pressable key={item.label} onPress={item.onClick} className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-white/5 transition-colors"><item.icon size={20} style={{  }} /><Text className="text-white/40 text-[9px]">{item.label}</Text></Pressable>
            ))}</View><View className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5"><TextInput readOnly value={url} className="flex-1 bg-transparent text-white/60 text-xs outline-none" /><Pressable onPress={copyLink} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{  }}>Copier
            </Pressable></View></View></View></View>
  );
}
