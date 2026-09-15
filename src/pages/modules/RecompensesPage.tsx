import { View, Text, Pressable } from "react-native";
import { useState } from "react";
import {
  ArrowLeft, Zap, Lock, Sparkles, Crown,
  TrendingUp, Check,
} from "lucide-react-native";
import { toast } from "sonner";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { getLevel, getLevelProgress, LEVEL_ORDER } from "@/hooks/use-points.ts";
import type { Level } from "@/hooks/use-points.ts";

// ─── Constants ────────────────────────────────────────────────────────────────
const LEVEL_COLORS: Record<Level, { from: string; to: string; glow: string; text: string }> = {
  Bronze:  { from: "#CD7F32", to: "#A0522D", glow: "rgba(205,127,50,0.4)",  text: "#CD7F32" },
  Argent:  { from: "#C0C0C0", to: "#A8A8A8", glow: "rgba(192,192,192,0.4)", text: "#C0C0C0" },
  Or:      { from: "#FFD700", to: "#FFA500", glow: "rgba(255,215,0,0.5)",   text: "#FFD700" },
  Diamant: { from: "#B9F2FF", to: "#7DD3FC", glow: "rgba(185,242,255,0.5)", text: "#7DD3FC" },
};

const LEVEL_ICONS: Record<Level, string> = {
  Bronze: "🥉", Argent: "🥈", Or: "🥇", Diamant: "💎",
};

const LEVEL_THRESHOLDS: Record<Level, number> = {
  Bronze: 0, Argent: 500, Or: 1500, Diamant: 4000,
};

// ─── Map sourceType to display info ──────────────────────────────────────────
const SOURCE_TYPE_META: Record<string, { emoji: string; module: string }> = {
  publication: { emoji: "📝", module: "Publications" },
  like: { emoji: "❤️", module: "Social" },
  comment: { emoji: "💬", module: "Commentaires" },
  follow: { emoji: "👥", module: "Social" },
  module_visit: { emoji: "🏠", module: "Navigation" },
  badge: { emoji: "🏅", module: "Badges" },
  onboarding: { emoji: "🎉", module: "Profil" },
  daily_streak: { emoji: "🔥", module: "Streak" },
};

// ─── Rewards catalogue ────────────────────────────────────────────────────────
interface Reward {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  cost: number;
  minLevel: Level;
  category: string;
  value: string;
}

const REWARDS: Reward[] = [
  { id: "r1", title: "Livraison offerte", desc: "1 livraison gratuite dans le module Livraison", emoji: "📦", cost: 100, minLevel: "Bronze", category: "Service", value: "-100%" },
  { id: "r2", title: "Réduction Transport", desc: "20% de réduction sur votre prochain trajet", emoji: "🚗", cost: 150, minLevel: "Bronze", category: "Réduction", value: "-20%" },
  { id: "r3", title: "Cashback Paiement", desc: "500 FCFA remboursés sur votre prochain paiement", emoji: "💳", cost: 200, minLevel: "Bronze", category: "Cashback", value: "500 FCFA" },
  { id: "r4", title: "Cours gratuit", desc: "Accès à un cours premium dans Apprendre", emoji: "📚", cost: 300, minLevel: "Argent", category: "Service", value: "Gratuit" },
  { id: "r5", title: "Badge Argent Pro", desc: "Badge exclusif affiché sur votre profil", emoji: "🥈", cost: 500, minLevel: "Argent", category: "Badge", value: "Exclusif" },
  { id: "r6", title: "Consultation santé offerte", desc: "1 téléconsultation médicale gratuite", emoji: "❤️", cost: 600, minLevel: "Argent", category: "Service", value: "Gratuit" },
  { id: "r7", title: "Réduction Immobilier -30%", desc: "30% off sur les frais d'agence partenaires", emoji: "🏠", cost: 800, minLevel: "Or", category: "Réduction", value: "-30%" },
  { id: "r8", title: "Badge Or Élite", desc: "Badge Or exclusif + accès prioritaire au support", emoji: "🥇", cost: 1000, minLevel: "Or", category: "Badge", value: "VIP" },
  { id: "r9", title: "Cashback 5000 FCFA", desc: "Remboursement sur tout achat en Boutique", emoji: "🏪", cost: 1200, minLevel: "Or", category: "Cashback", value: "5000 FCFA" },
  { id: "r10", title: "Abonnement Pro 1 mois", desc: "Accès à toutes les fonctionnalités premium", emoji: "👑", cost: 2000, minLevel: "Diamant", category: "Premium", value: "1 mois" },
  { id: "r11", title: "Badge Diamant", desc: "Statut Diamant visible de toute la communauté", emoji: "💎", cost: 3000, minLevel: "Diamant", category: "Badge", value: "Ultime" },
  { id: "r12", title: "Vol offert Kin → Dakar", desc: "Partenariat exclusif avec nos partenaires voyage", emoji: "✈️", cost: 4000, minLevel: "Diamant", category: "Voyage", value: "Offert" },
];

