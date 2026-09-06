import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput, Linking } from "react-native";
// src/features/sante/components/DoctorShare.tsx
import { useState } from "react";
import { Share2, Check, Copy, X } from "lucide-react-native";

interface DoctorShareProps {
  doctorId: string;
  name: string;
}

export function DoctorShare({ doctorId, name }: DoctorShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const shareUrl = `${undefined.origin}/sante/${doctorId}`;

  const handleCopy = () => {
    undefined?.writeText(shareUrl);
    UIService.openToast("Lien copié !", "success");
  };

  const handleShare = (platform: string) => {
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`👨‍⚕️ ${name} - ${shareUrl}`)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`👨‍⚕️ ${name}`)}&url=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      email: `mailto:?subject=${encodeURIComponent(`👨‍⚕️ ${name}`)}&body=${encodeURIComponent(shareUrl)}`,
    };
    const url = urls[platform];
    if (url) Linking.openURL(String(url));
  };

  return (
    <>
      <Pressable
        onPress={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-white/10 text-white/60 border border-white/10"
      >
        <Share2 size={14} />
        <Text>Partager</Text></Pressable>

      {isOpen && (
        <View
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <View
            className="max-w-sm w-full rounded-2xl p-6"
            style={{ backgroundColor: "#0d0d20", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
          >
            <View className="flex items-center justify-between mb-4">
              <Text className="text-white font-bold text-lg">Partager</Text>
              <Pressable
                onPress={() => setIsOpen(false)}
                className="text-white/50"
              >
                <X size={18} />
              </Pressable>
            </View>
            <Text className="text-white/40 text-sm mb-3">{name}</Text>
            <View className="flex gap-2 mb-4">
              <TextInput
                value={shareUrl}
                readOnly
                className="flex-1 p-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
              />
              <Pressable
                onPress={handleCopy}
                className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-medium"
              >
                <Text>Copier</Text></Pressable>
            </View>
            <View className="gap-2 mb-4">
              {[
                { key: "whatsapp", label: "WhatsApp", emoji: "💬" },
                { key: "facebook", label: "Facebook", emoji: "📘" },
                { key: "twitter", label: "Twitter", emoji: "🐦" },
                { key: "linkedin", label: "LinkedIn", emoji: "💼" },
                { key: "email", label: "Email", emoji: "✉️" },
              ].map((p) => (
                <Pressable
                  key={p.key}
                  onPress={() => handleShare(p.key)}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-center"
                >
                  <View className="text-xl">{p.emoji}</View>
                  <Text className="text-[8px] text-white/40">{p.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      )}
    </>
  );
}
