import { Pressable, View, Text, Image } from "react-native";
import { useState, useMemo } from "react";
import { AnimatePresence } from "motion/react";
import { useQuery } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import {
  ArrowLeft, Star, Trophy, Shield, Zap, TrendingUp,
  Users, MessageCircle, Heart, BookOpen, Package,
  ChevronRight, Award, Crown, Flame, Lock,
  CheckCircle, Clock, BarChart2, Gift,
} from "lucide-react-native";

// ── Types ─────────────────────────────────────────────────────────────────────
type BadgeRarity = "commun" | "rare" | "épique" | "légendaire";
type BadgeStatus = "obtenu" | "en_cours" | "verrouillé";

type Badge = {
  id: string;
  nom: string;
  description: string;
  emoji: string;
  couleur: string;
  rarity: BadgeRarity;
  status: BadgeStatus;
  progression?: number;
  obtenusLe?: string;
  xpReward: number;
  categorie: string;
};

type LeaderboardEntry = {
  rang: number;
  nom: string;
  avatar: string;
  xp: number;
  badges: number;
  isMe: boolean;
  niveau: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────
const RARITY_CONFIG: Record<BadgeRarity, { label: string; color: string; bg: string; glow: string }> = {
  commun:    { label: "Commun",     color: "#9CA3AF", bg: "rgba(156,163,175,0.12)", glow: "rgba(156,163,175,0.3)" },
  rare:      { label: "Rare",       color: "#3B82F6", bg: "rgba(59,130,246,0.15)",  glow: "rgba(59,130,246,0.4)" },
  épique:    { label: "Épique",     color: "#8B5CF6", bg: "rgba(139,92,246,0.18)",  glow: "rgba(139,92,246,0.5)" },
  légendaire:{ label: "Légendaire", color: "#F59E0B", bg: "rgba(245,158,11,0.18)",  glow: "rgba(245,158,11,0.6)" },
};

const NIVEAU_CONFIG = [
  { min: 0,    max: 500,  nom: "Débutant",    emoji: "🌱", color: "#9CA3AF" },
  { min: 500,  max: 1500, nom: "Actif",       emoji: "⚡", color: "#3B82F6" },
  { min: 1500, max: 3000, nom: "Contributeur",emoji: "🔥", color: "#F97316" },
  { min: 3000, max: 6000, nom: "Expert",      emoji: "💜", color: "#8B5CF6" },
  { min: 6000, max: 12000,nom: "Maître",      emoji: "👑", color: "#F59E0B" },
  { min: 12000,max: 99999,nom: "Légende",     emoji: "🌟", color: "#EF4444" },
];

function getNiveau(xp: number) {
  return NIVEAU_CONFIG.find((n) => xp >= n.min && xp < n.max) ?? NIVEAU_CONFIG[0];
}

// Fallback badges used when no data in Convex
const FALLBACK_BADGES: Badge[] = [
  { id: "b1",  nom: "Premier pas",      description: "Publiez votre premier post dans la communauté", emoji: "👣", couleur: "#9CA3AF", rarity: "commun",    status: "obtenu",    obtenusLe: "Jan 2025", xpReward: 50,   categorie: "Social" },
  { id: "b2",  nom: "Réseauteur",       description: "Rejoignez 3 groupes thématiques",              emoji: "🤝", couleur: "#3B82F6", rarity: "commun",    status: "obtenu",    obtenusLe: "Jan 2025", xpReward: 100,  categorie: "Social" },
  { id: "b3",  nom: "Voix du quartier", description: "10 posts appréciés dans votre groupe local",    emoji: "📣", couleur: "#3B82F6", rarity: "rare",      status: "obtenu",    obtenusLe: "Fév 2025", xpReward: 200,  categorie: "Social" },
  { id: "b4",  nom: "Mentor",           description: "Aidez 5 membres à résoudre un problème",       emoji: "🎓", couleur: "#8B5CF6", rarity: "épique",    status: "obtenu",    obtenusLe: "Fév 2025", xpReward: 350,  categorie: "Aide" },
  { id: "b5",  nom: "Entrepreneur",     description: "Complétez votre profil Pro à 100%",             emoji: "💼", couleur: "#F97316", rarity: "rare",      status: "obtenu",    obtenusLe: "Mars 2025",xpReward: 150,  categorie: "Pro" },
  { id: "b6",  nom: "Acheteur Pro",     description: "Effectuez 5 transactions sur la marketplace",  emoji: "🛒", couleur: "#10B981", rarity: "commun",    status: "obtenu",    obtenusLe: "Mars 2025", xpReward: 100,  categorie: "Commerce" },
  { id: "b7",  nom: "Apprenant",        description: "Terminez 2 cours sur Apprendre",                emoji: "📚", couleur: "#A78BFA", rarity: "rare",      status: "obtenu",    obtenusLe: "Avr 2025", xpReward: 200,  categorie: "Formation" },
  { id: "b8",  nom: "Connecteur",       description: "Parrainéz 3 amis sur Débrouille Pro",          emoji: "🔗", couleur: "#F59E0B", rarity: "épique",    status: "obtenu",    obtenusLe: "Avr 2025", xpReward: 400,  categorie: "Parrainage" },
  { id: "b9",  nom: "Expert Local",     description: "Obtenez 50 likes sur vos posts de quartier",   emoji: "🏆", couleur: "#8B5CF6", rarity: "épique",    status: "en_cours",  progression: 62, xpReward: 500,  categorie: "Social" },
  { id: "b10", nom: "Live Star",        description: "Participez à 10 lives en tant que spectateur", emoji: "📡", couleur: "#EF4444", rarity: "rare",      status: "en_cours",  progression: 40, xpReward: 250,  categorie: "Live" },
  { id: "b11", nom: "Marchand Pro",     description: "Réalisez 20 ventes sur la marketplace",        emoji: "💰", couleur: "#10B981", rarity: "épique",    status: "en_cours",  progression: 25, xpReward: 600,  categorie: "Commerce" },
  { id: "b12", nom: "Pilier communauté",description: "6 mois d'activité continue sur la plateforme", emoji: "🏛️", couleur: "#6366F1", rarity: "légendaire",status: "en_cours",  progression: 75, xpReward: 1000, categorie: "Social" },
  { id: "b13", nom: "Légende Afrique",  description: "Atteignez le niveau Légende",                  emoji: "🌟", couleur: "#F59E0B", rarity: "légendaire",status: "verrouillé",xpReward: 2000, categorie: "Niveau" },
  { id: "b14", nom: "Ambassadeur",      description: "Parrainéz 20 membres vérifiés",                emoji: "🎖️", couleur: "#F59E0B", rarity: "légendaire",status: "verrouillé",xpReward: 1500, categorie: "Parrainage" },
  { id: "b15", nom: "Maître du Live",   description: "Lancez 5 lives avec 100+ spectateurs",         emoji: "🎥", couleur: "#EF4444", rarity: "légendaire",status: "verrouillé",xpReward: 2500, categorie: "Live" },
  { id: "b16", nom: "Sage",             description: "Aidez 50 membres à résoudre leurs problèmes",  emoji: "🧙", couleur: "#8B5CF6", rarity: "légendaire",status: "verrouillé",xpReward: 3000, categorie: "Aide" },
];

const CATEGORIES_FILTER = ["Tous", "Obtenu", "En cours", "Social", "Pro", "Commerce", "Formation", "Live"];

// ── Helpers ─────────────────────────────────────────────────────────────────
function eventTypeToIcon(type: string): string {
  switch (type) {
    case "publication_liked": return "📝";
    case "comment_liked": return "💬";
    case "followed": return "👥";
    case "review_received": return "⭐";
    case "sale_completed": return "🛒";
    case "badge_earned": return "🏆";
    case "verified": return "✅";
    default: return "✨";
  }
}

function formatEventTime(creationTime: number): string {
  const now = Date.now();
  const diffMs = now - creationTime;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `Il y a ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `Il y a ${diffD}j`;
}

// ── Badge Card ────────────────────────────────────────────────────────────────
function BadgeCard({ badge, onClick }: { badge: Badge; onClick: () => void }) {
  const rarity = RARITY_CONFIG[badge.rarity];
  const locked = badge.status === "verrouillé";
  const inProgress = badge.status === "en_cours";

  return (
    <Pressable whileTap={{ scale: 0.95 }} onPress={onClick} className="relative rounded-2xl p-3 flex flex-col items-center gap-2 text-center" style={{ backgroundColor: locked ? "rgba(255,255,255,0.03)" : rarity.bg, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid", opacity: locked ? 0.6 : 1 }}>
      {!locked && (badge.rarity === "légendaire" || badge.rarity === "épique") && (
        <View className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: `inset 0 0 20px ${rarity.glow}` }} />
      )}

      <View className="relative w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: locked ? "rgba(255,255,255,0.05)" : `${rarity.color}15` }}><Text className={locked ? "grayscale opacity-50" : ""}>{badge.emoji}</Text>{locked && (
          <View className="absolute inset-0 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}><Lock size={14} className="text-white/40" /></View>
        )}{badge.status === "obtenu" && (
          <View initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{  }}>
            <CheckCircle size={10} className="text-white" />
          </View>
        )}</View>

      <Text className={`text-[11px] font-bold leading-tight ${locked ? "text-white/30" : "text-white/90"}`}>{badge.nom}</Text>

      <Text className="px-1.5 py-0.5 rounded-full text-[8px] font-black" style={{ backgroundColor: `${rarity.color}20`, color: rarity.color }}>{rarity.label}</Text>

      {inProgress && badge.progression !== undefined && (
        <View className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}><View initial={{ width: 0 }} animate={{ width: `${badge.progression}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-full rounded-full" style={{  }} /></View>
      )}
    </Pressable>
  );
}

