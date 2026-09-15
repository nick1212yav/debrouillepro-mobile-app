import { View, Pressable, Text, Image, Share } from "react-native";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import {
  ArrowLeft, Copy, Share2, Check, Users, Gift, Trophy,
  Clock, ChevronRight, Sparkles, Crown, Star, Zap, QrCode, X
} from "lucide-react-native";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Clipboard } from "@react-native-clipboard/clipboard";

type EarningStatus = "validé" | "en_attente" | "expiré";

interface Tier {
  threshold: number;
  label: string;
  reward: string;
  icon: React.ReactNode;
  color: string;
}

const TIERS: Tier[] = [
  { threshold: 1,  label: "Premier filleul",  reward: "500 FC",           icon: <Gift size={14} />,   color: "#8B5CF6" },
  { threshold: 3,  label: "3 filleuls actifs", reward: "1 500 FC bonus",   icon: <Star size={14} />,   color: "#F97316" },
  { threshold: 5,  label: "Badge Ambassadeur", reward: "Badge + 2 000 FC", icon: <Crown size={14} />,  color: "#F59E0B" },
  { threshold: 10, label: "10 filleuls",       reward: "1 mois Pro offert",icon: <Trophy size={14} />, color: "#EF4444" },
];

function QRModal({ code, onClose }: { code: string; onClose: () => void }) {
  const canvasRef = useRef<View>(null);
  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, `https://debrouille.pro/ref/${code}`, {
        width: 200, margin: 2, color: { dark: "#ffffff", light: "#00000000" },
      }).catch(() => null);
    }
  }, [code]);

  return (
    <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPress={onClose} className="absolute inset-0 z-50 flex items-center justify-center p-8" style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
      <View initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ type: "spring", damping: 22, stiffness: 280 }} onPress={(e) => e.stopPropagation()} className="w-full max-w-xs rounded-3xl p-6 flex flex-col items-center gap-5" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
        <View className="flex items-center justify-between w-full"><Text className="text-sm font-black text-white">Mon QR Parrainage</Text><Pressable onPress={onClose} className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}><X size={13} className="text-white/60" /></Pressable></View>
        <View className="p-4 rounded-2xl" style={{ backgroundColor: "rgba(139,92,246,0.15)", borderWidth: 1, borderColor: "rgba(139,92,246,0.25)", borderStyle: "solid" }}><canvas ref={canvasRef} className="rounded-xl" /></View>
        <View className="flex flex-col items-center gap-1"><Text className="text-lg font-black text-white tracking-widest">{code}</Text><Text className="text-[11px] text-white/35 text-center">Scannez ou partagez ce code pour parrainer vos proches</Text></View>
        <Pressable onPress={onClose} className="w-full py-3 rounded-2xl text-sm font-bold text-white" style={{  }}><Text>Fermer</Text></Pressable>
      </View>
    </View>
  );
}

interface ParrainagePageProps { onBack: () => void; }

export default function ParrainagePage({ onBack }: ParrainagePageProps) {
  return (
    <View className="absolute inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: "#07070f" }}><AuthLoading><View className="flex items-center gap-3 px-4 pt-4 pb-4" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }}><Pressable onPress={onBack} className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}><ArrowLeft size={16} className="text-white/70" /></Pressable><Skeleton className="h-8 w-40" /></View><View className="px-4 pt-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</View></AuthLoading><Unauthenticated><View className="flex items-center gap-3 px-4 pt-4 pb-4" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }}><Pressable onPress={onBack} className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}><ArrowLeft size={16} className="text-white/70" /></Pressable><Text className="text-white font-black">Parrainage</Text></View><View className="flex-1 flex flex-col items-center justify-center gap-4 px-6"><Users size={40} className="text-purple-400" /><Text className="text-white/60 text-sm text-center">Connectez-vous pour accéder à votre programme de parrainage</Text><SignInButton /></View></Unauthenticated><Authenticated><ParrainageInner onBack={onBack} /></Authenticated></View>
  );
}