// ─── How to earn points ───────────────────────────────────────────────────────
const EARN_WAYS = [
  { emoji: "🔑", label: "Connexion quotidienne", pts: "+5 pts" },
  { emoji: "🏠", label: "Visiter un module", pts: "+10 pts" },
  { emoji: "💳", label: "Effectuer un paiement", pts: "+50 pts" },
  { emoji: "📦", label: "Commander une livraison", pts: "+30 pts" },
  { emoji: "💼", label: "Postuler à un emploi", pts: "+25 pts" },
  { emoji: "🤝", label: "Parrainer un ami", pts: "+150 pts" },
  { emoji: "⭐", label: "Laisser un avis", pts: "+20 pts" },
  { emoji: "🎓", label: "Terminer un cours", pts: "+100 pts" },
];

// ─── Types for Convex data ───────────────────────────────────────────────────
interface XpHistoryEntry {
  id: string;
  amount: number;
  reason: string;
  sourceType: string;
  createdAt: string;
}

// ─── Level card ───────────────────────────────────────────────────────────────
function LevelCard({ total }: { total: number }) {
  const { level, nextLevel, progress, pointsToNext } = getLevelProgress(total);
  const colors = LEVEL_COLORS[level];

  return (
    <View className="mx-5 mb-4 rounded-3xl overflow-hidden p-5 relative" style={{ borderStyle: "solid" }}>{}<View className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{  }} /><View className="flex items-center justify-between mb-4 relative"><View><View className="flex items-center gap-2 mb-1"><Text className="text-3xl">{LEVEL_ICONS[level]}</Text><View><View className="text-white font-black text-lg leading-tight"><Text>Niveau</Text>{level}</View><View className="text-white/50 text-xs"><Text>Membre Pro Débrouille</Text></View></View></View></View><View className="text-right"><View className="font-black text-3xl leading-tight" style={{  }}>{total.toLocaleString()}</View><View className="text-white/50 text-xs"><Text>points XP</Text></View></View></View>{}{nextLevel && (
        <View><View className="flex items-center justify-between mb-1.5"><Text className="text-xs text-white/50">Progression vers {LEVEL_ICONS[nextLevel]}{nextLevel}</Text><Text className="text-xs font-bold" style={{ color: colors.text }}>{progress}%</Text></View><View className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}><View initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }} className="h-full rounded-full" style={{  }} /></View><View className="text-right mt-1"><Text className="text-[10px] text-white/40">{pointsToNext}pts restants</Text></View></View>
      )}{!nextLevel && (
        <View className="flex items-center gap-2 mt-2"><Crown size={14} style={{  }} /><Text className="text-xs font-bold" style={{ color: colors.text }}>Niveau maximum atteint — Félicitations !</Text></View>
      )}</View>
  );
}

