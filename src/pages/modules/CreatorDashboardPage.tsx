import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable } from "react-native";

// src/pages/modules/CreatorDashboardPage.tsx

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  TrendingUp,
  Eye,
  Heart,
  Users,
  BarChart2,
  Lightbulb,
  ChevronRight,
  MessageCircle,
  Zap,
  Gift,
  Flame,
  Crown,
  Play,
  Star,
  Sparkles,
  Award,
  Pencil,
  Clock,
  Trophy,
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInButton } from "@/components/ui/signin";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

// Imports modulaires du répertoire Creator-Hub
import type { Id } from "@/convex/_generated/dataModel";
import {
  StatCard,
  ActivityCalendar,
  PubRow,
  ChallengeCard,
} from "@/features/creator-hub";
import type { CreatorLevel } from "@/features/creator-hub";

// (Conservez la suite du fichier inchangée à partir d'ici)

const LEVELS: CreatorLevel[] = [
  {
    label: "Débutant",
    emoji: "🌱",
    color: "#9CA3AF",
    minFollowers: 0,
    minPubs: 0,
  },
  {
    label: "En herbe",
    emoji: "🌿",
    color: "#10B981",
    minFollowers: 10,
    minPubs: 5,
  },
  {
    label: "Montant",
    emoji: "⭐",
    color: "#6366F1",
    minFollowers: 100,
    minPubs: 20,
  },
  {
    label: "Confirmé",
    emoji: "🔥",
    color: "#F97316",
    minFollowers: 500,
    minPubs: 50,
  },
  {
    label: "Expert",
    emoji: "💎",
    color: "#8B5CF6",
    minFollowers: 2000,
    minPubs: 100,
  },
  {
    label: "Ambassadeur",
    emoji: "👑",
    color: "#F59E0B",
    minFollowers: 10000,
    minPubs: 200,
  },
];

function getLevel(followers: number, pubs: number): CreatorLevel {
  return (
    [...LEVELS]
      .reverse()
      .find((l) => followers >= l.minFollowers && pubs >= l.minPubs) ??
    LEVELS[0]
  );
}