function ParrainageInner({ onBack }: ParrainagePageProps) {
  const stats = useQuery(api.referrals.getMyReferralStats, {});
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [activeTab, setActiveTab] = useState<"filleuls" | "gains">("filleuls");

  const CODE = stats?.code ?? "Chargement...";
  const activeCount = stats?.activeCount ?? 0;
  const pendingCount = stats?.pendingCount ?? 0;
  const totalEarned = stats?.totalEarned ?? 0;
  const pendingEarned = stats?.pendingEarned ?? 0;

  const referrals = stats?.referrals ?? [];
  const nextTier = TIERS.find((t) => t.threshold > activeCount);
  const currentTierIdx = TIERS.findIndex((t) => t.threshold > activeCount) - 1;

  const handleCopy = () => {
    void Clipboard.setString(CODE);
    setCopied(true);
    toast.success("Code copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      void Share.share({ message: String(`Utilise mon code ${CODE} pour t'inscrire sur Débrouille Pro et on gagne tous les deux !`) + "\n" + "\n" + String(`https://debrouille.pro/ref/${CODE}`), title: "Rejoins Débrouille Pro" });
    } else {
      handleCopy();
    }
  };

  return (
    <>
      {/* Header */}
      <View className="flex-shrink-0 px-4 pt-4 pb-4" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }}><View className="flex items-center gap-3"><Pressable onPress={onBack} className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><ArrowLeft size={16} className="text-white/70" /></Pressable><View className="flex items-center gap-2 flex-1"><View className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(139,92,246,0.2)" }}><Users size={15} className="text-purple-400" /></View><View><Text className="text-base font-black text-white leading-none">Parrainage</Text><Text className="text-[10px] text-white/40">Invitez vos proches, gagnez ensemble</Text></View></View></View></View>

      <View className="flex-1 overflow-y-auto" style={{  }}>{}<View className="relative px-4 pt-5 pb-6 overflow-hidden" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(139,92,246,0.12)" }}><View className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none" style={{  }} /><View className="flex items-center gap-2 mb-4"><Sparkles size={13} className="text-purple-400" /><Text className="text-xs font-bold text-purple-300">Programme Ambassadeur</Text></View>{}<View className="gap-2 mb-5">{[
              { label: "Filleuls actifs",  value: activeCount,  color: "#22C55E",  suffix: "" },
              { label: "En attente",       value: pendingCount, color: "#F59E0B",  suffix: "" },
              { label: "Gains validés",    value: totalEarned,  color: "#8B5CF6",  suffix: " FC" },
            ].map(({ label, value, color, suffix }) => (
              <View key={label} className="rounded-2xl p-3 flex flex-col items-center gap-1" style={{ backgroundColor: "rgba(0,0,0,0.3)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}><Text className="text-lg font-black" style={{ color }}>{value}{suffix}</Text><Text className="text-[9px] text-white/35 text-center leading-tight">{label}</Text></View>
            ))}</View>{}<View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(0,0,0,0.35)", borderWidth: 1, borderColor: "rgba(139,92,246,0.25)", borderStyle: "solid" }}><Text className="text-[10px] text-white/40 mb-2 font-bold uppercase tracking-wider">Mon code de parrainage</Text><View className="flex items-center gap-3"><Text className="text-xl font-black text-white tracking-widest flex-1">{CODE}</Text><Pressable onPress={() => setShowQR(true)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(139,92,246,0.2)", borderWidth: 1, borderColor: "rgba(139,92,246,0.3)", borderStyle: "solid" }}><QrCode size={15} className="text-purple-400" /></Pressable><Pressable onPress={handleCopy} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all" style={{ backgroundColor: copied ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.07)", borderColor: "rgba(34,197,94,0.3)", borderStyle: "solid" }}>{copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} className="text-white/60" />}</Pressable></View></View><Pressable whileTap={{ scale: 0.97 }} onPress={handleShare} className="w-full mt-3 py-3.5 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2" style={{  }}><Share2 size={15} />Partager mon lien de parrainage
          </Pressable></View>{}<View className="px-4 py-5"><View className="flex items-center gap-2 mb-4"><Trophy size={13} className="text-amber-400" /><Text className="text-sm font-black text-white">Paliers de récompenses</Text></View><View className="flex flex-col gap-2">{TIERS.map((tier, idx) => {
              const unlocked = activeCount >= tier.threshold;
              const isCurrent = idx === currentTierIdx + 1 && !unlocked;
              return (
                <View key={tier.threshold} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.07 }} className="flex items-center gap-3 p-3 rounded-2xl" style={{ backgroundColor: unlocked ? `${tier.color}14` : isCurrent ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
                  <View className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: unlocked ? `${tier.color}22` : "rgba(255,255,255,0.06)" }}>{tier.icon}</View>
                  <View className="flex-1 min-w-0"><Text className="text-sm font-bold truncate" style={{ color: unlocked ? "white" : "rgba(255,255,255,0.5)" }}>{tier.label}</Text><Text className="text-[11px]" style={{ color: unlocked ? tier.color : "rgba(255,255,255,0.25)" }}>{tier.reward}</Text></View>
                  <View className="flex items-center gap-2">{isCurrent && (
                      <Text className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>{tier.threshold - activeCount}restant{tier.threshold - activeCount > 1 ? "s" : ""}</Text>
                    )}{unlocked ? (
                      <View className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${tier.color}22` }}><Check size={11} style={{  }} /></View>
                    ) : (
                      <ChevronRight size={14} className="text-white/20" />
                    )}</View>
                </View>
              );
            })}</View>{nextTier && (
            <View className="mt-4 p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}><View className="flex items-center justify-between mb-2"><View className="flex items-center gap-1.5"><Zap size={11} className="text-amber-400" /><Text className="text-xs font-bold text-white/70">Prochain palier</Text></View><Text className="text-xs font-black" style={{ color: nextTier.color }}>{activeCount}/{nextTier.threshold}filleuls</Text></View><View className="h-1.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><View initial={{ width: 0 }} animate={{ width: `${Math.min(100, (activeCount / nextTier.threshold) * 100)}%` }} transition={{ duration: 1, ease: "easeOut" }} className="h-full rounded-full" style={{  }} /></View><Text className="text-[10px] text-white/30">Encore <Text className="font-black text-white/60">{nextTier.threshold - activeCount}</Text>filleul(s) pour débloquer : <Text style={{ color: nextTier.color }}>{nextTier.reward}</Text></Text></View>
          )}{pendingEarned > 0 && (
            <View className="mt-3 flex items-center gap-2 p-3 rounded-2xl" style={{ backgroundColor: "rgba(245,158,11,0.1)", borderWidth: 1, borderColor: "rgba(245,158,11,0.2)", borderStyle: "solid" }}><Clock size={13} className="text-amber-400 flex-shrink-0" /><Text className="text-xs text-amber-300"><Text className="font-black">{pendingEarned}FC</Text>en cours de validation</Text></View>
          )}</View>{}<View className="px-4 pb-8"><View className="flex gap-2 mb-4 p-1 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>{(["filleuls", "gains"] as const).map((tab) => (
              <Pressable key={tab} onPress={() => setActiveTab(tab)} className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all capitalize" style={{ backgroundColor: activeTab === tab ? "rgba(139,92,246,0.25)" : "transparent", borderColor: "rgba(139,92,246,0.3)", borderStyle: "solid" }}>{tab === "filleuls" ? `Filleuls (${referrals.length})` : `Gains (${referrals.length})`}</Pressable>
            ))}</View><View>{activeTab === "filleuls" ? (
              <View key="filleuls" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                {referrals.length === 0 ? (
                  <View className="flex flex-col items-center py-8 gap-2"><Users size={32} className="text-white/20" /><Text className="text-white/40 text-sm">Aucun filleul pour l'instant</Text><Text className="text-white/25 text-xs text-center">Partagez votre code pour inviter des proches</Text></View>
                ) : (
                  referrals.map((r) => {
                    const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
                      pending:   { bg: "rgba(245,158,11,0.15)", color: "#F59E0B", label: "En attente" },
                      validated: { bg: "rgba(34,197,94,0.15)",  color: "#22C55E", label: "Validé" },
                      rewarded:  { bg: "rgba(34,197,94,0.15)",  color: "#22C55E", label: "Actif" },
                    };
                    const s = statusStyles[r.status] ?? statusStyles["pending"];
                    return (
                      <View key={r._id} className="flex items-center gap-3 py-3" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" }}><Image className="w-9 h-9 rounded-full flex-shrink-0" source={{ uri: `https://api.dicebear.com/7.x/thumbs/svg?seed=${r.referredId}` }} accessibilityLabel="avatar" /><View className="flex-1 min-w-0"><Text className="text-sm font-bold text-white truncate">Filleul #{r._id.slice(-4)}</Text><Text className="text-[10px] text-white/35">{r.status === "rewarded" ? "Actif" : "En attente de validation"}</Text></View><Text className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</Text></View>
                    );
                  })
                )}
              </View>
            ) : (
              <View key="gains" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <View className="flex items-center justify-between py-2 mb-2"><Text className="text-xs text-white/40">Total cumulé</Text><Text className="text-base font-black text-green-400">{(totalEarned + pendingEarned).toLocaleString()}FC</Text></View>
                {referrals.map((r) => {
                  const validated = r.status === "rewarded";
                  return (
                    <View key={r._id} className="flex items-center gap-3 py-3" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" }}><View className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: validated ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)" }}>{validated ? <Check size={14} className="text-green-400" /> : <Clock size={14} className="text-amber-400" />}</View><View className="flex-1 min-w-0"><Text className="text-sm text-white truncate">Parrainage #{r._id.slice(-4)}</Text><Text className="text-[10px] text-white/30">{validated ? "Validé" : "En cours de validation"}</Text></View><View className="text-right"><Text className="text-sm font-black" style={{ color: validated ? "#22C55E" : "#F59E0B" }}>+{r.rewardAmount ?? 500}FC</Text><Text className="text-[9px]" style={{ color: validated ? "#22C55E" : "#F59E0B" }}>{validated ? "Validé" : "En attente"}</Text></View></View>
                  );
                })}
                {referrals.length === 0 && (
                  <View className="flex flex-col items-center py-8 gap-2">
                    <Gift size={32} className="text-white/20" />
                    <Text className="text-white/40 text-sm">Aucun gain pour l'instant</Text>
                  </View>
                )}
              </View>
            )}</View></View></View>

<View>
        {showQR && <QRModal code={CODE} onClose={() => setShowQR(false)} />}
      </View>
    </>
  );
}