// ─── Level roadmap ────────────────────────────────────────────────────────────
function LevelRoadmap({ total }: { total: number }) {
  const currentLevel = getLevel(total);

  return (
    <View className="mx-5 mb-4 rounded-3xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex items-center gap-2 mb-3"><TrendingUp size={14} className="text-white/60" /><Text className="text-white/70 text-xs font-semibold uppercase tracking-wider">Paliers de niveau</Text></View><View className="flex items-center justify-between">{LEVEL_ORDER.map((lvl: Level, i: number) => {
          const isReached = LEVEL_ORDER.indexOf(currentLevel) >= i;
          const isCurrent = currentLevel === lvl;
          const c = LEVEL_COLORS[lvl];
          return (
            <View key={lvl} className="flex flex-col items-center gap-1 flex-1"><View className="relative w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-all" style={{ backgroundColor: isReached ? `${c.from}33` : "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid", boxShadow: isCurrent ? `0 0 16px ${c.glow}` : "none" }}>{LEVEL_ICONS[lvl]}{isReached && !isCurrent && (
                  <View className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: c.from }}><Check size={9} className="text-black" /></View>
                )}</View><Text className="text-[10px] font-semibold" style={{ color: isReached ? c.text : "rgba(255,255,255,0.3)" }}>{lvl}</Text><Text className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{LEVEL_THRESHOLDS[lvl].toLocaleString()}</Text>{i < LEVEL_ORDER.length - 1 && (
                <View className="absolute" style={{ display: "none" }} />
              )}</View>
          );
        })}</View></View>
  );
}