function getNextLevel(followers: number, pubs: number): CreatorLevel | null {
  const current = getLevel(followers, pubs);
  const idx = LEVELS.findIndex((l) => l.label === current.label);
  return LEVELS[idx + 1] ?? null;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const TYPE_COLORS: Record<string, string> = {
  article: "#06B6D4",
  video: "#EF4444",
  sondage: "#A855F7",
  immo: "#10B981",
  job: "#8B5CF6",
  community: "#3B82F6",
};

const EARNING_ICONS: Record<string, React.ReactNode> = {
  gift: <Gift size={14} className="text-amber-400" />,
  super_chat: <Zap size={14} className="text-purple-400" />,
  boost: <TrendingUp size={14} className="text-blue-400" />,
  tip: <Heart size={14} className="text-pink-400" />,
};

const EARNING_LABELS: Record<string, string> = {
  gift: "Cadeau reçu",
  super_chat: "Super Chat",
  boost: "Boost pub",
  tip: "Pourboire",
};

const TREND_SUGGESTIONS = [
  {
    icon: "🎬",
    tag: "#Reels2025",
    desc: "Vidéos courtes < 60s — +320% d'engagement",
    color: "#EF4444",
  },
  {
    icon: "📝",
    tag: "#ArticleTech",
    desc: "Articles Tech en français très demandés",
    color: "#06B6D4",
  },
  {
    icon: "🏆",
    tag: "#Challenge",
    desc: "Rejoignez un challenge pour x10 visibilité",
    color: "#F59E0B",
  },
  {
    icon: "🌍",
    tag: "#AfricaRising",
    desc: "Contenu sur l'Afrique en forte tendance",
    color: "#10B981",
  },
  {
    icon: "💡",
    tag: "#Business2025",
    desc: "Conseils business, entrepreneuriat africain",
    color: "#8B5CF6",
  },
];

function CreatorHubInner({
  onBack,
  email,
}: {
  onBack: () => void;
  email: string;
}) {
  const [tab, setTab] = useState<
    "stats" | "publications" | "challenges" | "earnings"
  >("stats");

  const profile = useQuery(api.users.getMyProfile, {});
  const followStats = useQuery(
    api.follows.getMyFollowStats,
    email ? { email } : "skip",
  );
  const creatorStats = useQuery(
    api.publications.getMyCreatorStats,
    email ? { email } : "skip",
  );
  const videoAnalytics = useQuery(
    api.shortVideos.getMyAnalytics,
    email ? { email } : "skip",
  );
  const myParticipations = useQuery(
    api.creatorHub.getMyParticipations,
    email ? { email } : "skip",
  );
  const myEarnings = useQuery(
    api.creatorHub.getMyEarnings,
    email ? { email } : "skip",
  );

  const challenges = useQuery(api.creatorHub.listChallenges, {});

  const joinChallenge = useMutation(api.creatorHub.joinChallenge);
  const seedChallenges = useMutation(api.creatorHub.seedChallenges);

  useEffect(() => {
    seedChallenges({}).catch(() => null);
  }, [seedChallenges]);

  const isLoading =
    profile === undefined ||
    followStats === undefined ||
    creatorStats === undefined;

  const followerCount = followStats?.followerCount ?? 0;
  const pubCount = creatorStats?.publications.length ?? 0;
  const level = getLevel(followerCount, pubCount);
  const nextLevel = getNextLevel(followerCount, pubCount);
  const joinedIds = new Set((myParticipations ?? []).map((p) => p.challengeId));

  const handleJoin = async (challengeId: Id<"creatorChallenges">) => {
    try {
      await joinChallenge({ challengeId });
      UIService.openToast("Tu participes au challenge ! 🏆", "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur";
      UIService.openToast(msg.includes("Déjà inscrit") ? "Tu es déjà inscrit !" : msg, "error");
    }
  };

  const typeChartData = Object.entries(creatorStats?.typeBreakdown ?? {})
    .map(([type, count]) => ({
      name: type,
      count,
      color: TYPE_COLORS[type] ?? "#8B5CF6",
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <View
      className="h-full flex flex-col overflow-hidden"
      style={{  }}
    >
      {/* Header */}
      <View className="flex items-center gap-3 px-4 pt-12 pb-4 flex-shrink-0">
        <Pressable
          onPress={onBack}
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <ArrowLeft size={18} className="text-white" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-white font-black text-xl">Creator Hub</Text>
          <Text className="text-white/40 text-xs">Tableau de bord avancé</Text>
        </View>
        <View className="flex items-center gap-1.5">
          {creatorStats?.isActiveCreator && (
            <View
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
              style={{ backgroundColor: "rgba(245,158,11,0.18)", borderWidth: 1, borderColor: "rgba(245,158,11,0.35)", borderStyle: "solid" }}
            >
              <Star size={11} className="text-amber-400" fill="currentColor" />
              <Text className="text-amber-400 text-xs font-black">Actif</Text>
            </View>
          )}
          <View
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ backgroundColor: `${level.color}22`, borderStyle: "solid" }}
          >
            <Text className="text-lg">{level.emoji}</Text>
            <Text className="text-sm font-black" style={{ color: level.color }}>
              {level.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Creator card */}
      {!isLoading && (
        <View
          className="mx-4 mb-4 p-4 rounded-2xl relative overflow-hidden"
          style={{ borderStyle: "solid" }}
        >
          <View
            className="absolute top-0 right-0 w-32 h-32"
            style={{  }}
          />
          <View className="flex items-center gap-4 mb-3">
            <View
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: `${level.color}22` }}
            >
              {level.emoji}
            </View>
            <View className="flex-1">
              <Text className="text-white font-black text-lg">
                {profile?.name ?? "Créateur"}
              </Text>
              <View className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Text
                  className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ backgroundColor: `${level.color}22`, color: level.color }}
                >
                  {level.label}
                </Text>
                {creatorStats?.isActiveCreator && (
                  <Text
                    className="text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
                    style={{ backgroundColor: "rgba(245,158,11,0.2)", color: "#F59E0B" }}
                  >
                    <Award size={10} /> Créateur Actif
                  </Text>
                )}
                {followerCount >= 500 && (
                  <Text
                    className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ backgroundColor: "rgba(99,102,241,0.2)", color: "#818CF8" }}
                  >
                    Partenaire
                  </Text>
                )}
              </View>
            </View>
          </View>
          {nextLevel && (
            <View>
              <View className="flex items-center justify-between mb-1">
                <Text className="text-xs text-white/40">
                  Vers {nextLevel.emoji} {nextLevel.label}
                </Text>
                <Text
                  className="text-xs font-bold"
                  style={{ color: nextLevel.color }}
                >
                  {followerCount}/{nextLevel.minFollowers} abonnés
                </Text>
              </View>
              <View
                className="h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
              >
                <View
                  className="h-full rounded-full"
                  style={{  }}
                />
              </View>
            </View>
          )}
          <View className="gap-2 mt-3">
            {[
              { label: "Abonnés", value: followerCount, color: "#6366F1" },
              { label: "Pubs", value: pubCount, color: "#10B981" },
              {
                label: "Vues",
                value: creatorStats?.totalViews ?? 0,
                color: "#F59E0B",
              },
              {
                label: "Engagement",
                value: `${creatorStats?.engagementRate ?? 0}%`,
                color: "#EC4899",
              },
            ].map(({ label, value, color }) => (
              <View
                key={label}
                className="rounded-xl p-2 text-center"
                style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
              >
                <Text
                  className="text-sm font-black leading-tight"
                  style={{ color }}
                >
                  {typeof value === "number" ? fmt(value) : value}
                </Text>
                <Text className="text-white/35 text-[9px] mt-0.5">{label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Tabs */}
      <View
        className="flex gap-1 px-4 mb-4 flex-shrink-0 overflow-x-auto"
        style={{  }}
      >
        {[
          { id: "stats" as const, label: "Analytics", icon: BarChart2 },
          { id: "publications" as const, label: "Mes pubs", icon: Pencil },
          { id: "challenges" as const, label: "Challenges", icon: Trophy },
          { id: "earnings" as const, label: "Revenus", icon: Gift },
        ].map(({ id, label, icon: Icon }) => (
          <Pressable
            key={id}
            onPress={() => setTab(id)}
            className="flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold"
            style={
              tab === id
                ? {  }
                : { backgroundColor: "rgba(255,255,255,0.06)" }
            }
          >
            <Icon size={13} /> {label}
          </Pressable>
        ))}
      </View>

      <View
        className="flex-1 overflow-y-auto px-4 pb-8 space-y-4"
        style={{  }}
      >
        <>
          {/* ── Analytics tab ── */}
          {tab === "stats" && (
            <View
              key="stats"
              className="space-y-4"
            >
              {isLoading ? (
                <View className="gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 rounded-2xl" />
                  ))}
                </View>
              ) : (
                <>
                  <View className="gap-3">
                    <StatCard
                      label="Vues totales"
                      value={creatorStats?.totalViews ?? 0}
                      icon={<Eye size={18} />}
                      color="#6366f1"
                      sub="toutes publications"
                    />
                    <StatCard
                      label="Engagement"
                      value={`${creatorStats?.engagementRate ?? 0}%`}
                      icon={<TrendingUp size={18} />}
                      color="#10b981"
                    />
                    <StatCard
                      label="Likes reçus"
                      value={creatorStats?.totalLikes ?? 0}
                      icon={<Heart size={18} />}
                      color="#ec4899"
                    />
                    <StatCard
                      label="Commentaires"
                      value={creatorStats?.totalComments ?? 0}
                      icon={<MessageCircle size={18} />}
                      color="#f59e0b"
                    />
                  </View>

                  {/* Pubs cette semaine */}
                  <View
                    className="p-4 rounded-2xl flex items-center gap-4"
                    style={{ backgroundColor: creatorStats?.isActiveCreator
                                            ? "rgba(245,158,11,0.1)"
                                            : "rgba(255,255,255,0.04)", borderColor: "rgba(245,158,11,0.3)", borderStyle: "solid" }}
                  >
                    <View
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: creatorStats?.isActiveCreator
                                                ? "rgba(245,158,11,0.2)"
                                                : "rgba(255,255,255,0.06)" }}
                    >
                      {creatorStats?.isActiveCreator ? (
                        <Star
                          size={20}
                          className="text-amber-400"
                          fill="currentColor"
                        />
                      ) : (
                        <Flame size={20} className="text-white/40" />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-bold text-sm">
                        {creatorStats?.pubsThisWeek ?? 0} publication
                        {(creatorStats?.pubsThisWeek ?? 0) > 1 ? "s" : ""} cette
                        semaine
                      </Text>
                      <Text className="text-white/40 text-xs mt-0.5">
                        {creatorStats?.isActiveCreator
                          ? "✨ Badge Créateur Actif débloqué !"
                          : `Encore ${3 - (creatorStats?.pubsThisWeek ?? 0)} pub(s) pour le badge Actif`}
                      </Text>
                    </View>
                  </View>

                  {/* Activity calendar */}
                  {creatorStats?.recentActivity &&
                    creatorStats.recentActivity.length > 0 && (
                      <View
                        className="p-4 rounded-2xl"
                        style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
                      >
                        <ActivityCalendar data={creatorStats.recentActivity} />
                      </View>
                    )}

                  {/* Type breakdown chart */}
                  {typeChartData.length > 0 && (
                    <View
                      className="p-4 rounded-2xl"
                      style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
                    >
                      <Text className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <BarChart2 size={11} className="text-indigo-400" />{" "}
                        Répartition du contenu
                      </Text>
                      <View style={{ height: 100 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={typeChartData} barSize={22}>
                            <XAxis
                              dataKey="name"
                              tick={{
                                fill: "rgba(255,255,255,0.3)",
                                fontSize: 9,
                              }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                background: "#0a0a1a",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: 10,
                                color: "#fff",
                                fontSize: 11,
                              }}
                              cursor={{ fill: "rgba(255,255,255,0.04)" }}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {typeChartData.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </View>
                    </View>
                  )}

                  {/* Top publication */}
                  {creatorStats?.topPublication && (
                    <View
                      className="p-4 rounded-2xl"
                      style={{ backgroundColor: "rgba(99,102,241,0.08)", borderWidth: 1, borderColor: "rgba(99,102,241,0.2)", borderStyle: "solid" }}
                    >
                      <Text className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles size={11} className="text-indigo-400" />{" "}
                        Meilleure publication
                      </Text>
                      <Text className="text-white font-bold text-sm mb-2 truncate">
                        {creatorStats.topPublication.title}
                      </Text>
                      <View className="flex items-center gap-4">
                        <View className="flex items-center gap-1.5 text-white/50">
                          <Eye size={12} />
                          <Text className="text-xs">
                            {fmt(creatorStats.topPublication.viewCount)} vues
                          </Text>
                        </View>
                        <View className="flex items-center gap-1.5 text-white/50">
                          <Heart size={12} />
                          <Text className="text-xs">
                            {fmt(creatorStats.topPublication.likeCount)} likes
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Reels analytics */}
                  {videoAnalytics && videoAnalytics.videoCount > 0 && (
                    <View>
                      <Text className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Play size={11} className="text-amber-400" /> Mes Reels
                      </Text>
                      <View className="gap-2">
                        <StatCard
                          label="Vidéos"
                          value={videoAnalytics.videoCount}
                          icon={<Play size={16} />}
                          color="#06b6d4"
                        />
                        <StatCard
                          label="Vues"
                          value={videoAnalytics.totalViews}
                          icon={<Eye size={16} />}
                          color="#a78bfa"
                        />
                        <StatCard
                          label="Likes"
                          value={videoAnalytics.totalLikes}
                          icon={<Heart size={16} />}
                          color="#f87171"
                        />
                      </View>
                    </View>
                  )}

                  {/* Trend suggestions */}
                  <View>
                    <Text className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <TrendingUp size={11} className="text-pink-400" />{" "}
                      Tendances à exploiter
                    </Text>
                    {TREND_SUGGESTIONS.map((s, i) => (
                      <View
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-xl mb-2"
                        style={{ backgroundColor: `${s.color}0e`, borderStyle: "solid" }}
                      >
                        <Text className="text-xl">{s.icon}</Text>
                        <View className="flex-1 min-w-0">
                          <Text
                            className="font-bold text-xs"
                            style={{ color: s.color }}
                          >
                            {s.tag}
                          </Text>
                          <Text className="text-white/50 text-xs mt-0.5">
                            {s.desc}
                          </Text>
                        </View>
                        <ChevronRight size={14} style={{ color: s.color }} />
                      </View>
                    ))}
                  </View>

                  {/* Growth tips */}
                  <View>
                    <Text className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Lightbulb size={11} className="text-yellow-400" />{" "}
                      Conseils de croissance
                    </Text>
                    {[
                      {
                        icon: <Flame size={14} />,
                        text: "Publiez 3–5 fois/semaine → +40% de portée",
                        color: "#EF4444",
                      },
                      {
                        icon: <Heart size={14} />,
                        text: "Répondez aux commentaires dans les 30 min",
                        color: "#EC4899",
                      },
                      {
                        icon: <Clock size={14} />,
                        text: "Heures de pointe : 7h–9h et 18h–21h",
                        color: "#06B6D4",
                      },
                      {
                        icon: <Users size={14} />,
                        text: "Rejoignez un challenge pour x10 la visibilité",
                        color: "#10B981",
                      },
                    ].map((tip, i) => (
                      <View
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-xl mb-2"
                        style={{ backgroundColor: `${tip.color}0e`, borderStyle: "solid" }}
                      >
                        <View
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${tip.color}22` }}
                        >
                          {tip.icon}
                        </View>
                        <Text className="text-white/70 text-xs leading-relaxed">
                          {tip.text}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Partner badge */}
                  <View
                    className="p-4 rounded-2xl"
                    style={{ borderWidth: 1, borderColor: "rgba(245,158,11,0.25)", borderStyle: "solid" }}
                  >
                    <View className="flex items-center gap-3 mb-2">
                      <Crown size={20} className="text-amber-400" />
                      <View>
                        <Text className="text-white font-black">
                          Programme Partenaire
                        </Text>
                        <Text className="text-white/50 text-xs">
                          Débloque des revenus exclusifs avec 500+ abonnés
                        </Text>
                      </View>
                    </View>
                    <View
                      className="h-1.5 rounded-full overflow-hidden mb-2"
                      style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                    >
                      <View
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(100, (followerCount / 500) * 100)}%` }}
                      />
                    </View>
                    <Text className="text-amber-400/60 text-xs">
                      {followerCount}/500 abonnés requis
                    </Text>
                  </View>
                </>
              )}
            </View>
          )}

          {/* ── Mes publications tab ── */}
          {tab === "publications" && (
            <View
              key="publications"
              className="space-y-2"
            >
              <View className="flex items-center justify-between mb-2">
                <Text className="text-white/50 text-xs font-bold uppercase tracking-wider">
                  {pubCount} publication{pubCount > 1 ? "s" : ""}
                </Text>
              </View>
              {creatorStats === undefined ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))
              ) : (creatorStats.publications ?? []).length === 0 ? (
                <View className="flex flex-col items-center py-16 gap-3">
                  <Pencil size={36} className="text-white/20" />
                  <Text className="text-white/40 text-sm">
                    Aucune publication pour l'instant
                  </Text>
                  <Text className="text-white/25 text-xs text-center">
                    Commencez à créer pour voir vos stats ici !
                  </Text>
                </View>
              ) : (
                (creatorStats.publications ?? []).map((pub, i) => (
                  <View
                    key={pub._id}
                  >
                    <PubRow pub={pub as any} />
                  </View>
                ))
              )}
            </View>
          )}

          {/* ── Challenges tab ── */}
          {tab === "challenges" && (
            <View
              key="challenges"
              className="space-y-4"
            >
              <View className="flex items-center justify-between mb-1">
                <Text className="text-white/50 text-xs font-bold uppercase tracking-wider">
                  Challenges en cours
                </Text>
                {myParticipations && myParticipations.length > 0 && (
                  <Text className="text-xs font-bold text-indigo-400">
                    {myParticipations.length} inscrit
                    {myParticipations.length > 1 ? "s" : ""}
                  </Text>
                )}
              </View>
              {challenges === undefined ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 w-full rounded-2xl" />
                ))
              ) : challenges.length === 0 ? (
                <View className="flex flex-col items-center py-12 gap-3">
                  <Trophy size={36} className="text-white/20" />
                  <Text className="text-white/40 text-sm">Aucun challenge actif</Text>
                </View>
              ) : (
                challenges.map((c) => (
                  <ChallengeCard
                    key={c._id}
                    challenge={c as any}
                    joined={joinedIds.has(c._id as Id<"creatorChallenges">)}
                    onJoin={() =>
                      void handleJoin(c._id as Id<"creatorChallenges">)
                    }
                  />
                ))
              )}
            </View>
          )}

          {/* ── Earnings tab ── */}
          {tab === "earnings" && (
            <View
              key="earnings"
              className="space-y-4"
            >
              <View
                className="p-5 rounded-2xl relative overflow-hidden"
                style={{ borderWidth: 1, borderColor: "rgba(16,185,129,0.25)", borderStyle: "solid" }}
              >
                <View
                  className="absolute top-0 right-0 w-24 h-24"
                  style={{  }}
                />
                <View className="relative">
                  <Text className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
                    Solde total estimé
                  </Text>
                  <Text
                    className="text-4xl font-black mb-1"
                    style={{ WebkitBackgroundClip: "text" }}
                  >
                    {(myEarnings?.total ?? 0).toLocaleString()} FCFA
                  </Text>
                  <Text className="text-white/30 text-xs">
                    Mise à jour en temps réel
                  </Text>
                </View>
                {myEarnings && (
                  <View className="gap-2 mt-4">
                    {[
                      {
                        key: "gift",
                        label: "Cadeaux",
                        icon: "🎁",
                        color: "#F59E0B",
                      },
                      {
                        key: "super_chat",
                        label: "Super Chat",
                        icon: "⚡",
                        color: "#8B5CF6",
                      },
                      {
                        key: "boost",
                        label: "Boosts",
                        icon: "📈",
                        color: "#3B82F6",
                      },
                      {
                        key: "tip",
                        label: "Tips",
                        icon: "💝",
                        color: "#EC4899",
                      },
                    ].map(({ key, label, icon, color }) => (
                      <View
                        key={key}
                        className="rounded-xl p-3 flex items-center gap-2"
                        style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
                      >
                        <Text className="text-lg">{icon}</Text>
                        <View>
                          <Text className="text-white/40 text-[10px]">{label}</Text>
                          <Text className="font-black text-sm" style={{ color }}>
                            {(
                              myEarnings.byType[
                                key as keyof typeof myEarnings.byType
                              ] ?? 0
                            ).toLocaleString()}{" "}
                            F
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {myEarnings && myEarnings.recent.length > 0 ? (
                <View>
                  <Text className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Sparkles size={11} className="text-amber-400" />{" "}
                    Transactions récentes
                  </Text>
                  <View className="space-y-2">
                    {myEarnings.recent.map((e) => (
                      <View
                        key={e._id}
                        className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
                      >
                        <View
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                        >
                          {EARNING_ICONS[e.type] ?? (
                            <Gift size={14} className="text-white/50" />
                          )}
                        </View>
                        <View className="flex-1 min-w-0">
                          <Text className="text-white text-sm font-semibold">
                            {EARNING_LABELS[e.type] ?? e.type}
                          </Text>
                          <Text className="text-white/30 text-xs">
                            {format(parseISO(e.createdAt), "d MMM, HH:mm", {
                              locale: fr,
                            })}
                          </Text>
                        </View>
                        <Text className="text-green-400 font-black text-sm">
                          +{e.amount.toLocaleString()} F
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <View className="flex flex-col items-center py-10 gap-3">
                  <Gift size={36} className="text-white/20" />
                  <Text className="text-white/40 text-sm">
                    Aucun revenu pour l'instant
                  </Text>
                  <Text className="text-white/25 text-xs text-center">
                    Lancez des lives et recevez des cadeaux de vos fans !
                  </Text>
                </View>
              )}

              <View
                className="p-4 rounded-2xl"
                style={{ backgroundColor: "rgba(99,102,241,0.08)", borderWidth: 1, borderColor: "rgba(99,102,241,0.2)", borderStyle: "solid" }}
              >
                <View className="flex items-center gap-2 mb-3">
                  <Zap size={15} className="text-indigo-400" />
                  <Text className="text-white font-bold text-sm">
                    Comment gagner plus ?
                  </Text>
                </View>
                {[
                  "🎁 Activez les cadeaux lors de vos lives",
                  "⚡ Encouragez les Super Chats avec du contenu exclusif",
                  "🏆 Participez aux challenges pour gagner des prix",
                  "📈 Boostez vos publications pour plus de vues",
                ].map((tip) => (
                  <View key={tip} className="flex items-center gap-2 py-1">
                    <ChevronRight
                      size={12}
                      className="text-indigo-400 flex-shrink-0"
                    />
                    <Text className="text-white/60 text-xs">{tip}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      </View>
    </View>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function CreatorDashboardPage({
  onBack,
}: {
  onBack: () => void;
}) {
  const { isAuthenticated, user, loading } = useFirebaseAuth();
  const email = user?.email;

  if (loading) {
    return (
      <View className="h-full flex items-center justify-center bg-[#020617]">
        <Skeleton className="w-full h-full" />
      </View>
    );
  }

  if (!isAuthenticated || !email) {
    return (
      <View
        className="h-full flex flex-col items-center justify-center px-8 gap-6"
        style={{  }}
      >
        <Pressable
          onPress={onBack}
          className="absolute top-12 left-4 w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <ArrowLeft size={18} className="text-white" />
        </Pressable>
        <View
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{  }}
        >
          <Crown size={40} className="text-white" />
        </View>
        <View className="text-center">
          <Text className="text-white font-black text-2xl mb-2">Creator Hub</Text>
          <Text className="text-white/40 text-sm leading-relaxed">
            <Text>Accédez à vos analytics, participez aux challenges viraux et monétisez votre contenu.</Text></Text>
        </View>
        <SignInButton />
      </View>
    );
  }

  return <CreatorHubInner onBack={onBack} email={email} />;
}
