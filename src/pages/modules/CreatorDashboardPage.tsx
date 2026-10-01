// src/pages/modules/CreatorDashboardPage.tsx

import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ElementType } from "react";

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
import type { FunctionReturnType } from "convex/server";

import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel";

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

type CreatorStats = FunctionReturnType<
  typeof api.publications.getMyCreatorStats
>;

type VideoAnalytics = FunctionReturnType<typeof api.analytics.getMyAnalytics>;

type ChallengesResult = FunctionReturnType<
  typeof api.creatorHub.listChallenges
>;

type ParticipationsResult = FunctionReturnType<
  typeof api.creatorHub.getMyParticipations
>;

type EarningsResult = FunctionReturnType<typeof api.creatorHub.getMyEarnings>;

type Challenge = ChallengesResult extends readonly (infer T)[] ? T : never;

type Participation = ParticipationsResult extends readonly (infer T)[]
  ? T
  : never;

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
      .find(
        (level) => followers >= level.minFollowers && pubs >= level.minPubs,
      ) ?? LEVELS[0]
  );
}

function getNextLevel(followers: number, pubs: number): CreatorLevel | null {
  const current = getLevel(followers, pubs);
  const index = LEVELS.findIndex((level) => level.label === current.label);

  return LEVELS[index + 1] ?? null;
}

/* ════════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ════════════════════════════════════════════════════════════════════════════ */

const T = {
  bg: "#07070C",
  card: "rgba(255,255,255,0.045)",
  border: "rgba(255,255,255,0.08)",
  text: "#FFFFFF",
  dim: "rgba(255,255,255,0.58)",
  faint: "rgba(255,255,255,0.32)",
  ghost: "rgba(255,255,255,0.18)",
  primary: "#8B5CF6",
  primarySoft: "#C4B5FD",
  amber: "#F59E0B",
  amberSoft: "#FCD34D",
  success: "#10B981",
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

const EARNING_ICONS: Record<string, ElementType> = {
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

const GROWTH_TIPS: Array<{
  icon: ElementType;
  text: string;
  color: string;
}> = [
  {
    icon: Flame,
    text: "Publie régulièrement pour maintenir une présence active.",
    color: "#EF4444",
  },
  {
    icon: Heart,
    text: "Réponds aux commentaires et crée une vraie conversation avec ta communauté.",
    color: "#EC4899",
  },
  {
    icon: Clock,
    text: "Analyse tes statistiques pour identifier les moments où ton audience réagit le plus.",
    color: "#06B6D4",
  },
  {
    icon: Users,
    text: "Participe aux challenges pertinents pour développer ta visibilité.",
    color: "#10B981",
  },
];

const EARNINGS_TIPS = [
  "🎁 Active les cadeaux lorsque cette fonctionnalité est disponible.",
  "⚡ Propose du contenu exclusif à ta communauté.",
  "🏆 Participe aux challenges éligibles.",
  "📈 Analyse les performances de tes publications pour améliorer leur portée.",
];

const TABS: Array<{
  id: TabId;
  label: string;
  icon: ElementType;
}> = [
  { id: "stats", label: "Analytics", icon: BarChart2 },
  { id: "publications", label: "Mes pubs", icon: Pencil },
  { id: "challenges", label: "Challenges", icon: Trophy },
  { id: "earnings", label: "Revenus", icon: Gift },
];

/* ════════════════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════════════════ */

function alpha(hex: string, opacity: number): string {
  const value = hex.replace("#", "");

  if (value.length !== 6) {
    return `rgba(139,92,246,${opacity})`;
  }

  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);

  return `rgba(${red},${green},${blue},${opacity})`;
}

function fmt(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }

  return String(Math.round(value));
}