// ── Badge Detail Modal ────────────────────────────────────────────────────────
function BadgeModal({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  const rarity = RARITY_CONFIG[badge.rarity];
  return (
    <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.75)" }} onPress={onClose}>
      <View initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} onPress={(e) => e.stopPropagation()} className="w-full rounded-t-3xl p-6" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
        <View className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 pointer-events-none" style={{  }} />

        <View className="flex flex-col items-center gap-3 mb-5"><View initial={{ scale: 0.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl relative" style={{ backgroundColor: rarity.bg, borderStyle: "solid", boxShadow: `0 0 40px ${rarity.glow}` }}>{badge.emoji}{badge.status === "obtenu" && (
              <View className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center" style={{ boxShadow: "0 0 12px rgba(16,185,129,0.6)" }}><CheckCircle size={14} className="text-white" /></View>
            )}</View><View className="text-center"><Text className="text-xl font-black text-white">{badge.nom}</Text><Text className="inline-block px-3 py-1 rounded-full text-xs font-bold mt-1" style={{ backgroundColor: rarity.bg, color: rarity.color }}>{rarity.label}· +{badge.xpReward}XP
            </Text></View></View>

        <Text className="text-sm text-white/60 text-center leading-relaxed mb-5">{badge.description}</Text>

        {badge.status === "en_cours" && badge.progression !== undefined && (
          <View className="mb-5"><View className="flex justify-between text-xs text-white/50 mb-2"><Text>Progression</Text><Text className="font-bold" style={{ color: rarity.color }}>{badge.progression}%</Text></View><View className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><View initial={{ width: 0 }} animate={{ width: `${badge.progression}%` }} transition={{ duration: 1, ease: "easeOut" }} className="h-full rounded-full" style={{  }} /></View></View>
        )}

        {badge.status === "obtenu" && badge.obtenusLe && (
          <View className="flex items-center justify-center gap-2 mb-5 px-4 py-3 rounded-2xl" style={{ backgroundColor: "rgba(16,185,129,0.1)", borderWidth: 1, borderColor: "rgba(16,185,129,0.2)", borderStyle: "solid" }}><CheckCircle size={14} className="text-green-400" /><Text className="text-sm text-green-400 font-semibold">Obtenu le {badge.obtenusLe}</Text></View>
        )}

        <Pressable onPress={onClose} className="w-full py-3.5 rounded-2xl text-sm font-bold text-white" style={{  }}>{badge.status === "obtenu" ? "Partager ce badge" : badge.status === "en_cours" ? "Continuer la progression" : "Voir comment débloquer"}</Pressable>
      </View>
    </View>
  );
}

