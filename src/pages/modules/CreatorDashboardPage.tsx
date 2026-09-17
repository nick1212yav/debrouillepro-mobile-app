// src/pages/modules/CreatorDashboardPage.tsx
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Award,
  BarChart2,
  ChevronRight,
  Clock,
  Crown,
  Eye,
  Flame,
  Gift,
  Heart,
  Lightbulb,
  MessageCircle,
  Pencil,
  Play,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { SignInButton } from "@/components/ui/signin.tsx";
import {
  ActivityCalendar,
  ChallengeCard,
  PubRow,
  StatCard,
} from "@/features/creator-hub";
import type { CreatorLevel } from "@/features/creator-hub";
import type { Id } from "@/convex/_generated/dataModel";

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

interface Props {
  onBack: () => void;
}

type TabId = "stats" | "publications" | "challenges" | "earnings";

type TypeChartPoint = {
  name: string;
  count: number;
  color: string;
};

/* ════════════════════════════════════════════════════════════════════════════
   LEVELS
   ════════════════════════════════════════════════════════════════════════════ */

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

/* ════════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ════════════════════════════════════════════════════════════════════════════ */

const T = {
  bg: "#07070C",
  card: "rgba(255,255,255,0.045)",
  cardUp: "rgba(255,255,255,0.075)",
  border: "rgba(255,255,255,0.08)",
  borderUp: "rgba(255,255,255,0.14)",
  text: "#FFFFFF",
  dim: "rgba(255,255,255,0.58)",
  faint: "rgba(255,255,255,0.32)",
  ghost: "rgba(255,255,255,0.18)",
  primary: "#8B5CF6",
  primarySoft: "#C4B5FD",
  amber: "#F59E0B",
  amberSoft: "#FCD34D",
  success: "#10B981",
  danger: "#EF4444",
  rose: "#FB7185",
  cyan: "#22D3EE",
} as const;

const TYPE_COLORS: Record<string, string> = {
  article: "#06B6D4",
  video: "#EF4444",
  sondage: "#A855F7",
  immo: "#10B981",
  job: "#8B5CF6",
  community: "#3B82F6",
};

const EARNING_LABELS: Record<string, string> = {
  gift: "Cadeau reçu",
  super_chat: "Super Chat",
  boost: "Boost pub",
  tip: "Pourboire",
};

const EARNING_ICONS: Record<string, React.ElementType> = {
  gift: Gift,
  super_chat: Zap,
  boost: TrendingUp,
  tip: Heart,
};

const EARNING_COLORS: Record<string, string> = {
  gift: "#F59E0B",
  super_chat: "#8B5CF6",
  boost: "#3B82F6",
  tip: "#EC4899",
};

const TREND_SUGGESTIONS = [
  {
    icon: "🎬",
    tag: "#Reels2025",
    desc: "Vidéos courtes < 60 s — +320 % d'engagement",
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
    desc: "Rejoins un challenge pour x10 visibilité",
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

const GROWTH_TIPS = [
  {
    icon: Flame,
    text: "Publie 3–5 fois/semaine → +40 % de portée",
    color: "#EF4444",
  },
  {
    icon: Heart,
    text: "Réponds aux commentaires dans les 30 min",
    color: "#EC4899",
  },
  {
    icon: Clock,
    text: "Heures de pointe : 7h–9h et 18h–21h",
    color: "#06B6D4",
  },
  {
    icon: Users,
    text: "Rejoins un challenge pour x10 la visibilité",
    color: "#10B981",
  },
];

const EARNINGS_TIPS = [
  "🎁 Active les cadeaux lors de tes lives",
  "⚡ Encourage les Super Chats avec du contenu exclusif",
  "🏆 Participe aux challenges pour gagner des prix",
  "📈 Booste tes publications pour plus de vues",
];

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "stats", label: "Analytics", icon: BarChart2 },
  { id: "publications", label: "Mes pubs", icon: Pencil },
  { id: "challenges", label: "Challenges", icon: Trophy },
  { id: "earnings", label: "Revenus", icon: Gift },
];

const SCREEN_W = Dimensions.get("window").width;

/* ════════════════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════════════════ */

