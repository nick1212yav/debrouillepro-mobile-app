import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput, Linking } from "react-native";

// src/features/voyages/sheets/VoyageShareSheet.tsx
import {
  X,
  Link2,
  Check,
  Copy,
  Share2,
  Mail,
  MessageCircle,
  QrCode,
  Send, // ✅ Utilisé pour Twitter (envoi) [1]
  Globe, // ✅ Utilisé pour LinkedIn (réseau public) [1]
} from "lucide-react-native"; // ✅ Correction : 'Twitter', 'Facebook', 'Linkedin' retirés [1]
import { useState } from "react";
import { useVoyageShare } from "../hooks/useVoyageShare";

interface VoyageShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  trip: {
    id: string;
    from: string;
    to: string;
    operator: string;
    price: number;
    currency: string;
  };
  url: string;
}

export function VoyageShareSheet({
  isOpen,
  onClose,
  trip,
  url,
}: VoyageShareSheetProps) {
  const [copied, setCopied] = useState(false);
  const { share } = useVoyageShare();

  const shareOptions = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      color: "#25D366",
      action: () => shareViaWhatsApp(),
    },
    {
      id: "twitter",
      label: "Twitter / X",
      icon: Send, // ✅ Icône universelle résiliente [1]
      color: "#1DA1F2",
      action: () => shareViaTwitter(),
    },
    {
      id: "facebook",
      label: "Facebook",
      icon: Share2, // ✅ Icône universelle résiliente [1]
      color: "#1877F2",
      action: () => shareViaFacebook(),
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      icon: Globe, // ✅ Icône universelle résiliente [1]
      color: "#0A66C2",
      action: () => shareViaLinkedin(),
    },
    {
      id: "email",
      label: "Email",
      icon: Mail,
      color: "#EA4335",
      action: () => shareViaEmail(),
    },
    {
      id: "qr",
      label: "QR Code",
      icon: QrCode,
      color: "#6366F1",
      action: () => UIService.openToast("QR Code généré (fonctionnalité à venir)", "info"),
    },
  ];

  const shareViaWhatsApp = () => {
    const text = `🚌 Voyage ${trip.from} → ${trip.to} avec ${trip.operator} • ${trip.price} ${trip.currency}`;
    Linking.openURL(String(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`));
  };

  const shareViaTwitter = () => {
    const text = `Voyage ${trip.from} → ${trip.to} avec ${trip.operator}`;
    Linking.openURL(String(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`));
  };

  const shareViaFacebook = () => {
    Linking.openURL(String(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`));
  };

  const shareViaLinkedin = () => {
    Linking.openURL(String(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`));
  };

  const shareViaEmail = () => {
    const subject = `Voyage ${trip.from} → ${trip.to}`;
    const body = `Je vous recommande ce voyage : ${url}\n\n${trip.operator} • ${trip.price} ${trip.currency}`;
    undefined.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleCopyLink = async () => {
    try {
      await undefined.writeText(url);
      setCopied(true);
      UIService.openToast("Lien copié dans le presse-papier", "success");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      UIService.openToast("Impossible de copier le lien", "error");
    }
  };

  const handleNativeShare = async () => {
    try {
      await share({
        title: `Voyage ${trip.from} → ${trip.to}`,
        text: `${trip.operator} • ${trip.price} ${trip.currency}`,
        url,
      });
    } catch {
      UIService.openToast("Impossible de partager", "error");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Pressable
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/70"
        onPress={onClose}
      >
        <Pressable
          className="w-full max-w-md rounded-t-[32px] overflow-hidden flex flex-col"
          style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", maxHeight: "calc(90vh - 40px)" }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <View className="w-10 h-1 rounded-full bg-white/20" />
          </View>

          <View className="flex items-center justify-between px-5 py-3 border-b border-white/5 flex-shrink-0">
            <Text className="text-white font-bold text-lg">Partager ce voyage</Text>
            <Pressable
              onPress={onClose}
              className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            >
              <X size={18} className="text-white/60" />
            </Pressable>
          </View>

          <View
            className="flex-1 overflow-y-auto px-5 py-4"
            style={{  }}
          >
            {/* Informations du voyage */}
            <View className="mb-4 p-4 rounded-2xl bg-white/5 border border-white/10">
              <Text className="text-white font-semibold text-sm">
                {trip.from} → {trip.to}
              </Text>
              <Text className="text-white/40 text-xs">{trip.operator}</Text>
              <Text className="text-indigo-400 font-bold text-sm mt-1">
                {trip.price.toLocaleString()} {trip.currency}
              </Text>
            </View>

            {/* Lien */}
            <View className="flex items-center gap-2 mb-6">
              <TextInput
               
                value={url}
                readOnly
                className="flex-1 rounded-xl px-3 py-2 text-xs bg-white/5 border border-white/10 text-white/60 outline-none"
              />
              <Pressable
                onPress={handleCopyLink}
                className="p-2 rounded-xl bg-white/10 text-white/70"
              >
                {copied ? (
                  <Check size={16} className="text-emerald-400" />
                ) : (
                  <Copy size={16} />
                )}
              </Pressable>
            </View>

            {/* Grille de partage */}
            <View className="gap-3">
              {shareOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Pressable
                    key={option.id}
                    onPress={option.action}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10"
                  >
                    <View
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${option.color}20` }}
                    >
                      <Icon size={20} />
                    </View>
                    <Text className="text-white/60 text-[10px]">
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Bouton partage natif */}
            {/* ✅ Correction : contrôle de type non-undefined explicite pour satisfaire TS2774 [1] */}
            {typeof undefined !== "undefined" && (
              <Pressable
                onPress={handleNativeShare}
                className="w-full mt-4 py-3 rounded-2xl flex items-center justify-center gap-2 bg-white/10 text-white font-semibold text-sm"
              >
                <Share2 size={16} />
                <Text>Partager via l'application</Text></Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </>
  );
}
