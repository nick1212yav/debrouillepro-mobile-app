import { View, Text, Pressable, TextInput, Linking } from "react-native";

// src/features/community/sheets/ShareSheet.tsx
import { X, Link2, Check, Mail, Send } from "lucide-react-native";
import { toast } from "sonner";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { Clipboard } from "@react-native-clipboard/clipboard";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  postId: Id<"publications">;
  title?: string;
  description?: string;
  url?: string;
}

export function ShareSheet({
  isOpen,
  onClose,
  postId,
  title,
  description,
  url,
}: Props) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || `${window.location.origin}/community/${postId}`;
  const shareText = title || "Découvrez ce post sur DébrouillePro";

  const handleShare = (platform: "email" | "whatsapp") => {
    let shareLink = "";
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);

    switch (platform) {
      case "email":
        shareLink = `mailto:?subject=${encodedText}&body=${encodedText}%20${encodedUrl}`;
        break;
      case "whatsapp":
        shareLink = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
        break;
    }

    if (shareLink) {
      if (platform === "email") {
        Linking.openURL(shareLink);
      } else {
        Linking.openURL(String(shareLink));
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await Clipboard.setString(shareUrl);
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erreur lors de la copie");
    }
  };

  if (!isOpen) return null;

  return (
<View>
      <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onPress={(e) => e.target === e.currentTarget && onClose()}>
        <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="w-full max-w-lg rounded-t-3xl overflow-hidden" style={{ backgroundColor: "rgba(15,15,30,0.98)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
          <View className="flex items-center justify-between px-5 py-4 border-b border-white/10"><Text className="text-white font-bold text-lg">Partager</Text><Pressable onPress={onClose} className="p-1 rounded-full"><X size={20} className="text-white/50" /></Pressable></View>

          <View className="px-5 py-6 space-y-4"><View className="gap-3"><Pressable onPress={() => handleShare("whatsapp")} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 transition-colors"><Send size={28} className="text-green-500" /><Text className="text-white/60 text-xs">WhatsApp</Text></Pressable><Pressable onPress={() => handleShare("email")} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 transition-colors"><Mail size={28} className="text-red-500" /><Text className="text-white/60 text-xs">Email</Text></Pressable><Pressable onPress={handleCopyLink} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 transition-colors">{copied ? (
                  <Check size={28} className="text-green-400" />
                ) : (
                  <Link2 size={28} className="text-purple-400" />
                )}<Text className="text-white/60 text-xs">Copier</Text></Pressable></View><View className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"><TextInput value={shareUrl} readOnly className="flex-1 bg-transparent text-white/80 text-sm outline-none" /><Pressable onPress={handleCopyLink} className="p-2 rounded-xl bg-purple-500/20 transition-colors">{copied ? (
                  <Check size={18} className="text-green-400" />
                ) : (
                  <Link2 size={18} className="text-purple-400" />
                )}</Pressable></View></View>
        </View>
      </View>
    </View>
  );
}
