import { View, Image, Pressable, Text } from "react-native";

// src/pages/modules/ProfilePage.tsx

import { useState } from "react";
import {
  ArrowLeft,
  Edit3,
  MapPin,
  TrendingUp,
  BarChart2,
  Star,
  Building2,
  Share2,
  Lock,
  ChevronRight,
  Shield,
  Zap,
  Flame,
  Clock,
  Link2,
  Play,
} from "lucide-react-native";
import { toast } from "sonner";
import { usePoints, getLevelProgress } from "@/hooks/use-points.ts";
import { SignInButton } from "@/components/ui/signin.tsx";
import { useCurrentUser, getDisplayName } from "@/hooks/use-current-user.ts";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import UserAvatar from "@/components/ui/user-avatar.tsx";
import { useActivity } from "@/hooks/use-activity.ts";
import { usePreferences } from "@/hooks/use-preferences.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

// Importations modulaires de notre feature Profile
import type { ProfileTab } from "@/features/profile";
import {
  QRCardModal,
  EditProfileSheet,
  CompletionBar,
  RecentsTab,
  ActivityTimeline,
} from "@/features/profile";

const BADGES = [
  { icon: "✅", label: "Identité vérifiée", color: "#10B981" },
  { icon: "⚡", label: "Réponse rapide", color: "#F97316" },
  { icon: "🏆", label: "Top Vendeur", color: "#F59E0B" },
  { icon: "🛡️", label: "Compte sécurisé", color: "#3B82F6" },
];

const MODULE_STATS = [
  { label: "Annonces", value: "12", icon: Building2, color: "#F97316" },
  { label: "Followers", value: "1.4K", icon: Star, color: "#8B5CF6" },
  { label: "Avis", value: "4.9★", icon: Star, color: "#F59E0B" },
];

interface ProfilePageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