function formatTransactionDate(value: string | number): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date indisponible";
  }

  return (
    `${date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    })}, ` +
    date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
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

    return () => {
      loop.stop();
    };
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
  icon: ElementType;
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
      animations.map((animation) =>
        Animated.spring(animation, {
          toValue: 1,
          useNativeDriver: false,
          friction: 6,
          tension: 80,
        }),
      ),
    ).start();
  }, [animations, data.length]);

  if (data.length === 0) {
    return null;
  }

  const max = Math.max(...data.map((item) => item.count), 1);
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
        {data.map((point, index) => {
          const ratio = point.count / max;

          const barHeight =
            animations[index]?.interpolate({
              inputRange: [0, 1],
              outputRange: [4, Math.max(6, ratio * chartHeight)],
            }) ?? 6;

          const isFocused = focused === index;

          return (
            <Pressable
              key={`${point.name}-${index}`}
              onPressIn={() => setFocused(index)}
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
        {data.map((point, index) => (
          <View
            key={`${point.name}-label-${index}`}
            style={{
              flex: 1,
              alignItems: "center",
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                color: focused === index ? point.color : T.faint,
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
   LEVEL HERO
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

  const followerProgress = nextLevel
    ? followerCount / Math.max(1, nextLevel.minFollowers)
    : 1;

  const publicationProgress = nextLevel
    ? pubCount / Math.max(1, nextLevel.minPubs)
    : 1;

  const target = nextLevel
    ? Math.min(100, Math.min(followerProgress, publicationProgress) * 100)
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

    return () => {
      loop.stop();
    };
  }, [target, progressWidth, glowOpacity]);

  const stats = [
    {
      label: "Abonnés",
      value: fmt(followerCount),
      color: "#818CF8",
    },
    {
      label: "Pubs",
      value: fmt(pubCount),
      color: "#34D399",
    },
    {
      label: "Vues",
      value: fmt(totalViews),
      color: T.amberSoft,
    },
    {
      label: "Engagement",
      value: `${engagementRate}%`,
      color: "#F472B6",
    },
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

      <View style={styles.heroStatsGrid}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.heroStatBox}>
            <Text
              numberOfLines={1}
              style={[styles.heroStatValue, { color: stat.color }]}
            >
              {stat.value}
            </Text>

            <Text style={styles.heroStatLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STATS
   ════════════════════════════════════════════════════════════════════════════ */

function StatsTab({
  creatorStats,
  videoAnalytics,
  typeChartData,
  followerCount,
  isLoading,
}: {
  creatorStats: CreatorStats | undefined;
  videoAnalytics: VideoAnalytics | undefined;
  typeChartData: TypeChartPoint[];
  followerCount: number;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <View style={{ gap: 12 }}>
        {[0, 1, 2, 3].map((index) => (
          <Skeleton
            key={index}
            style={{
              height: 88,
              borderRadius: 20,
            }}
          />
        ))}
      </View>
    );
  }

  const pubsThisWeek = creatorStats?.pubsThisWeek ?? 0;

  const isActive = creatorStats?.isActiveCreator ?? false;

  return (
    <View style={{ gap: 18 }}>
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

        <View
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <Text style={styles.weekTitle}>
            {pubsThisWeek} publication
            {pubsThisWeek > 1 ? "s" : ""} cette semaine
          </Text>

          <Text style={styles.weekSubtitle}>
            {isActive
              ? "Badge Créateur Actif débloqué."
              : `Encore ${Math.max(0, 3 - pubsThisWeek)} publication${
                  Math.max(0, 3 - pubsThisWeek) > 1 ? "s" : ""
                } pour atteindre le palier actif.`}
          </Text>
        </View>
      </View>

      {creatorStats?.recentActivity &&
        creatorStats.recentActivity.length > 0 && (
          <View style={styles.sectionCard}>
            <ActivityCalendar data={creatorStats.recentActivity} />
          </View>
        )}

      {typeChartData.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHead}>
            <View
              style={[
                styles.sectionIcon,
                {
                  backgroundColor: alpha("#818CF8", 0.15),
                },
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
                {
                  backgroundColor: alpha(T.primary, 0.18),
                },
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

      {videoAnalytics && videoAnalytics.videoCount > 0 && (
        <View style={{ gap: 12 }}>
          <View style={styles.sectionHead}>
            <View
              style={[
                styles.sectionIcon,
                {
                  backgroundColor: alpha(T.amber, 0.15),
                },
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

      <View style={{ gap: 12 }}>
        <View style={styles.sectionHead}>
          <View
            style={[
              styles.sectionIcon,
              {
                backgroundColor: alpha(T.amber, 0.15),
              },
            ]}
          >
            <Lightbulb size={13} color={T.amberSoft} />
          </View>

          <Text style={styles.sectionTitle}>Conseils de croissance</Text>
        </View>

        {GROWTH_TIPS.map((tip) => {
          const Icon = tip.icon;

          return (
            <View
              key={tip.text}
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
                  {
                    backgroundColor: alpha(tip.color, 0.16),
                  },
                ]}
              >
                <Icon size={14} color={tip.color} />
              </View>

              <Text style={styles.tipText}>{tip.text}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.partnerCard}>
        <View style={styles.partnerHead}>
          <View
            style={[
              styles.sectionIcon,
              {
                backgroundColor: alpha(T.amber, 0.16),
              },
            ]}
          >
            <Crown size={14} color={T.amberSoft} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.partnerTitle}>Prochain palier</Text>

            <Text style={styles.partnerSubtitle}>
              {followerCount >= 500
                ? "Le palier Confirmé est atteint."
                : "Développe ta communauté pour progresser vers le palier Confirmé."}
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
            {followerCount}/500 abonnés
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PUBLICATIONS
   ════════════════════════════════════════════════════════════════════════════ */

function PublicationsTab({
  creatorStats,
  pubCount,
}: {
  creatorStats: CreatorStats | undefined;
  pubCount: number;
}) {
  const publications = creatorStats?.publications ?? [];

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.sectionHead}>
        <View
          style={[
            styles.sectionIcon,
            {
              backgroundColor: alpha(T.success, 0.15),
            },
          ]}
        >
          <Pencil size={13} color="#34D399" />
        </View>

        <Text style={styles.sectionTitle}>
          {pubCount} publication
          {pubCount > 1 ? "s" : ""}
        </Text>
      </View>

      {creatorStats === undefined ? (
        <View style={{ gap: 10 }}>
          {[0, 1, 2, 3, 4].map((index) => (
            <Skeleton
              key={index}
              style={{
                height: 68,
                borderRadius: 18,
              }}
            />
          ))}
        </View>
      ) : publications.length === 0 ? (
        <EmptyState
          icon={Pencil}
          title="Aucune publication"
          message="Tes publications apparaîtront ici dès que tu en auras créé."
        />
      ) : (
        <View style={{ gap: 10 }}>
          {publications.map((publication) => (
            <PubRow key={publication._id} pub={publication} />
          ))}
        </View>
      )}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CHALLENGES
   ════════════════════════════════════════════════════════════════════════════ */

function ChallengesTab({
  challenges,
  joinedIds,
  participationsCount,
  onJoin,
}: {
  challenges: ChallengesResult | undefined;
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
              {
                backgroundColor: alpha(T.amber, 0.15),
              },
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
          {[0, 1, 2].map((index) => (
            <Skeleton
              key={index}
              style={{
                height: 220,
                borderRadius: 22,
              }}
            />
          ))}
        </View>
      ) : challenges.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Aucun challenge actif"
          message="Aucun challenge actif n'est actuellement disponible."
        />
      ) : (
        <View style={{ gap: 12 }}>
          {challenges.map((challenge: Challenge) => (
            <ChallengeCard
              key={challenge._id}
              challenge={challenge}
              joined={joinedIds.has(challenge._id)}
              onJoin={() => onJoin(challenge._id as Id<"creatorChallenges">)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   EARNINGS
   ════════════════════════════════════════════════════════════════════════════ */

function EarningsTab({
  myEarnings,
}: {
  myEarnings: EarningsResult | undefined;
}) {
  if (myEarnings === undefined) {
    return (
      <View style={{ gap: 14 }}>
        <Skeleton
          style={{
            height: 200,
            borderRadius: 26,
          }}
        />

        <Skeleton
          style={{
            height: 80,
            borderRadius: 18,
          }}
        />

        <Skeleton
          style={{
            height: 80,
            borderRadius: 18,
          }}
        />
      </View>
    );
  }

  const giftAmount = myEarnings.byType?.gift ?? 0;

  const superChatAmount = myEarnings.byType?.super_chat ?? 0;

  const boostAmount = myEarnings.byType?.boost ?? 0;

  const tipAmount = myEarnings.byType?.tip ?? 0;

  const earnings = [
    {
      key: "gift",
      label: EARNING_LABELS.gift,
      icon: EARNING_ICONS.gift,
      color: EARNING_COLORS.gift,
      amount: giftAmount,
    },
    {
      key: "super_chat",
      label: EARNING_LABELS.super_chat,
      icon: EARNING_ICONS.super_chat,
      color: EARNING_COLORS.super_chat,
      amount: superChatAmount,
    },
    {
      key: "boost",
      label: EARNING_LABELS.boost,
      icon: EARNING_ICONS.boost,
      color: EARNING_COLORS.boost,
      amount: boostAmount,
    },
    {
      key: "tip",
      label: EARNING_LABELS.tip,
      icon: EARNING_ICONS.tip,
      color: EARNING_COLORS.tip,
      amount: tipAmount,
    },
  ];

  const recentTransactions = myEarnings.recent ?? [];

  return (
    <View style={{ gap: 18 }}>
      <View style={styles.balanceCard}>
        <View pointerEvents="none" style={styles.balanceGlow} />

        <Text style={styles.balanceLabel}>SOLDE TOTAL ESTIMÉ</Text>

        <Text style={styles.balanceValue}>
          {(myEarnings.total ?? 0).toLocaleString()}
          <Text style={styles.balanceValueUnit}> FCFA</Text>
        </Text>

        <Text style={styles.balanceSub}>
          Données fournies par le module de revenus.
        </Text>

        <View style={styles.balanceBreakdown}>
          {earnings.map((earning) => {
            const Icon = earning.icon;

            return (
              <View key={earning.key} style={styles.balanceRow}>
                <View
                  style={[
                    styles.balanceRowIcon,
                    {
                      backgroundColor: alpha(earning.color, 0.16),
                    },
                  ]}
                >
                  <Icon size={14} color={earning.color} />
                </View>

                <View
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <Text style={styles.balanceRowLabel}>{earning.label}</Text>
                </View>

                <Text
                  style={[
                    styles.balanceRowAmount,
                    {
                      color: earning.color,
                    },
                  ]}
                >
                  {earning.amount.toLocaleString()} F
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {recentTransactions.length > 0 ? (
        <View style={{ gap: 12 }}>
          <View style={styles.sectionHead}>
            <View
              style={[
                styles.sectionIcon,
                {
                  backgroundColor: alpha(T.amber, 0.15),
                },
              ]}
            >
              <Sparkles size={13} color={T.amberSoft} />
            </View>

            <Text style={styles.sectionTitle}>Transactions récentes</Text>
          </View>

          <View style={{ gap: 8 }}>
            {recentTransactions.map((transaction) => {
              const Icon = EARNING_ICONS[transaction.type] ?? Gift;

              const color = EARNING_COLORS[transaction.type] ?? T.primarySoft;

              return (
                <View key={transaction._id} style={styles.transactionRow}>
                  <View
                    style={[
                      styles.transactionIcon,
                      {
                        backgroundColor: alpha(color, 0.16),
                      },
                    ]}
                  >
                    <Icon size={15} color={color} />
                  </View>

                  <View
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <Text numberOfLines={1} style={styles.transactionLabel}>
                      {EARNING_LABELS[transaction.type] ?? transaction.type}
                    </Text>

                    <Text style={styles.transactionDate}>
                      {formatTransactionDate(transaction.createdAt)}
                    </Text>
                  </View>

                  <Text style={styles.transactionAmount}>
                    +{transaction.amount.toLocaleString()} F
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
          message="Aucune transaction de revenus n'est disponible."
        />
      )}

      <View style={styles.earningsTips}>
        <View style={styles.sectionHead}>
          <View
            style={[
              styles.sectionIcon,
              {
                backgroundColor: alpha(T.primary, 0.15),
              },
            ]}
          >
            <Zap size={13} color={T.primarySoft} />
          </View>

          <Text style={styles.sectionTitle}>Développer tes revenus</Text>
        </View>

        <View
          style={{
            gap: 8,
            marginTop: 12,
          }}
        >
          {EARNINGS_TIPS.map((tip) => (
            <View key={tip} style={styles.earningsTipRow}>
              <ChevronRight size={13} color={T.primarySoft} />

              <Text style={styles.earningsTipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CREATOR HUB
   ════════════════════════════════════════════════════════════════════════════ */

function CreatorHubInner({
  onBack,
  email,
}: {
  onBack: () => void;
  email: string;
}) {
  const [tab, setTab] = useState<TabId>("stats");

  const panelOpacity = useRef(new Animated.Value(1)).current;

  const panelTranslate = useRef(new Animated.Value(0)).current;

  /*
   * IMPORTANT:
   * follows.getMyFollowStats is now authenticated server-side
   * and its validator is v.object({}).
   *
   * DO NOT pass email here.
   */
  const profile = useQuery(api.users.getMyProfile, {});

  const followStats = useQuery(api.follows.getMyFollowStats, {});

  /*
   * These calls intentionally preserve the contracts
   * already used by this Creator Hub.
   */
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

  const joinChallenge = useMutation(api.creatorHub.joinChallenge);

  const isLoading =
    profile === undefined ||
    followStats === undefined ||
    creatorStats === undefined;

  const followerCount = followStats?.followerCount ?? 0;

  const pubCount = creatorStats?.publications?.length ?? 0;

  const level = getLevel(followerCount, pubCount);

  const nextLevel = getNextLevel(followerCount, pubCount);

  const joinedIds = useMemo(() => {
    const participations = myParticipations ?? [];

    return new Set(
      participations.map(
        (participation: Participation) => participation.challengeId,
      ),
    );
  }, [myParticipations]);

  const typeChartData: TypeChartPoint[] = useMemo(() => {
    const breakdown = creatorStats?.typeBreakdown;

    if (!breakdown) {
      return [];
    }

    return Object.entries(breakdown)
      .map(([type, count]) => ({
        name: type,
        count,
        color: TYPE_COLORS[type] ?? T.primary,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [creatorStats?.typeBreakdown]);

  const handleJoin = useCallback(
    async (challengeId: Id<"creatorChallenges">) => {
      try {
        await joinChallenge({
          challengeId,
        });

        toast.success("Tu participes au challenge ! 🏆");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Impossible de rejoindre ce challenge.";

        toast.error(message);
      }
    },
    [joinChallenge],
  );

  const switchTab = useCallback(
    (next: TabId) => {
      if (next === tab) {
        return;
      }

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

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.glow} />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backBtn,
              {
                transform: [
                  {
                    scale: pressed ? 0.92 : 1,
                  },
                ],
              },
            ]}
          >
            <ArrowLeft size={18} color="#fff" />
          </Pressable>

          <View
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 7,
              }}
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

            <Text
              style={[
                styles.levelLabel,
                {
                  color: level.color,
                },
              ]}
            >
              {level.label}
            </Text>
          </View>
        </View>

        {!isLoading && (
          <View
            style={{
              marginTop: 18,
            }}
          >
            <LevelHeroCard
              name={profile?.name ?? "Créateur"}
              level={level}
              nextLevel={nextLevel}
              followerCount={followerCount}
              pubCount={pubCount}
              totalViews={creatorStats?.totalViews ?? 0}
              engagementRate={creatorStats?.engagementRate ?? 0}
              isActiveCreator={creatorStats?.isActiveCreator ?? false}
            />
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: 8,
            paddingRight: 20,
            paddingTop: 18,
          }}
          style={{
            marginHorizontal: -20,
            paddingHorizontal: 20,
          }}
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
                  {
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Icon size={13} color={active ? "#fff" : T.faint} />

                <Text
                  style={[
                    styles.tabPillText,
                    active && {
                      color: "#fff",
                      fontWeight: "900",
                    },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: panelOpacity,
            transform: [
              {
                translateY: panelTranslate,
              },
            ],
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
              challenges={challengesRaw}
              joinedIds={joinedIds}
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
   EXPORT — AUTH GATE
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
              {
                transform: [
                  {
                    scale: pressed ? 0.92 : 1,
                  },
                ],
              },
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
            Accède à tes analytics, participe aux challenges et développe ton
            activité de créateur.
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
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },

  center: {
    alignItems: "center",
    justifyContent: "center",
  },

  glow: {
    position: "absolute",
    top: -150,
    left: -80,
    right: -80,
    height: 320,
    borderRadius: 220,
    backgroundColor: alpha(T.primary, 0.1),
  },

  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

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

  subtitle: {
    color: T.faint,
    fontSize: 11.5,
    marginTop: 2,
  },

  levelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },

  levelEmoji: {
    fontSize: 14,
  },

  levelLabel: {
    fontSize: 11.5,
    fontWeight: "900",
    letterSpacing: -0.2,
  },

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

  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 60,
  },

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