// ── Classement Row ────────────────────────────────────────────────────────────
function ClassementRow({ entry }: { entry: LeaderboardEntry }) {
  const rang = entry.rang;
  const rankColor = rang === 1 ? "#F59E0B" : rang === 2 ? "#9CA3AF" : rang === 3 ? "#F97316" : "rgba(255,255,255,0.3)";
  const niveau = NIVEAU_CONFIG.find((n) => n.nom === entry.niveau) ?? NIVEAU_CONFIG[0];

  return (
    <View initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${entry.isMe ? "border" : ""}`} style={{ backgroundColor: entry.isMe ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.03)", borderColor: "rgba(139,92,246,0.3)", borderStyle: "solid" }}>
      <View className="w-8 flex items-center justify-center flex-shrink-0">{rang <= 3 ? (
          <Text className="text-xl">{rang === 1 ? "🥇" : rang === 2 ? "🥈" : "🥉"}</Text>
        ) : (
          <Text className="text-sm font-black" style={{ color: rankColor }}>#{rang}</Text>
        )}</View>
      <Image className="w-10 h-10 rounded-xl object-cover flex-shrink-0" style={{ borderColor: "rgba(139,92,246,0.5)", borderStyle: "solid" }} source={{ uri: entry.avatar || "https://images.unsplash.com/photo-1646658104783-2eec2433c1d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=80" }} accessibilityLabel={entry.nom} />
      <View className="flex-1 min-w-0"><View className="flex items-center gap-1.5"><Text className="text-sm font-bold text-white truncate">{entry.nom}</Text>{entry.isMe && <Text className="text-[9px] font-black text-purple-400 px-1 py-0.5 rounded-md" style={{ backgroundColor: "rgba(139,92,246,0.2)" }}>Vous</Text>}</View><View className="flex items-center gap-2 mt-0.5"><Text className="text-[10px]">{niveau.emoji}</Text><Text className="text-[10px] text-white/50">{entry.niveau}</Text><Text className="text-[10px] text-white/30">·</Text><Text className="text-[10px] text-white/40">{entry.badges}badges</Text></View></View>
      <View className="text-right flex-shrink-0"><Text className="text-sm font-black" style={{ color: rang <= 3 ? rankColor : "rgba(255,255,255,0.6)" }}>{entry.xp.toLocaleString()}</Text><Text className="text-[9px] text-white/30">XP</Text></View>
    </View>
  );
}

// ── Loading skeleton ─────────────────────────────────────────────────────────
function ReputationSkeleton() {
  return (
    <View className="h-full w-full flex flex-col overflow-hidden p-5 gap-4" style={{  }}><Skeleton className="h-10 w-48 bg-white/10" /><Skeleton className="h-40 w-full rounded-3xl bg-white/5" /><View className="flex gap-2"><Skeleton className="h-10 flex-1 rounded-xl bg-white/5" /><Skeleton className="h-10 flex-1 rounded-xl bg-white/5" /><Skeleton className="h-10 flex-1 rounded-xl bg-white/5" /></View><View className="gap-3">{Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl bg-white/5" />
        ))}</View></View>
  );
}

// ── Inner page (authenticated) ───────────────────────────────────────────────
type Tab = "badges" | "classement" | "historique";

function ReputationPageInner({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("badges");
  const [filter, setFilter] = useState("Tous");
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const profile = useQuery(api.reputation.getReputationProfile, {});
  const events = useQuery(api.reputation.getMyReputationEvents, {});
  const leaderboard = useQuery(api.reputation.getLeaderboard, {});

  // Derive data from profile
  const myXp = profile?.reputationScore ?? 0;
  const myName = profile?.name ?? "Utilisateur";
  const myAvatar = profile?.avatar ?? "https://images.unsplash.com/photo-1646658104783-2eec2433c1d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=80";
  const myBadgeCount = profile?.badgeCount ?? 0;

  const niveau = getNiveau(myXp);
  const nextNiveau = NIVEAU_CONFIG[NIVEAU_CONFIG.indexOf(niveau) + 1];
  const xpToNext = nextNiveau ? nextNiveau.min - myXp : 0;
  const levelProgress = nextNiveau
    ? Math.round(((myXp - niveau.min) / (nextNiveau.min - niveau.min)) * 100)
    : 100;

  // Map leaderboard data
  const classementData: LeaderboardEntry[] = useMemo(() => {
    if (!leaderboard || leaderboard.length === 0) return [];
    return leaderboard.map((entry, i) => ({
      rang: i + 1,
      nom: entry.name ?? "Anonyme",
      avatar: entry.avatar ?? "https://images.unsplash.com/photo-1646658104783-2eec2433c1d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=80",
      xp: entry.totalPoints,
      badges: entry.badgeCount,
      isMe: entry.userId === profile?.userId,
      niveau: entry.level,
    }));
  }, [leaderboard, profile?.userId]);

  // Find my rank in the leaderboard
  const myRank = classementData.find((e) => e.isMe)?.rang ?? 0;

  // Use fallback badges since Convex doesn't store full badge detail
  const allBadges = FALLBACK_BADGES;

  const filteredBadges = useMemo(() => {
    if (filter === "Tous") return allBadges;
    if (filter === "Obtenu") return allBadges.filter((b) => b.status === "obtenu");
    if (filter === "En cours") return allBadges.filter((b) => b.status === "en_cours");
    return allBadges.filter((b) => b.categorie === filter);
  }, [filter, allBadges]);

  const obtainedCount = allBadges.filter((b) => b.status === "obtenu").length;
  const inProgressCount = allBadges.filter((b) => b.status === "en_cours").length;

  // Compute XP earned this week from events
  const weekXp = useMemo(() => {
    if (!events || events.length === 0) return 0;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return events
      .filter((e) => e._creationTime >= weekAgo)
      .reduce((sum, e) => sum + e.points, 0);
  }, [events]);

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "badges",     label: "Badges",     icon: Award },
    { id: "classement", label: "Classement", icon: Trophy },
    { id: "historique", label: "Historique", icon: Clock },
  ];

  if (profile === undefined) {
    return <ReputationSkeleton />;
  }

  return (
    <View className="relative h-full w-full flex flex-col overflow-hidden" style={{  }}>{}<View className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none" style={{  }} /><View className="absolute bottom-16 left-0 w-48 h-48 rounded-full pointer-events-none" style={{  }} />{}<View className="flex-shrink-0 px-5 pt-6 pb-0"><View className="flex items-center gap-3 mb-5"><Pressable onPress={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}><ArrowLeft size={18} className="text-white" /></Pressable><View><Text className="text-lg font-black text-white">Réputation & Badges</Text><Text className="text-[11px] text-white/40">{myBadgeCount > 0 ? myBadgeCount : obtainedCount}badges obtenus{myRank > 0 ? ` · rang #${myRank} cette semaine` : ""}</Text></View></View>{}<View initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl p-5 mb-4 overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="absolute top-0 right-0 w-32 h-32 pointer-events-none" style={{  }} /><View className="flex items-center gap-4 mb-4"><View className="relative"><Image className="w-16 h-16 rounded-2xl object-cover" style={{ borderStyle: "solid" }} source={{ uri: myAvatar }} accessibilityLabel={myName} /><View className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl flex items-center justify-center text-base" style={{ backgroundColor: `${niveau.color}20`, borderStyle: "solid" }}>{niveau.emoji}</View></View><View className="flex-1"><Text className="text-base font-black text-white">{myName}</Text><Text className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${niveau.color}18`, color: niveau.color }}>{niveau.nom}</Text><View className="flex items-center gap-3 mt-2"><Text className="text-xs text-white/50 flex items-center gap-1"><Star size={10} className="text-yellow-400" />{myXp.toLocaleString()}XP</Text><Text className="text-xs text-white/50 flex items-center gap-1"><Award size={10} className="text-purple-400" />{myBadgeCount > 0 ? myBadgeCount : obtainedCount}badges</Text>{myRank > 0 && <Text className="text-xs text-white/50 flex items-center gap-1"><Crown size={10} className="text-orange-400" />Rang #{myRank}</Text>}</View></View></View>{}{nextNiveau && (
            <View><View className="flex justify-between text-xs text-white/40 mb-2"><Text>{niveau.nom}</Text><Text className="font-semibold" style={{ color: niveau.color }}>{xpToNext.toLocaleString()}XP pour {nextNiveau.nom}</Text></View><View className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}><View initial={{ width: 0 }} animate={{ width: `${levelProgress}%` }} transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }} className="h-full rounded-full" style={{  }} /></View></View>
          )}{}<View className="gap-2 mt-4">{[
              { label: "Posts", value: String(events?.filter((e) => e.type === "publication_liked").length ?? 0), icon: MessageCircle, color: "#8B5CF6" },
              { label: "Aides", value: String(events?.filter((e) => e.type === "review_received").length ?? 0), icon: Heart, color: "#EF4444" },
              { label: "Ventes", value: String(events?.filter((e) => e.type === "sale_completed").length ?? 0), icon: Zap, color: "#F97316" },
              { label: "Suivis", value: String(events?.filter((e) => e.type === "followed").length ?? 0), icon: Users, color: "#10B981" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <View key={s.label} className="flex flex-col items-center gap-0.5 p-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}><Icon size={13} style={{  }} /><Text className="text-sm font-black text-white">{s.value}</Text><Text className="text-[9px] text-white/40">{s.label}</Text></View>
              );
            })}</View></View>{}<View className="flex gap-2 mb-4">{TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <Pressable key={t.id} onPress={() => setTab(t.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all" style={{ backgroundColor: active ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.05)", borderColor: "rgba(245,158,11,0.35)", borderStyle: "solid" }}><Icon size={13} />{t.label}</Pressable>
            );
          })}</View></View>{}<View className="flex-1 overflow-y-auto px-5 pb-8" style={{  }}><View>{}{tab === "badges" && (
            <View key="badges" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <View className="gap-2 mb-4">{[
                  { label: "Obtenus", value: obtainedCount, color: "#10B981" },
                  { label: "En cours", value: inProgressCount, color: "#F97316" },
                  { label: "Total", value: allBadges.length, color: "#8B5CF6" },
                ].map((s) => (
                  <View key={s.label} className="rounded-2xl py-3 flex flex-col items-center gap-0.5" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderStyle: "solid" }}><Text className="text-xl font-black" style={{ color: s.color }}>{s.value}</Text><Text className="text-[10px] text-white/40">{s.label}</Text></View>
                ))}</View>

              <View className="flex gap-2 overflow-x-auto pb-3 mb-3" style={{  }}>{CATEGORIES_FILTER.map((c) => (
                  <Pressable key={c} onPress={() => setFilter(c)} className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all" style={{  }}>{c}</Pressable>
                ))}</View>

              <View className="gap-3">
                <AnimatePresence mode="popLayout">
                  {filteredBadges.map((badge, i) => (
                    <View key={badge.id} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={{ delay: i * 0.03 }}>
                      <BadgeCard badge={badge} onPress={() => setSelectedBadge(badge)} />
                    </View>
                  ))}
                </AnimatePresence>
              </View>
            </View>
          )}{}{tab === "classement" && (
            <View key="classement" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <View className="flex gap-2 mb-4">{["Cette semaine", "Ce mois", "Tout temps"].map((p, i) => (
                  <Pressable key={p} className="flex-1 py-2 rounded-xl text-xs font-bold" style={{ backgroundColor: i === 0 ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.05)" }}>{p}</Pressable>
                ))}</View>

              {/* Podium top 3 */}
              {classementData.length >= 3 && (
                <View className="flex items-end justify-center gap-3 mb-5 px-2">{}<View initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col items-center gap-1 flex-1"><Image className="w-12 h-12 rounded-2xl object-cover border-2" style={{ borderColor: "#9CA3AF" }} source={{ uri: classementData[1].avatar }} accessibilityLabel="" /><Text className="text-2xl">🥈</Text><Text className="text-[10px] text-white/70 font-bold text-center">{classementData[1].nom.split(" ")[0]}</Text><Text className="text-[10px] text-white/40">{classementData[1].xp.toLocaleString()}XP</Text></View>{}<View initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="flex flex-col items-center gap-1 flex-1 mb-3"><View className="relative"><Image className="w-16 h-16 rounded-2xl object-cover border-2" style={{ borderColor: "#F59E0B", boxShadow: "0 0 20px rgba(245,158,11,0.5)" }} source={{ uri: classementData[0].avatar }} accessibilityLabel="" /><Text className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg">👑</Text></View><Text className="text-2xl">🥇</Text><Text className="text-[10px] text-yellow-400 font-black text-center">{classementData[0].nom.split(" ")[0]}</Text><Text className="text-[10px] text-yellow-400/70">{classementData[0].xp.toLocaleString()}XP</Text></View>{}<View initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col items-center gap-1 flex-1"><Image className="w-12 h-12 rounded-2xl object-cover border-2" style={{ borderColor: "#F97316" }} source={{ uri: classementData[2].avatar }} accessibilityLabel="" /><Text className="text-2xl">🥉</Text><Text className="text-[10px] text-white/70 font-bold text-center">{classementData[2].nom.split(" ")[0]}</Text><Text className="text-[10px] text-white/40">{classementData[2].xp.toLocaleString()}XP</Text></View></View>
              )}

              {/* Full ranking */}
              <View className="flex flex-col gap-2">{classementData.slice(3).map((entry, i) => (
                  <View key={entry.rang} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <ClassementRow entry={entry} />
                  </View>
                ))}</View>

              {/* Empty state if no leaderboard data */}
              {classementData.length === 0 && (
                <View className="flex flex-col items-center gap-3 py-10 text-center"><Trophy size={32} className="text-white/20" /><Text className="text-sm text-white/40">Le classement sera disponible prochainement</Text></View>
              )}

              {/* My rank highlight */}
              {myRank > 0 && (
                <View className="mt-4 p-4 rounded-2xl" style={{ backgroundColor: "rgba(139,92,246,0.08)", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", borderStyle: "solid" }}><Text className="text-xs text-white/50 mb-1">Votre position cette semaine</Text><View className="flex items-center gap-3"><Text className="text-2xl font-black text-purple-400">#{myRank}</Text><View><Text className="text-sm font-bold text-white">{myXp.toLocaleString()}XP</Text><Text className="text-[11px] text-white/40">Continuez pour monter dans le classement</Text></View><TrendingUp size={20} className="text-green-400 ml-auto" /></View></View>
              )}
            </View>
          )}{}{tab === "historique" && (
            <View key="historique" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {/* XP earned this week */}
              <View className="rounded-2xl p-4 mb-4 flex items-center gap-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}><View className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(245,158,11,0.15)" }}><BarChart2 size={22} className="text-yellow-400" /></View><View><Text className="text-xs text-white/40">XP gagnés cette semaine</Text><Text className="text-2xl font-black text-yellow-400">+{weekXp}XP</Text></View></View>

              {/* Contribution list from Convex events */}
              {events && events.length > 0 ? (
                <View className="flex flex-col gap-2">{events.map((event, i) => (
                    <View key={event._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-3 p-3 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}>
                      <View className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>{eventTypeToIcon(event.type)}</View>
                      <View className="flex-1 min-w-0"><Text className="text-sm text-white/80 font-medium truncate">{event.description}</Text><Text className="text-[10px] text-white/35 flex items-center gap-1"><Clock size={9} />{formatEventTime(event._creationTime)}</Text></View>
                      <Text className="flex-shrink-0 text-xs font-black px-2 py-1 rounded-xl" style={{ backgroundColor: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>+{event.points}XP
                      </Text>
                    </View>
                  ))}</View>
              ) : (
                <View className="flex flex-col items-center gap-3 py-8 text-center"><Clock size={28} className="text-white/20" /><Text className="text-sm text-white/40">Aucune activité récente</Text><Text className="text-xs text-white/30">Vos contributions apparaîtront ici</Text></View>
              )}

              {/* How to earn more */}
              <View className="mt-4 rounded-2xl p-4" style={{ backgroundColor: "rgba(139,92,246,0.08)", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", borderStyle: "solid" }}><View className="flex items-center gap-2 mb-3"><Gift size={14} className="text-purple-400" /><Text className="text-xs font-bold text-white">Comment gagner plus de XP</Text></View>{[
                  { action: "Publier un post", xp: "+15-50 XP", emoji: "📝" },
                  { action: "Aider un membre", xp: "+30 XP",    emoji: "🤝" },
                  { action: "Suivre un cours", xp: "+100 XP",   emoji: "🎓" },
                  { action: "Parrainer un ami", xp: "+200 XP",  emoji: "🔗" },
                  { action: "Lancer un live",   xp: "+75 XP",   emoji: "📡" },
                ].map((a, i) => (
                  <View key={i} className="flex items-center justify-between py-2" style={{ borderBottomWidth: 4, borderBottomColor: "rgba(255,255,255,0.05)" }}><Text className="text-xs text-white/60 flex items-center gap-2"><Text>{a.emoji}</Text>{a.action}</Text><Text className="text-xs font-bold text-yellow-400">{a.xp}</Text></View>
                ))}</View>
            </View>
          )}</View></View>{}<View>{selectedBadge && <BadgeModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />}</View></View>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
interface ReputationPageProps {
  onBack: () => void;
}

export default function ReputationPage({ onBack }: ReputationPageProps) {
  return (
    <>
      <AuthLoading>
        <ReputationSkeleton />
      </AuthLoading>
      <Unauthenticated>
        <View className="h-full w-full flex flex-col items-center justify-center gap-4 p-6" style={{  }}><View className="flex items-center gap-3 mb-2"><Pressable onPress={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}><ArrowLeft size={18} className="text-white" /></Pressable><Text className="text-lg font-black text-white">Réputation & Badges</Text></View><Award size={48} className="text-yellow-400/60" /><Text className="text-sm text-white/50 text-center">Connectez-vous pour voir votre réputation et vos badges</Text><SignInButton /></View>
      </Unauthenticated>
      <Authenticated>
        <ReputationPageInner onBack={onBack} />
      </Authenticated>
    </>
  );
}