function ProfilePageInner({ onBack, onNavigate }: ProfilePageProps) {
  const [tab, setTab] = useState<ProfileTab>("apercu");
  const [showQR, setShowQR] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const { total } = usePoints();
  const { level } = getLevelProgress(total);

  // Convex user
  const user = useCurrentUser();

  // Firebase user
  const { user: firebaseUser, isAuthenticated } = useFirebaseAuth();

  // Requête des stats de suivi
  const followStats = useQuery(
    api.follows.getMyFollowStats,
    firebaseUser?.email ? { email: firebaseUser.email } : "skip",
  );

  // Streak et leaderboard
  const myStreak = useQuery(
    api.streaks.getMyStreak,
    isAuthenticated ? {} : "skip",
  );
  const leaderboard = useQuery(
    api.utility.getLeaderboard,
    isAuthenticated ? {} : "skip",
  );

  const accentHex =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--dp-hex")
      .trim() || "#8B5CF6";
  const displayName = getDisplayName(user);
  const slug = displayName.toLowerCase().replace(/\s+/g, "-");
  const bio =
    user?.bio ??
    "Agent immobilier & investisseur 🏠 · Passionné de tech africaine";
  const { prefs } = usePreferences();
  const { entries } = useActivity();
  const isActive = entries.filter((e) => e.type === "view_module").length >= 3;

  const LEVEL_ICONS: Record<string, string> = {
    Bronze: "🥉",
    Argent: "🥈",
    Or: "🥇",
    Diamant: "💎",
  };

  return (
    <View className="h-full flex flex-col overflow-hidden" style={{  }}>{}<View initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex-shrink-0"><View className="relative h-36 overflow-hidden"><Image className="w-full h-full object-cover opacity-40" source={{ uri: "https://images.unsplash.com/photo-1771539091406-feccb76ec825?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600" }} accessibilityLabel="cover" /><View className="absolute inset-0" style={{  }} /><View className="absolute inset-0" style={{  }} /><Pressable onPress={onBack} className="absolute top-5 left-5 w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}><ArrowLeft size={18} className="text-white" /></Pressable><Pressable onPress={() => setShowEdit(true)} className="absolute top-5 right-5 w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}><Edit3 size={16} className="text-white" /></Pressable></View><View className="px-5 -mt-12 relative z-10"><View className="flex items-end justify-between mb-3"><View className="relative"><UserAvatar user={user} size="w-20 h-20" className="border-4" /><Text className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-[#020617]" />{isActive && (
                <View className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[9px] font-black" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", borderStyle: "solid" }}><Text>ACTIF</Text></View>
              )}<View className="absolute -top-2 -left-2 px-1.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-0.5" style={{ backgroundColor: "rgba(0,0,0,0.8)", borderStyle: "solid" }}>{LEVEL_ICONS[level]}{level}</View></View><View className="flex items-center gap-2 pb-1 flex-wrap justify-end"><Pressable onPress={() => setShowQR(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold active:scale-95 transition-transform" style={{ backgroundColor: `${accentHex}20`, borderStyle: "solid" }}><Text>Carte</Text></Pressable><Pressable onPress={() => onNavigate("dashboard")} className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold active:scale-95 transition-transform" style={{ backgroundColor: "rgba(139,92,246,0.2)", borderWidth: 1, borderColor: "rgba(139,92,246,0.3)", borderStyle: "solid" }}><Text>Stats</Text></Pressable><Pressable onPress={() => onNavigate("documents")} className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold active:scale-95 transition-transform" style={{ backgroundColor: "rgba(16,185,129,0.2)", borderWidth: 1, borderColor: "rgba(16,185,129,0.3)", borderStyle: "solid" }}><Text>Coffre</Text></Pressable><Pressable onPress={() => onNavigate("export")} className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold active:scale-95 transition-transform" style={{ backgroundColor: "rgba(245,158,11,0.2)", borderWidth: 1, borderColor: "rgba(245,158,11,0.3)", borderStyle: "solid" }}><Text>Export</Text></Pressable><Pressable onPress={() => onNavigate("reels")} className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold active:scale-95 transition-transform" style={{ backgroundColor: "rgba(236,72,153,0.2)", borderWidth: 1, borderColor: "rgba(236,72,153,0.3)", borderStyle: "solid" }}><Play size={13} /><Text>Reels</Text></Pressable><Pressable onPress={() => onNavigate("creator-dashboard")} className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold active:scale-95 transition-transform" style={{ backgroundColor: "rgba(245,158,11,0.15)", borderWidth: 1, borderColor: "rgba(245,158,11,0.3)", borderStyle: "solid" }}><Text>Créateur</Text></Pressable></View></View><View className="flex items-center gap-2 mb-0.5"><Text className="text-xl font-black text-white">{displayName}</Text><Text className="w-2.5 h-2.5 rounded-full bg-blue-400" /></View><Text className="text-white/50 text-sm mb-2">{bio}</Text><View className="flex items-center gap-3 mb-3 flex-wrap"><View className="flex items-center gap-1"><TrendingUp size={11} className="text-green-400" /><Text className="text-xs text-green-400 font-medium">Pro Vérifié
              </Text></View>{user?.email && (
              <View className="flex items-center gap-1"><MapPin size={11} className="text-white/35" /><Text className="text-xs text-white/40 truncate max-w-[160px]">{user.email}</Text></View>
            )}<View className="flex items-center gap-1"><Clock size={11} className="text-white/35" /><Text className="text-xs text-white/40">Membre depuis 2024</Text></View></View><View className="flex items-center gap-3 mb-3 flex-wrap"><View className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ backgroundColor: "rgba(16,185,129,0.12)", borderWidth: 1, borderColor: "rgba(16,185,129,0.25)", borderStyle: "solid" }}><Shield size={12} className="text-green-400" /><Text className="text-xs font-bold text-green-400">Score fiabilité 96%
              </Text></View><View className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ backgroundColor: "rgba(245,158,11,0.12)", borderWidth: 1, borderColor: "rgba(245,158,11,0.25)", borderStyle: "solid" }}><Zap size={12} className="text-yellow-400" /><Text className="text-xs font-bold text-yellow-400">{total.toLocaleString()}XP
              </Text></View></View>{}<View className="flex items-center gap-5 mb-3 flex-wrap"><View className="text-center"><View className="text-base font-black text-white">{followStats
                  ? followStats.followerCount >= 1000
                    ? `${(followStats.followerCount / 1000).toFixed(1)}k`
                    : followStats.followerCount
                  : "—"}</View><View className="text-[10px] text-white/40"><Text>Abonnés</Text></View></View><View className="w-px h-6 bg-white/10" /><View className="text-center"><View className="text-base font-black text-white">{followStats ? followStats.followingCount : "—"}</View><View className="text-[10px] text-white/40"><Text>Abonnements</Text></View></View>{myStreak && myStreak.currentStreak > 0 && (
              <>
                <View className="w-px h-6 bg-white/10" />
                <View animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2.5 }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ backgroundColor: "rgba(249,115,22,0.15)", borderWidth: 1, borderColor: "rgba(249,115,22,0.3)", borderStyle: "solid" }}>
                  <Flame size={12} className="text-orange-400" />
                  <Text className="text-xs font-black text-orange-400">{myStreak.currentStreak}j 🔥
                  </Text>
                </View>
              </>
            )}</View>{}<View className="flex gap-1 rounded-2xl p-1" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>{(
              [
                ["apercu", "👤 Aperçu"],
                ["activite", "⚡ Activité"],
                ["recents", "🕐 Récents"],
                ["classement", "🏆 Top"],
              ] as [ProfileTab, string][]
            ).map(([t, label]) => (
              <Pressable key={t} onPress={() => setTab(t)} className="flex-1 py-2 rounded-xl text-xs font-bold transition-all" style={{ backgroundColor: tab === t ? `${accentHex}30` : "transparent", borderColor: "transparent", borderStyle: "solid" }}>{label}</Pressable>
            ))}</View></View></View>{}<View className="flex-1 overflow-y-auto px-5 pb-8 pt-3" style={{  }}><View>{tab === "apercu" && (
            <View key="apercu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-0">
              <CompletionBar
                accentHex={accentHex}
                hasName={!!user?.name}
                hasBio={!!user?.bio}
              />

              <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="gap-3 mb-4">
                {MODULE_STATS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <View key={s.label} className="rounded-2xl p-3 text-center" style={{ backgroundColor: `${s.color}12`, borderStyle: "solid" }}><Icon size={18} style={{  }} className="mx-auto mb-1" /><Text className="text-lg font-black text-white">{s.value}</Text><Text className="text-[10px] text-white/40">{s.label}</Text></View>
                  );
                })}
              </View>

              <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl p-4 mb-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
                <Text className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Modules préférés
                </Text>
                {prefs.favoriteModules.length > 0 ? (
                  <View className="flex gap-2 flex-wrap">{prefs.favoriteModules.slice(0, 8).map((mod) => (
                      <View key={mod} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: `${accentHex}15`, borderStyle: "solid" }}><Text>📱</Text>{mod.charAt(0).toUpperCase() + mod.slice(1)}</View>
                    ))}</View>
                ) : (
                  <Text className="text-white/30 text-xs italic">Aucun module favori — épinglez-en depuis le feed
                  </Text>
                )}
              </View>

              <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl p-4 mb-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
                <Text className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Badges & Réputation
                </Text>
                <View className="gap-2">{BADGES.map((b) => (
                    <View key={b.label} className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: `${b.color}12`, borderStyle: "solid" }}><Text className="text-lg">{b.icon}</Text><Text className="text-xs font-semibold text-white/70">{b.label}</Text></View>
                  ))}</View>
              </View>

              <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl p-4 mb-2" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
                <View className="flex items-center justify-between mb-3"><Text className="text-xs font-bold text-white/50 uppercase tracking-wider">Liens & Réseaux
                  </Text><Pressable className="text-xs" style={{  }} onPress={() => toast.info("Bientôt disponible !")}><Text>+ Ajouter</Text></Pressable></View>
                <View className="flex items-center gap-3 opacity-40"><View className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", borderStyle: "dashed" }}><Link2 size={14} className="text-white/40" /></View><Text className="text-xs text-white/40 italic">Aucun lien ajouté
                  </Text></View>
              </View>
            </View>
          )}{tab === "activite" && (
            <View key="activite" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <View className="rounded-2xl p-4 mb-4 flex items-center gap-4" style={{ backgroundColor: `${accentHex}15`, borderStyle: "solid" }}><View className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ backgroundColor: `${accentHex}20` }}><Text>🥉</Text></View><View><View className="text-white font-black text-xl">{total.toLocaleString()}<Text>XP</Text></View><View className="text-white/50 text-xs"><Text>Niveau</Text>{level}<Text>· Pro Débrouille</Text></View><View className="mt-1 flex gap-3 flex-wrap"><Pressable onPress={() => onNavigate("recompenses")} className="text-xs font-bold flex items-center gap-1" style={{  }}><Text>Mes récompenses</Text><ChevronRight size={11} /></Pressable><Pressable onPress={() => onNavigate("badges")} className="text-xs font-semibold flex items-center gap-1 text-indigo-400"><Text>Badges</Text><ChevronRight size={11} /></Pressable><Pressable onPress={() => onNavigate("analytics")} className="text-xs font-semibold flex items-center gap-1 text-emerald-400"><Text>Analytics</Text><ChevronRight size={11} /></Pressable></View></View></View>
              <ActivityTimeline accentHex={accentHex} />
            </View>
          )}{tab === "recents" && (
            <RecentsTab onNavigate={onNavigate} accentHex={accentHex} />
          )}{tab === "classement" && (
            <View key="classement" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Text className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Classement XP global
              </Text>
              {!leaderboard ? (
                <View className="space-y-2">{Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-2xl" />
                  ))}</View>
              ) : (
                <View className="space-y-2">{leaderboard.map((entry, i) => {
                    const rankEmoji =
                      i === 0
                        ? "🥇"
                        : i === 1
                          ? "🥈"
                          : i === 2
                            ? "🥉"
                            : `#${entry.rank}`;
                    const isMe = entry.name === displayName;
                    return (
                      <View key={entry.userId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={
                          isMe
                            ? { backgroundColor: `${accentHex}20`, borderStyle: "solid" }
                            : { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }
                        }>
                        <Text className="text-xl w-8 text-center flex-shrink-0">{rankEmoji}</Text>
                        <View className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0" style={{ backgroundColor: `${accentHex}25` }}>{entry.name.charAt(0).toUpperCase()}</View>
                        <View className="flex-1 min-w-0"><Text className="text-sm font-bold text-white/85 truncate">{entry.name}{isMe && (
                              <Text className="ml-1.5 text-[10px] font-black" style={{ color: accentHex }}>TOI
                              </Text>
                            )}</Text><Text className="text-[10px] text-white/35">Niveau {entry.level}</Text></View>
                        <View className="flex items-center gap-1 flex-shrink-0"><Zap size={11} className="text-amber-400" /><Text className="text-xs font-black text-amber-400">{entry.totalXp >= 1000
                              ? `${(entry.totalXp / 1000).toFixed(1)}k`
                              : entry.totalXp}</Text></View>
                      </View>
                    );
                  })}</View>
              )}
              {/* Streak ranking */}
              {myStreak && myStreak.currentStreak > 0 && (
                <View className="mt-4 px-4 py-3 rounded-2xl flex items-center gap-3" style={{ backgroundColor: "rgba(249,115,22,0.12)", borderWidth: 1, borderColor: "rgba(249,115,22,0.25)", borderStyle: "solid" }}><Flame size={20} className="text-orange-400 flex-shrink-0" /><View><Text className="text-sm font-black text-white">Ton streak : {myStreak.currentStreak}jours 🔥
                    </Text><Text className="text-[10px] text-white/40">Record personnel : {myStreak.longestStreak}jours
                    </Text></View></View>
              )}
            </View>
          )}</View></View><View>{showQR && (
          <QRCardModal
            onClose={() => setShowQR(false)}
            accentHex={accentHex}
            displayName={displayName}
            slug={slug}
          />
        )}</View><View>{showEdit && (
          <EditProfileSheet
            onClose={() => setShowEdit(false)}
            accentHex={accentHex}
          />
        )}</View></View>
  );
}

export default function ProfilePage(props: ProfilePageProps) {
  const { isAuthenticated } = useFirebaseAuth();

  if (!isAuthenticated) {
    return (
      <View className="h-full flex flex-col items-center justify-center px-8 gap-6" style={{  }}><Pressable onPress={props.onBack} className="absolute top-12 left-4 w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={18} className="text-white" /></Pressable><UserAvatar user={null} size="w-20 h-20" /><View className="text-center"><Text className="text-white font-black text-2xl mb-2">Mon Profil</Text><Text className="text-white/40 text-sm leading-relaxed">Connectez-vous pour voir et gérer votre profil
          </Text></View><SignInButton /></View>
    );
  }

  return <ProfilePageInner {...props} />;
}
