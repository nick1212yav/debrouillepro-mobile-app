import { View, Pressable, Text, Share } from "react-native";

// src/features/profile/components/QRCardModal.tsx

import { useState, useEffect, useRef } from "react";
import { X, CheckCircle2, Check, Copy, Share2 } from "lucide-react-native";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Clipboard } from "@react-native-clipboard/clipboard";

const BADGES = [
  { icon: "✅", label: "Identité vérifiée", color: "#10B981" },
  { icon: "⚡", label: "Réponse rapide", color: "#F97316" },
  { icon: "🏆", label: "Top Vendeur", color: "#F59E0B" },
  { icon: "🛡️", label: "Compte sécurisé", color: "#3B82F6" },
];

const MODULE_STATS = [
  { label: "Annonces", value: "12", color: "#F97316" },
  { label: "Followers", value: "1.4K", color: "#8B5CF6" },
  { label: "Avis", value: "4.9★", color: "#F59E0B" },
];

interface QRCardModalProps {
  onClose: () => void;
  accentHex: string;
  displayName: string;
  slug: string;
}

export function QRCardModal({
  onClose,
  accentHex,
  displayName,
  slug,
}: QRCardModalProps) {
  const canvasRef = useRef<View>(null);
  const [copied, setCopied] = useState(false);
  const profileUrl = `https://debrouille.app/profil/${slug}`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, profileUrl, {
        width: 160,
        margin: 1,
        color: { dark: "#ffffff", light: "#00000000" },
      }).catch(() => {
        /* ignore */
      });
    }
  }, [profileUrl]);

  const handleCopy = () => {
    void Clipboard.setString(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Lien copié !");
  };

  const handleShare = () => {
    if (navigator.share) {
      void Share.share({ message: String(profileUrl), title: `${displayName} – Débrouille Pro` });
    } else {
      handleCopy();
    }
  };

  return (
    <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ backgroundColor: "rgba(0,0,0,0.85)" }} onPress={(e) => e.target === e.currentTarget && onClose()}>
      <View initial={{ scale: 0.85, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ type: "spring", damping: 22, stiffness: 280 }} className="w-full max-w-sm rounded-3xl overflow-hidden" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
        <View className="relative px-6 pt-6 pb-4" style={{  }}><Pressable onPress={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}><X size={15} className="text-white" /></Pressable><View className="flex items-center gap-4 mb-4"><View><View className="flex items-center gap-1.5 mb-0.5"><Text className="text-white font-black text-lg">{displayName}</Text><CheckCircle2 size={15} className="text-blue-400" /></View><View className="text-white/50 text-xs mb-1"><Text>Pro Vérifié</Text></View><View className="flex gap-1.5">{BADGES.slice(0, 2).map((b) => (
                  <Text key={b.label} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${b.color}20`, color: b.color }}>{b.icon}</Text>
                ))}</View></View></View><View className="flex gap-3 mb-2">{MODULE_STATS.map((s) => (
              <View key={s.label} className="flex-1 text-center rounded-xl py-2" style={{ backgroundColor: `${s.color}15`, borderStyle: "solid" }}><View className="font-black text-sm text-white">{s.value}</View><View className="text-[10px] text-white/40">{s.label}</View></View>
            ))}</View></View>

        <View className="px-6 py-4 flex flex-col items-center"><View className="rounded-2xl p-4 mb-3" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><canvas ref={canvasRef} className="rounded-xl" /></View><Text className="text-white/40 text-xs text-center mb-1">Scannez pour voir mon profil
          </Text><Text className="text-white/25 text-[10px] text-center font-mono truncate max-w-full px-2">{profileUrl}</Text></View>

        <View className="px-6 pb-6 flex gap-3">
          <Pressable onPress={handleCopy} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold active:scale-95 transition-transform" style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "Copié !" : "Copier le lien"}
          </Pressable>
          <Pressable onPress={handleShare} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold active:scale-95 transition-transform" style={{  }}>
            <Share2 size={15} /> Partager
          </Pressable>
        </View>
      </View>
    </View>
  );
}
