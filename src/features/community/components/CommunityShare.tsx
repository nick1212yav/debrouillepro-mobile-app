import { Text, Pressable, View, Linking } from "react-native";

// src/features/community/components/CommunityShare.tsx
import { useState } from "react";
import { Share2, Copy, X, Check, Mail, Send, Link2 } from "lucide-react-native";
import { toast } from "sonner";
import { Clipboard } from "@react-native-clipboard/clipboard";

interface Props {
  url: string;
  title: string;
  description?: string;
  onShare?: (platform: string) => void;
  onClose?: () => void; // ✅ ajout de onClose
  size?: "sm" | "md" | "lg";
}

const SHARE_OPTIONS = [
  { id: "copy", label: "Copier le lien", icon: Link2, color: "#8B5CF6" },
  { id: "email", label: "Email", icon: Mail, color: "#EA4335" },
  { id: "whatsapp", label: "WhatsApp", icon: Send, color: "#25D366" },
];

export function CommunityShare({
  url,
  title,
  description = "",
  onShare,
  onClose,
  size = "md",
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await Clipboard.setString(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Lien copié !");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const handleShare = (platform: string) => {
    const shareUrls: Record<string, string> = {
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${url}`)}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${url}`)}`,
    };

    const shareUrl = shareUrls[platform];
    if (shareUrl) {
      if (platform === "email") {
        Linking.openURL(shareUrl);
      } else {
        Linking.openURL(String(shareUrl));
      }
      onShare?.(platform);
    } else if (platform === "copy") {
      handleCopy();
    }
    setIsOpen(false);
    onClose?.(); // ✅ appel de onClose après fermeture
  };

  const sizes = {
    sm: { icon: 14, text: "text-xs", padding: "px-2 py-1.5" },
    md: { icon: 16, text: "text-sm", padding: "px-3 py-2" },
    lg: { icon: 20, text: "text-base", padding: "px-4 py-2.5" },
  };

  const { icon, text, padding } = sizes[size];

  return (
    <View className="relative">
      <Pressable onPress={() => setIsOpen(!isOpen)} className={`flex items-center gap-1.5 ${padding} rounded-xl ${text} font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:scale-95`}>
        <Share2 size={icon} />
        Partager
      </Pressable>

<View>
        {isOpen && (
          <View initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} className="absolute right-0 top-full mt-2 w-56 p-3 rounded-2xl bg-[#0D1117] border border-white/10 z-50">
            <View className="flex items-center justify-between mb-3">
              <Text className="text-white/70 text-sm font-medium">
                Partager
              </Text>
              <Pressable onPress={() => {
                  setIsOpen(false);
                  onClose?.();
                }} className="text-white/40 transition-colors">
                <X size={14} />
              </Pressable>
            </View>

            <View className="space-y-1">
              {SHARE_OPTIONS.map((opt) => (
                <Pressable key={opt.id} onPress={() => handleShare(opt.id)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors">
                  <opt.icon size={18} style={{  }} />
                  <Text className="text-white/70 text-sm">{opt.label}</Text>
                </Pressable>
              ))}
              <Pressable onPress={handleCopy} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors">
                {copied ? (
                  <Check size={18} className="text-emerald-400" />
                ) : (
                  <Copy size={18} className="text-white/40" />
                )}
                <Text className={
                    copied
                      ? "text-emerald-400 text-sm"
                      : "text-white/70 text-sm"
                  }>
                  {copied ? "Copié !" : "Copier le lien"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