function alpha(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatTransactionDate(iso: string): string {
  try {
    const d = new Date(iso);
    return (
      d.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      }) +
      ", " +
      d.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  } catch {
    return iso;
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   PRIMITIVES
   ════════════════════════════════════════════════════════════════════════════ */

function Skeleton({
  style,
}: {
  style?: React.ComponentProps<typeof Animated.View>["style"];
}) {
  const opacity = useRef(new Animated.Value(0.28)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.65,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.28,
          duration: 850,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={[
        {
          backgroundColor: "rgba(255,255,255,0.06)",
          borderRadius: 18,
          opacity,
        },
        style,
      ]}
    />
  );
}

function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Icon size={28} color={T.faint} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   NATIVE BAR CHART
   ════════════════════════════════════════════════════════════════════════════ */

function NativeBarChart({ data }: { data: TypeChartPoint[] }) {
  const [focused, setFocused] = useState<number | null>(null);
  const animations = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      60,
      animations.map((a) =>
        Animated.spring(a, {
          toValue: 1,
          useNativeDriver: false,
          friction: 6,
          tension: 80,
        }),
      ),
    ).start();
  }, [animations, data.length]);

  if (data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.count), 1);
  const chartHeight = 110;

  return (
    <View>
      <View
        style={{
          height: chartHeight,
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 10,
        }}
      >
        {data.map((point, i) => {
          const ratio = point.count / max;
          const barHeight =
            animations[i]?.interpolate({
              inputRange: [0, 1],
              outputRange: [4, Math.max(6, ratio * chartHeight)],
            }) ?? 6;

          const isFocused = focused === i;

          return (
            <Pressable
              key={i}
              onPressIn={() => setFocused(i)}
              onPressOut={() => setFocused(null)}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 8,
                height: chartHeight,
              }}
            >
              <Animated.View
                style={{
                  width: "100%",
                  height: barHeight,
                  borderRadius: 6,
                  backgroundColor: point.color,
                  opacity: isFocused ? 1 : 0.85,
                }}
              />
            </Pressable>
          );
        })}
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: 10,
          marginTop: 12,
        }}
      >
        {data.map((point, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <Text
              numberOfLines={1}
              style={{
                color: focused === i ? point.color : T.faint,
                fontSize: 9.5,
                fontWeight: "800",
                letterSpacing: 0.2,
              }}
            >
              {point.name}
            </Text>
            <Text
              style={{
                color: T.dim,
                fontSize: 10.5,
                fontWeight: "900",
                marginTop: 3,
              }}
            >
              {point.count}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   LEVEL HERO CARD
   ════════════════════════════════════════════════════════════════════════════ */

function LevelHeroCard({
  name,
  level,
  nextLevel,
  followerCount,
  pubCount,
  totalViews,
  engagementRate,
  isActiveCreator,
}: {
  name: string;
  level: CreatorLevel;
  nextLevel: CreatorLevel | null;
  followerCount: number;
  pubCount: number;
  totalViews: number;
  engagementRate: number;
  isActiveCreator: boolean;
}) {
  const progressWidth = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  const target = nextLevel
    ? Math.min(100, (followerCount / Math.max(1, nextLevel.minFollowers)) * 100)
    : 100;

  useEffect(() => {
    Animated.timing(progressWidth, {
      toValue: target,
      duration: 1100,
      useNativeDriver: false,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: false,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [target, progressWidth, glowOpacity]);

  const stats: { label: string; value: string; color: string }[] = [
    { label: "Abonnés", value: fmt(followerCount), color: "#818CF8" },
    { label: "Pubs", value: fmt(pubCount), color: "#34D399" },
    { label: "Vues", value: fmt(totalViews), color: T.amberSoft },
    { label: "Engagement", value: `${engagementRate}%`, color: "#F472B6" },
  ];

  return (
    <View
      style={[
        styles.heroCard,
        {
          borderColor: alpha(level.color, 0.32),
          backgroundColor: alpha(level.color, 0.06),
        },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.heroGlow,
          {
            backgroundColor: level.color,
            opacity: glowOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0.05, 0.14],
            }),
          },
        ]}
      />

      {/* Header */}
      <View style={styles.heroHeader}>
        <View
          style={[
            styles.heroLevelIcon,
            {
              backgroundColor: alpha(level.color, 0.2),
              borderColor: alpha(level.color, 0.4),
            },
          ]}
        >
          <Text style={{ fontSize: 30 }}>{level.emoji}</Text>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={styles.heroName}>
            {name}
          </Text>
          <View style={styles.heroBadgesRow}>
            <View
              style={[
                styles.heroBadge,
                {
                  backgroundColor: alpha(level.color, 0.2),
                  borderColor: alpha(level.color, 0.4),
                },
              ]}
            >
              <Text style={[styles.heroBadgeText, { color: level.color }]}>
                {level.label}
              </Text>
            </View>

            {isActiveCreator && (
              <View
                style={[
                  styles.heroBadge,
                  {
                    backgroundColor: alpha(T.amber, 0.18),
                    borderColor: alpha(T.amber, 0.4),
                  },
                ]}
              >
                <Award size={10} color={T.amberSoft} />
                <Text style={[styles.heroBadgeText, { color: T.amberSoft }]}>
                  Créateur actif
                </Text>
              </View>
            )}

            {followerCount >= 500 && (
              <View
                style={[
                  styles.heroBadge,
                  {
                    backgroundColor: alpha("#818CF8", 0.18),
                    borderColor: alpha("#818CF8", 0.4),
                  },
                ]}
              >
                <Crown size={10} color="#A5B4FC" />
                <Text style={[styles.heroBadgeText, { color: "#A5B4FC" }]}>
                  Partenaire
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Progression vers niveau suivant */}
      {nextLevel && (
        <View style={{ marginTop: 18, gap: 8 }}>
          <View style={styles.heroProgressHeader}>
            <Text style={styles.heroProgressLabel}>
              Vers {nextLevel.emoji} {nextLevel.label}
            </Text>
            <Text
              style={[styles.heroProgressValue, { color: nextLevel.color }]}
            >
              {followerCount}/{nextLevel.minFollowers} abonnés
            </Text>
          </View>
          <View style={styles.heroProgressTrack}>
            <Animated.View
              style={[
                styles.heroProgressFill,
                {
                  backgroundColor: nextLevel.color,
                  width: progressWidth.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Stats */}
      <View style={styles.heroStatsGrid}>
        {stats.map((s) => (
          <View key={s.label} style={styles.heroStatBox}>
            <Text
              numberOfLines={1}
              style={[styles.heroStatValue, { color: s.color }]}
            >
              {s.value}
            </Text>
            <Text style={styles.heroStatLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB — STATS
   ════════════════════════════════════════════════════════════════════════════ */

function StatsTab({
  creatorStats,
  videoAnalytics,
  typeChartData,
  followerCount,
  isLoading,
}: {
  creatorStats: any;
  videoAnalytics: any;
  typeChartData: TypeChartPoint[];
  followerCount: number;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <View style={{ gap: 12 }}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} style={{ height: 88, borderRadius: 20 }} />
        ))}
      </View>
    );
  }

  const pubsThisWeek = creatorStats?.pubsThisWeek ?? 0;
  const isActive = creatorStats?.isActiveCreator;

  return (
    <View style={{ gap: 18 }}>
      {/* Stat cards */}
      <View style={{ gap: 12 }}>
        <StatCard
          label="Vues totales"
          value={creatorStats?.totalViews ?? 0}
          icon={<Eye size={18} />}
          color="#818CF8"
          sub="toutes publications"
        />
        <StatCard
          label="Engagement"
          value={`${creatorStats?.engagementRate ?? 0}%`}
          icon={<TrendingUp size={18} />}
          color="#34D399"
        />
        <StatCard
          label="Likes reçus"
          value={creatorStats?.totalLikes ?? 0}
          icon={<Heart size={18} />}
          color="#F472B6"
        />
        <StatCard
          label="Commentaires"
          value={creatorStats?.totalComments ?? 0}
          icon={<MessageCircle size={18} />}
          color={T.amberSoft}
        />
      </View>

      {/* Pubs cette semaine */}
      <View
        style={[
          styles.weekCard,
          {
            backgroundColor: isActive
              ? alpha(T.amber, 0.08)
              : "rgba(255,255,255,0.04)",
            borderColor: isActive ? alpha(T.amber, 0.3) : T.border,
          },
        ]}
      >
        <View
          style={[
            styles.weekIcon,
            {
              backgroundColor: isActive
                ? alpha(T.amber, 0.18)
                : "rgba(255,255,255,0.05)",
            },
          ]}
        >
          {isActive ? (
            <Star size={20} color={T.amberSoft} fill={T.amberSoft} />
          ) : (
            <Flame size={20} color={T.faint} />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.weekTitle}>
            {pubsThisWeek} publication{pubsThisWeek > 1 ? "s" : ""} cette
            semaine
          </Text>
          <Text style={styles.weekSubtitle}>
            {isActive
              ? "✨ Badge Créateur Actif débloqué !"
              : `Encore ${Math.max(0, 3 - pubsThisWeek)} pub(s) pour le badge Actif`}
          </Text>
        </View>
      </View>

      {/* Activity calendar */}
      {creatorStats?.recentActivity &&
        creatorStats.recentActivity.length > 0 && (
          <View style={styles.sectionCard}>
            <ActivityCalendar data={creatorStats.recentActivity} />
          </View>
        )}

      {/* Native bar chart */}
      {typeChartData.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHead}>
            <View
              style={[
                styles.sectionIcon,
                { backgroundColor: alpha("#818CF8", 0.15) },
              ]}
            >
              <BarChart2 size={13} color="#A5B4FC" />
            </View>
            <Text style={styles.sectionTitle}>Répartition du contenu</Text>
          </View>
          <View style={{ marginTop: 16 }}>
            <NativeBarChart data={typeChartData} />
          </View>
        </View>
      )}

      {/* Top publication */}
      {creatorStats?.topPublication && (
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: alpha(T.primary, 0.07),
              borderColor: alpha(T.primary, 0.24),
            },
          ]}
        >
          <View style={styles.sectionHead}>
            <View
              style={[
                styles.sectionIcon,
                { backgroundColor: alpha(T.primary, 0.18) },
              ]}
            >
              <Sparkles size={13} color={T.primarySoft} />
            </View>
            <Text style={styles.sectionTitle}>Meilleure publication</Text>
          </View>
          <Text numberOfLines={1} style={styles.topPubTitle}>
            {creatorStats.topPublication.title}
          </Text>
          <View style={styles.topPubStats}>
            <View style={styles.topPubStat}>
              <Eye size={12} color={T.faint} />
              <Text style={styles.topPubStatText}>
                {fmt(creatorStats.topPublication.viewCount)} vues
              </Text>
            </View>
            <View style={styles.topPubStat}>
              <Heart size={12} color={T.rose} />
              <Text style={[styles.topPubStatText, { color: T.rose }]}>
                {fmt(creatorStats.topPublication.likeCount)} likes
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Reels analytics */}
      {videoAnalytics && videoAnalytics.videoCount > 0 && (
        <View style={{ gap: 12 }}>
          <View style={styles.sectionHead}>
            <View
              style={[
                styles.sectionIcon,
                { backgroundColor: alpha(T.amber, 0.15) },
              ]}
            >
              <Play size={13} color={T.amberSoft} />
            </View>
            <Text style={styles.sectionTitle}>Mes Reels</Text>
          </View>
          <View style={{ gap: 10 }}>
            <StatCard
              label="Vidéos publiées"
              value={videoAnalytics.videoCount}
              icon={<Play size={16} />}
              color={T.cyan}
            />
            <StatCard
              label="Vues Reels"
              value={videoAnalytics.totalViews}
              icon={<Eye size={16} />}
              color="#A78BFA"
            />
            <StatCard
              label="Likes Reels"
              value={videoAnalytics.totalLikes}
              icon={<Heart size={16} />}
              color={T.rose}
            />
          </View>
        </View>
      )}

      {/* Trend suggestions */}
      <View style={{ gap: 12 }}>
        <View style={styles.sectionHead}>
          <View
            style={[
              styles.sectionIcon,
              { backgroundColor: alpha(T.rose, 0.15) },
            ]}
          >
            <TrendingUp size={13} color={T.rose} />
          </View>
          <Text style={styles.sectionTitle}>Tendances à exploiter</Text>
        </View>

        {TREND_SUGGESTIONS.map((s, i) => (
          <Pressable
            key={i}
            style={({ pressed }) => [
              styles.trendCard,
              {
                backgroundColor: alpha(s.color, 0.07),
                borderColor: alpha(s.color, 0.22),
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={{ fontSize: 22 }}>{s.icon}</Text>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.trendTag, { color: s.color }]}>{s.tag}</Text>
              <Text numberOfLines={2} style={styles.trendDesc}>
                {s.desc}
              </Text>
            </View>
            <ChevronRight size={14} color={T.faint} />
          </Pressable>
        ))}
      </View>

      {/* Growth tips */}
      <View style={{ gap: 12 }}>
        <View style={styles.sectionHead}>
          <View
            style={[
              styles.sectionIcon,
              { backgroundColor: alpha(T.amber, 0.15) },
            ]}
          >
            <Lightbulb size={13} color={T.amberSoft} />
          </View>
          <Text style={styles.sectionTitle}>Conseils de croissance</Text>
        </View>

        {GROWTH_TIPS.map((tip, i) => {
          const Icon = tip.icon;
          return (
            <View
              key={i}
              style={[
                styles.tipCard,
                {
                  backgroundColor: alpha(tip.color, 0.07),
                  borderColor: alpha(tip.color, 0.2),
                },
              ]}
            >
              <View
                style={[
                  styles.tipIcon,
                  { backgroundColor: alpha(tip.color, 0.16) },
                ]}
              >
                <Icon size={14} color={tip.color} />
              </View>
              <Text style={styles.tipText}>{tip.text}</Text>
            </View>
          );
        })}
      </View>

      {/* Partner program */}
      <View style={styles.partnerCard}>
        <View style={styles.partnerHead}>
          <View
            style={[
              styles.sectionIcon,
              { backgroundColor: alpha(T.amber, 0.16) },
            ]}
          >
            <Crown size={14} color={T.amberSoft} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.partnerTitle}>Programme Partenaire</Text>
            <Text style={styles.partnerSubtitle}>
              Débloque des revenus exclusifs avec 500+ abonnés
            </Text>
          </View>
        </View>
        <View style={{ marginTop: 14 }}>
          <View style={styles.partnerTrack}>
            <View
              style={[
                styles.partnerFill,
                {
                  width: `${Math.min(100, (followerCount / 500) * 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.partnerProgress}>
            {followerCount}/500 abonnés requis
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB — PUBLICATIONS
   ════════════════════════════════════════════════════════════════════════════ */

function PublicationsTab({
  creatorStats,
  pubCount,
}: {
  creatorStats: any;
  pubCount: number;
}) {
  return (
    <View style={{ gap: 12 }}>
      <View style={styles.sectionHead}>
        <View
          style={[
            styles.sectionIcon,
            { backgroundColor: alpha(T.success, 0.15) },
          ]}
        >
          <Pencil size={13} color="#34D399" />
        </View>
        <Text style={styles.sectionTitle}>
          {pubCount} publication{pubCount > 1 ? "s" : ""}
        </Text>
      </View>

      {creatorStats === undefined ? (
        <View style={{ gap: 10 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} style={{ height: 68, borderRadius: 18 }} />
          ))}
        </View>
      ) : (creatorStats.publications ?? []).length === 0 ? (
        <EmptyState
          icon={Pencil}
          title="Aucune publication"
          message="Commence à créer pour voir tes stats ici."
        />
      ) : (
        <View style={{ gap: 10 }}>
          {(creatorStats.publications ?? []).map((pub: any) => (
            <PubRow key={pub._id} pub={pub} />
          ))}
        </View>
      )}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB — CHALLENGES
   ════════════════════════════════════════════════════════════════════════════ */

function ChallengesTab({
  challenges,
  joinedIds,
  participationsCount,
  onJoin,
}: {
  challenges: any[] | undefined;
  joinedIds: Set<string>;
  participationsCount: number;
  onJoin: (id: Id<"creatorChallenges">) => void;
}) {
  return (
    <View style={{ gap: 14 }}>
      <View style={styles.challengesHead}>
        <View style={styles.sectionHead}>
          <View
            style={[
              styles.sectionIcon,
              { backgroundColor: alpha(T.amber, 0.15) },
            ]}
          >
            <Trophy size={13} color={T.amberSoft} />
          </View>
          <Text style={styles.sectionTitle}>Challenges en cours</Text>
        </View>

        {participationsCount > 0 && (
          <View style={styles.joinedPill}>
            <Text style={styles.joinedPillText}>
              {participationsCount} inscrit
              {participationsCount > 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </View>

      {challenges === undefined ? (
        <View style={{ gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} style={{ height: 220, borderRadius: 22 }} />
          ))}
        </View>
      ) : challenges.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Aucun challenge actif"
          message="De nouveaux défis apparaîtront bientôt."
        />
      ) : (
        <View style={{ gap: 12 }}>
          {challenges.map((c) => (
            <ChallengeCard
              key={c._id}
              challenge={c}
              joined={joinedIds.has(c._id as string)}
              onJoin={() => onJoin(c._id as Id<"creatorChallenges">)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB — EARNINGS
   ════════════════════════════════════════════════════════════════════════════ */

function EarningsTab({ myEarnings }: { myEarnings: any }) {
  if (myEarnings === undefined) {
    return (
      <View style={{ gap: 14 }}>
        <Skeleton style={{ height: 200, borderRadius: 26 }} />
        <Skeleton style={{ height: 80, borderRadius: 18 }} />
        <Skeleton style={{ height: 80, borderRadius: 18 }} />
      </View>
    );
  }

  const byTypeKeys = ["gift", "super_chat", "boost", "tip"] as const;

  return (
    <View style={{ gap: 18 }}>
      {/* Solde */}
      <View style={styles.balanceCard}>
        <View pointerEvents="none" style={styles.balanceGlow} />
        <Text style={styles.balanceLabel}>SOLDE TOTAL ESTIMÉ</Text>
        <Text style={styles.balanceValue}>
          {(myEarnings?.total ?? 0).toLocaleString()}
          <Text style={styles.balanceValueUnit}> FCFA</Text>
        </Text>
        <Text style={styles.balanceSub}>Mise à jour en temps réel</Text>

        <View style={styles.balanceBreakdown}>
          {byTypeKeys.map((key) => {
            const Icon = EARNING_ICONS[key] ?? Gift;
            const color = EARNING_COLORS[key] ?? T.primarySoft;
            const amount = myEarnings?.byType?.[key] ?? 0;
            return (
              <View key={key} style={styles.balanceRow}>
                <View
                  style={[
                    styles.balanceRowIcon,
                    { backgroundColor: alpha(color, 0.16) },
                  ]}
                >
                  <Icon size={14} color={color} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.balanceRowLabel}>
                    {EARNING_LABELS[key]}
                  </Text>
                </View>
                <Text style={[styles.balanceRowAmount, { color }]}>
                  {amount.toLocaleString()} F
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Transactions récentes */}
      {myEarnings?.recent && myEarnings.recent.length > 0 ? (
        <View style={{ gap: 12 }}>
          <View style={styles.sectionHead}>
            <View
              style={[
                styles.sectionIcon,
                { backgroundColor: alpha(T.amber, 0.15) },
              ]}
            >
              <Sparkles size={13} color={T.amberSoft} />
            </View>
            <Text style={styles.sectionTitle}>Transactions récentes</Text>
          </View>

          <View style={{ gap: 8 }}>
            {myEarnings.recent.map((e: any) => {
              const Icon = EARNING_ICONS[e.type] ?? Gift;
              const color = EARNING_COLORS[e.type] ?? T.primarySoft;
              return (
                <View key={e._id} style={styles.transactionRow}>
                  <View
                    style={[
                      styles.transactionIcon,
                      { backgroundColor: alpha(color, 0.16) },
                    ]}
                  >
                    <Icon size={15} color={color} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={styles.transactionLabel}>
                      {EARNING_LABELS[e.type] ?? e.type}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatTransactionDate(e.createdAt)}
                    </Text>
                  </View>
                  <Text style={styles.transactionAmount}>
                    +{e.amount.toLocaleString()} F
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : (
        <EmptyState
          icon={Gift}
          title="Aucun revenu pour l'instant"
          message="Lance des lives et reçois des cadeaux de tes fans !"
        />
      )}

      {/* Tips */}
      <View style={styles.earningsTips}>
        <View style={styles.sectionHead}>
          <View
            style={[
              styles.sectionIcon,
              { backgroundColor: alpha(T.primary, 0.15) },
            ]}
          >
            <Zap size={13} color={T.primarySoft} />
          </View>
          <Text style={styles.sectionTitle}>Comment gagner plus ?</Text>
        </View>
        <View style={{ gap: 8, marginTop: 12 }}>
          {EARNINGS_TIPS.map((tip) => (
            <View key={tip} style={styles.earningsTipRow}>
              <ChevronRight
                size={13}
                color={T.primarySoft}
                style={{ flexShrink: 0 }}
              />
              <Text style={styles.earningsTipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   INNER — Creator Hub
   ════════════════════════════════════════════════════════════════════════════ */

function CreatorHubInner({
  onBack,
  email,
}: {
  onBack: () => void;
  email: string;
}) {
  const [tab, setTab] = useState<TabId>("stats");
  const [refreshing, setRefreshing] = useState(false);

  const panelOpacity = useRef(new Animated.Value(1)).current;
  const panelTranslate = useRef(new Animated.Value(0)).current;

  /* Queries */
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
    api.analytics.getMyAnalytics,
    email ? {} : "skip",
  );
  const myParticipations = useQuery(
    api.creatorHub.getMyParticipations,
    email ? { email } : "skip",
  );
  const myEarnings = useQuery(
    api.creatorHub.getMyEarnings,
    email ? { email } : "skip",
  );
  const challengesRaw = useQuery(api.creatorHub.listChallenges, {});

  /* Mutations */
  const joinChallenge = useMutation(api.creatorHub.joinChallenge);
  const seedChallenges = useMutation(api.creatorHub.seedChallenges);

  /* Seed une seule fois */
  const seededRef = useRef(false);
  useEffect(() => {
    if (!seededRef.current) {
      seededRef.current = true;
      seedChallenges({}).catch(() => {
        seededRef.current = false;
      });
    }
  }, [seedChallenges]);

  /* Dérivés */
  const isLoading =
    profile === undefined ||
    followStats === undefined ||
    creatorStats === undefined;

  const followerCount = followStats?.followerCount ?? 0;
  const pubCount = creatorStats?.publications?.length ?? 0;
  const level = getLevel(followerCount, pubCount);
  const nextLevel = getNextLevel(followerCount, pubCount);

  const joinedIds = useMemo(
    () =>
      new Set(
        (myParticipations ?? []).map(
          (p: { challengeId: string }) => p.challengeId,
        ),
      ),
    [myParticipations],
  );

  const typeChartData: TypeChartPoint[] = useMemo(
    () =>
      Object.entries(
        (creatorStats?.typeBreakdown ?? {}) as Record<string, number>,
      )
        .map(([type, count]) => ({
          name: type,
          count,
          color: TYPE_COLORS[type] ?? T.primary,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
    [creatorStats?.typeBreakdown],
  );

  /* Handlers */
  const handleJoin = useCallback(
    async (challengeId: Id<"creatorChallenges">) => {
      try {
        await joinChallenge({ challengeId });
        toast.success("Tu participes au challenge ! 🏆");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur";
        toast.error(
          msg.includes("Déjà inscrit") ? "Tu es déjà inscrit !" : msg,
        );
      }
    },
    [joinChallenge],
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const switchTab = useCallback(
    (next: TabId) => {
      if (next === tab) return;
      Animated.parallel([
        Animated.timing(panelOpacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(panelTranslate, {
          toValue: 6,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTab(next);
        Animated.parallel([
          Animated.timing(panelOpacity, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(panelTranslate, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [tab, panelOpacity, panelTranslate],
  );

  /* ── Rendu ─────────────────────────────────────────────────────────── */
  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.glow} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <ArrowLeft size={18} color="#fff" />
          </Pressable>

          <View style={{ flex: 1, minWidth: 0 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 7 }}
            >
              <Crown size={16} color={T.amberSoft} />
              <Text style={styles.title}>Creator Hub</Text>
            </View>
            <Text style={styles.subtitle}>Tableau de bord avancé</Text>
          </View>

          <View
            style={[
              styles.levelPill,
              {
                backgroundColor: alpha(level.color, 0.18),
                borderColor: alpha(level.color, 0.4),
              },
            ]}
          >
            <Text style={styles.levelEmoji}>{level.emoji}</Text>
            <Text style={[styles.levelLabel, { color: level.color }]}>
              {level.label}
            </Text>
          </View>
        </View>

        {/* Hero card */}
        {!isLoading && (
          <View style={{ marginTop: 18 }}>
            <LevelHeroCard
              name={profile?.name ?? "Créateur"}
              level={level}
              nextLevel={nextLevel}
              followerCount={followerCount}
              pubCount={pubCount}
              totalViews={creatorStats?.totalViews ?? 0}
              engagementRate={creatorStats?.engagementRate ?? 0}
              isActiveCreator={!!creatorStats?.isActiveCreator}
            />
          </View>
        )}

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 20, paddingTop: 18 }}
          style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <Pressable
                key={id}
                onPress={() => switchTab(id)}
                style={({ pressed }) => [
                  styles.tabPill,
                  active && styles.tabPillActive,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Icon size={13} color={active ? "#fff" : T.faint} />
                <Text
                  style={[
                    styles.tabPillText,
                    active && { color: "#fff", fontWeight: "900" },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={T.primarySoft}
            colors={[T.primary]}
          />
        }
      >
        <Animated.View
          style={{
            opacity: panelOpacity,
            transform: [{ translateY: panelTranslate }],
          }}
        >
          {tab === "stats" && (
            <StatsTab
              creatorStats={creatorStats}
              videoAnalytics={videoAnalytics}
              typeChartData={typeChartData}
              followerCount={followerCount}
              isLoading={isLoading}
            />
          )}

          {tab === "publications" && (
            <PublicationsTab creatorStats={creatorStats} pubCount={pubCount} />
          )}

          {tab === "challenges" && (
            <ChallengesTab
              challenges={challengesRaw as any[] | undefined}
              joinedIds={joinedIds as Set<string>}
              participationsCount={myParticipations?.length ?? 0}
              onJoin={handleJoin}
            />
          )}

          {tab === "earnings" && <EarningsTab myEarnings={myEarnings} />}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   EXPORT — auth gates
   ════════════════════════════════════════════════════════════════════════════ */

export default function CreatorDashboardPage({ onBack }: Props) {
  const { isAuthenticated, user, loading } = useFirebaseAuth();
  const email = user?.email;

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator size="small" color={T.primarySoft} />
      </View>
    );
  }

  if (!isAuthenticated || !email) {
    return (
      <View style={styles.root}>
        <View pointerEvents="none" style={styles.glow} />
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <ArrowLeft size={18} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.authGate}>
          <View style={styles.authIcon}>
            <Crown size={34} color={T.amberSoft} />
          </View>
          <Text style={styles.authTitle}>Creator Hub</Text>
          <Text style={styles.authText}>
            Accède à tes analytics, participe aux challenges viraux et monétise
            ton contenu.
          </Text>
          <View style={{ marginTop: 10 }}>
            <SignInButton />
          </View>
        </View>
      </View>
    );
  }

  return <CreatorHubInner onBack={onBack} email={email} />;
}

/* ════════════════════════════════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  center: { alignItems: "center", justifyContent: "center" },

  glow: {
    position: "absolute",
    top: -150,
    left: -80,
    right: -80,
    height: 320,
    borderRadius: 220,
    backgroundColor: alpha(T.primary, 0.1),
  },

  /* Header */
  header: { paddingTop: 56, paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: T.border,
  },
  title: {
    color: T.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: { color: T.faint, fontSize: 11.5, marginTop: 2 },
  levelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  levelEmoji: { fontSize: 14 },
  levelLabel: { fontSize: 11.5, fontWeight: "900", letterSpacing: -0.2 },

  /* Hero card */
  heroCard: {
    padding: 18,
    borderRadius: 26,
    borderWidth: 1,
    overflow: "hidden",
    gap: 16,
  },
  heroGlow: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 200,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  heroLevelIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  heroName: {
    color: T.text,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  heroBadgesRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
    flexWrap: "wrap",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  heroBadgeText: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  heroProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroProgressLabel: {
    color: T.dim,
    fontSize: 11.5,
    fontWeight: "700",
  },
  heroProgressValue: {
    fontSize: 11.5,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  heroProgressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  heroProgressFill: {
    height: "100%",
    borderRadius: 999,
  },
  heroStatsGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  heroStatBox: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.32)",
    alignItems: "center",
    gap: 4,
  },
  heroStatValue: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  heroStatLabel: {
    color: T.faint,
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  /* Tabs */
  tabPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: T.border,
  },
  tabPillActive: {
    backgroundColor: T.primary,
    borderColor: alpha(T.primary, 0.7),
  },
  tabPillText: {
    color: T.faint,
    fontSize: 12.5,
    fontWeight: "700",
  },

  /* Content */
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 60,
  },

  /* Section */
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: T.text,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.2,
    flex: 1,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },

  /* Week card */
  weekCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
  },
  weekIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  weekTitle: {
    color: T.text,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  weekSubtitle: {
    color: T.faint,
    fontSize: 11.5,
    marginTop: 4,
    fontWeight: "600",
  },

  /* Top pub */
  topPubTitle: {
    color: T.text,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
    marginTop: 12,
  },
  topPubStats: {
    flexDirection: "row",
    gap: 16,
    marginTop: 10,
  },
  topPubStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  topPubStatText: {
    color: T.faint,
    fontSize: 12,
    fontWeight: "700",
  },

  /* Trend */
  trendCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  trendTag: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: -0.1,
  },
  trendDesc: {
    color: T.dim,
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 4,
    fontWeight: "600",
  },

  /* Tip */
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  tipIcon: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  tipText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12.5,
    lineHeight: 18,
    flex: 1,
    fontWeight: "600",
  },

  /* Partner */
  partnerCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: alpha(T.amber, 0.06),
    borderWidth: 1,
    borderColor: alpha(T.amber, 0.24),
  },
  partnerHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  partnerTitle: {
    color: T.text,
    fontSize: 14.5,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  partnerSubtitle: {
    color: T.faint,
    fontSize: 11.5,
    marginTop: 3,
    fontWeight: "600",
  },
  partnerTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  partnerFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: T.amber,
  },
  partnerProgress: {
    color: alpha(T.amberSoft, 0.7),
    fontSize: 11,
    fontWeight: "800",
    marginTop: 8,
  },

  /* Challenges head */
  challengesHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  joinedPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: alpha(T.primary, 0.16),
    borderWidth: 1,
    borderColor: alpha(T.primary, 0.32),
  },
  joinedPillText: {
    color: T.primarySoft,
    fontSize: 10.5,
    fontWeight: "900",
  },

  /* Balance */
  balanceCard: {
    padding: 22,
    borderRadius: 26,
    backgroundColor: alpha(T.success, 0.06),
    borderWidth: 1,
    borderColor: alpha(T.success, 0.24),
    overflow: "hidden",
    gap: 6,
  },
  balanceGlow: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 180,
    backgroundColor: T.success,
    opacity: 0.12,
  },
  balanceLabel: {
    color: T.faint,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  balanceValue: {
    color: "#34D399",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1.2,
    marginTop: 4,
  },
  balanceValueUnit: {
    color: alpha(T.success, 0.75),
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  balanceSub: {
    color: T.ghost,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  balanceBreakdown: {
    gap: 8,
    marginTop: 18,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  balanceRowIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceRowLabel: {
    color: T.dim,
    fontSize: 12.5,
    fontWeight: "700",
  },
  balanceRowAmount: {
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: -0.2,
  },

  /* Transactions */
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  transactionLabel: {
    color: T.text,
    fontSize: 13,
    fontWeight: "700",
  },
  transactionDate: {
    color: T.faint,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
  },
  transactionAmount: {
    color: "#34D399",
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: -0.2,
  },

  /* Earnings tips */
  earningsTips: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: alpha(T.primary, 0.07),
    borderWidth: 1,
    borderColor: alpha(T.primary, 0.22),
  },
  earningsTipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  earningsTipText: {
    color: T.dim,
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
    lineHeight: 17,
  },

  /* Empty */
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 14,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: T.border,
  },
  emptyTitle: {
    color: T.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  emptyMessage: {
    color: T.faint,
    fontSize: 12.5,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 18,
  },

  /* Auth gate */
  authGate: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 14,
  },
  authIcon: {
    width: 82,
    height: 82,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.amber, 0.14),
    borderWidth: 1,
    borderColor: alpha(T.amber, 0.32),
    marginBottom: 6,
  },
  authTitle: {
    color: T.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  authText: {
    color: T.dim,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 300,
  },
});