// ─── Reward card ──────────────────────────────────────────────────────────────
function RewardCard({ reward, total, isClaimed, onClaim }: { reward: Reward; total: number; isClaimed: boolean; onClaim: () => void }) {
  const currentLevel = getLevel(total);
  const levelIdx = LEVEL_ORDER.indexOf(currentLevel);
  const reqIdx = LEVEL_ORDER.indexOf(reward.minLevel);
  const isLocked = levelIdx < reqIdx || total < reward.cost;
  const c = LEVEL_COLORS[reward.minLevel];

  return (
    <View initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-3.5 relative overflow-hidden" style={{ backgroundColor: isClaimed ? "rgba(16,185,129,0.08)" : isLocked ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)", borderColor: "rgba(16,185,129,0.3)", borderStyle: "solid", opacity: isLocked && !isClaimed ? 0.7 : 1 }}>
      <View className="flex items-center gap-3"><View className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: isClaimed ? "rgba(16,185,129,0.15)" : `${c.from}18` }}>{isClaimed ? "✅" : reward.emoji}</View><View className="flex-1 min-w-0"><View className="flex items-center gap-1.5 mb-0.5"><Text className="text-white font-semibold text-sm truncate">{reward.title}</Text>{isLocked && !isClaimed && <Lock size={11} className="text-white/30 flex-shrink-0" />}</View><Text className="text-white/40 text-xs leading-tight truncate">{reward.desc}</Text><View className="flex items-center gap-2 mt-1.5"><Text className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${c.from}22`, color: c.text, borderStyle: "solid" }}>{LEVEL_ICONS[reward.minLevel]}{reward.minLevel}</Text><Text className="text-xs font-black" style={{ color: isClaimed ? "#10B981" : "#A78BFA" }}>{isClaimed ? "Obtenu" : `${reward.cost} pts`}</Text></View></View><View className="flex flex-col items-end gap-1.5 flex-shrink-0"><Text className="text-xs font-black px-2 py-1 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}>{reward.value}</Text>{!isClaimed && (
            <Pressable onPress={onClaim} disabled={isLocked} className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-30" style={{  }}>{total < reward.cost ? `${reward.cost - total} pts` : "Obtenir"}</Pressable>
          )}</View></View>
    </View>
  );
}

// ─── Inner content (authenticated) ──────────────────────────────────────────
function RecompensesContent({ onBack }: { onBack: () => void }) {
  const rewardsData = useQuery(api.utility.getUserRewardsData, {});
  const [tab, setTab] = useState<Tab>("rewards");
  const [filterLevel, setFilterLevel] = useState<Level | "Tous">("Tous");
  const [claimedRewards, setClaimedRewards] = useState<string[]>([]);

  // Use real Convex XP data, fallback to 0 while loading
  const total = rewardsData?.totalXp ?? 0;
  const xpHistory: XpHistoryEntry[] = rewardsData?.xpHistory ?? [];

  const handleClaim = (reward: Reward) => {
    if (claimedRewards.includes(reward.id)) {
      toast.info("Récompense déjà obtenue");
      return;
    }
    if (total < reward.cost) {
      toast.error(`Il vous manque ${reward.cost - total} points`);
      return;
    }
    // Toast-only redemption for now
    setClaimedRewards((prev) => [...prev, reward.id]);
    toast.success(`🎉 ${reward.title} débloqué !`);
  };

  const filteredRewards = REWARDS.filter(r => filterLevel === "Tous" || r.minLevel === filterLevel);

  // Loading skeleton
  if (rewardsData === undefined) {
    return (
      <View className="flex flex-col h-full overflow-hidden" style={{  }}><View className="flex-shrink-0 px-5 pt-12 pb-4"><View className="flex items-center gap-3 mb-5"><Pressable onPress={onBack} className="w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={20} className="text-white" /></Pressable><View className="flex-1"><Text className="text-white font-black text-xl">Récompenses 🏆</Text><Text className="text-white/40 text-xs">Chargement...</Text></View></View><Skeleton className="h-40 w-full rounded-3xl mb-4" /><Skeleton className="h-20 w-full rounded-3xl mb-4" /><Skeleton className="h-10 w-full rounded-2xl" /></View><View className="flex-1 px-5 pb-8 space-y-3">{Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}</View></View>
    );
  }

  // Convert xpHistory to display format
  const historyEvents = xpHistory.map((entry) => {
    const meta = SOURCE_TYPE_META[entry.sourceType] ?? { emoji: "⚡", module: "Autre" };
    return {
      id: entry.id,
      action: entry.reason,
      module: meta.module,
      emoji: meta.emoji,
      points: entry.amount,
      timestamp: entry.createdAt,
    };
  });

  const totalEarned = historyEvents.reduce((s, e) => s + (e.points > 0 ? e.points : 0), 0);

  return (
    <View className="flex flex-col h-full overflow-hidden" style={{  }}>{}<View className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 pointer-events-none" style={{  }} /><View className="absolute bottom-1/3 right-0 w-48 h-48 pointer-events-none" style={{  }} />{}<View className="flex-shrink-0 px-5 pt-12 pb-4"><View className="flex items-center gap-3 mb-5"><Pressable onPress={onBack} className="w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={20} className="text-white" /></Pressable><View className="flex-1"><Text className="text-white font-black text-xl">Récompenses 🏆</Text><Text className="text-white/40 text-xs">Gagnez des points · Débloquez des avantages</Text></View><View className="flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ backgroundColor: "rgba(255,215,0,0.12)", borderWidth: 1, borderColor: "rgba(255,215,0,0.25)", borderStyle: "solid" }}><Zap size={14} className="text-yellow-400" /><Text className="text-yellow-400 font-black text-sm">{total.toLocaleString()}</Text><Text className="text-yellow-400/60 text-xs">pts</Text></View></View>{}<View className="mx-0 mb-4"><LevelCard total={total} /></View>{}<LevelRoadmap total={total} />{}<View className="flex gap-1 rounded-2xl p-1" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>{([["rewards", "🎁 Récompenses"], ["history", "📋 Historique"], ["earn", "⚡ Gagner"]] as [Tab, string][]).map(([t, label]) => (
            <Pressable key={t} onPress={() => setTab(t)} className="flex-1 py-2 rounded-xl text-xs font-bold transition-all" style={{ backgroundColor: tab === t ? "rgba(139,92,246,0.3)" : "transparent", borderColor: "rgba(139,92,246,0.4)", borderStyle: "solid" }}>{label}</Pressable>
          ))}</View></View>{}<View className="flex-1 overflow-y-auto px-5 pb-8" style={{  }}><View>{}{tab === "rewards" && (
            <View key="rewards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Level filter */}
              <View className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{  }}>{(["Tous", ...LEVEL_ORDER] as (Level | "Tous")[]).map(l => (
                  <Pressable key={l} onPress={() => setFilterLevel(l)} className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all" style={{ backgroundColor: filterLevel === l ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.06)", borderColor: "#8B5CF6", borderStyle: "solid" }}>{l === "Tous" ? "🎁 Tous" : `${LEVEL_ICONS[l]} ${l}`}</Pressable>
                ))}</View>
              <View className="flex flex-col gap-3">{filteredRewards.map((r, i) => (
                  <View key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <RewardCard reward={r} total={total} isClaimed={claimedRewards.includes(r.id)} onClaim={() => handleClaim(r)} />
                  </View>
                ))}</View>
            </View>
          )}{}{tab === "history" && (
            <View key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Summary stats */}
              <View className="gap-2 mb-4">{[
                  { label: "Total gagné", value: totalEarned.toLocaleString(), unit: "pts", color: "#A78BFA" },
                  { label: "Actions", value: `${historyEvents.length}`, unit: "événements", color: "#34D399" },
                  { label: "Badges", value: `${rewardsData.badgeCount}`, unit: "obtenus", color: "#FB923C" },
                ].map(s => (
                  <View key={s.label} className="rounded-2xl p-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="font-black text-lg" style={{  }}>{s.value}</View><View className="text-white/40 text-[10px]">{s.unit}</View><View className="text-white/60 text-[10px] mt-0.5">{s.label}</View></View>
                ))}</View>

              <View className="flex flex-col gap-2">{historyEvents.length === 0 ? (
                  <View className="text-center py-10 text-white/30 text-sm"><Text>Aucun historique pour le moment</Text></View>
                ) : (
                  historyEvents.map((event, i) => (
                    <View key={event.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-3 rounded-2xl p-3" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
                      <View className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: "rgba(139,92,246,0.15)" }}>{event.emoji}</View>
                      <View className="flex-1 min-w-0"><View className="text-white text-sm font-semibold truncate">{event.action}</View><View className="text-white/40 text-xs">{event.module}<Text>·</Text>{new Date(event.timestamp).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</View></View>
                      <View className="font-black text-sm flex-shrink-0" style={{  }}>{event.points > 0 ? "+" : ""}{event.points}<Text>pts</Text></View>
                    </View>
                  ))
                )}</View>
            </View>
          )}{}{tab === "earn" && (
            <View key="earn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <View className="rounded-2xl p-4 mb-4" style={{ borderWidth: 1, borderColor: "rgba(139,92,246,0.25)", borderStyle: "solid" }}><View className="flex items-center gap-2 mb-1"><Sparkles size={16} className="text-purple-400" /><Text className="text-white font-bold text-sm">Comment gagner des points ?</Text></View><Text className="text-white/50 text-xs">Chaque interaction dans Débrouille Pro vous rapporte des points XP. Plus vous utilisez l'app, plus vous montez en niveau !</Text></View>
              <View className="flex flex-col gap-2">{EARN_WAYS.map((w, i) => (
                  <View key={w.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between rounded-2xl p-3.5" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                    <View className="flex items-center gap-3"><Text className="text-2xl">{w.emoji}</Text><Text className="text-white text-sm">{w.label}</Text></View>
                    <Text className="font-black text-sm" style={{ color: "#A78BFA" }}>{w.pts}</Text>
                  </View>
                ))}</View>
            </View>
          )}</View></View></View>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
interface RecompensesPageProps { onBack: () => void; }

type Tab = "rewards" | "history" | "earn";

export default function RecompensesPage({ onBack }: RecompensesPageProps) {
  return (
    <>
      <Authenticated>
        <RecompensesContent onBack={onBack} />
      </Authenticated>
      <Unauthenticated>
        <View className="flex flex-col h-full items-center justify-center gap-4" style={{  }}><View className="absolute top-5 left-5"><Pressable onPress={onBack} className="w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={20} className="text-white" /></Pressable></View><Text className="text-4xl">🏆</Text><Text className="text-white font-bold text-lg">Récompenses</Text><Text className="text-white/50 text-sm text-center max-w-xs">Connectez-vous pour voir vos points XP et débloquer des récompenses</Text><SignInButton /></View>
      </Unauthenticated>
      <AuthLoading>
        <View className="flex flex-col h-full" style={{  }}><View className="flex-shrink-0 px-5 pt-12 pb-4"><View className="flex items-center gap-3 mb-5"><Pressable onPress={onBack} className="w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={20} className="text-white" /></Pressable><Skeleton className="h-6 w-40" /></View><Skeleton className="h-40 w-full rounded-3xl mb-4" /><Skeleton className="h-20 w-full rounded-3xl" /></View></View>
      </AuthLoading>
    </>
  );
}
