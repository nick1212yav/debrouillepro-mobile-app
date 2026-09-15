// src/pages/modules/AnalyticsPage.tsx
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart2,
  Eye,
  FileText,
  Heart,
  MessageCircle,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react-native";
import { SignInButton } from "@/components/ui/signin.tsx";

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

interface AnalyticsPageProps {
  onBack: () => void;
}

type DailyPoint = { date: string; views?: number; count?: number };

type TopPublication = {
  _id: string;
  title: string;
  type: string;
  views: number;
  likes: number;
};

type AnalyticsData = {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalFollowers: number;
  totalPublications: number;
  engagementRate: number;
  weekSummary: { views: number; likes: number };
  viewsByDay: DailyPoint[];
  profileViewsByDay: DailyPoint[];
  followersByDay: DailyPoint[];
  topPublications: TopPublication[];
};

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
} as const;

const TYPE_LABELS: Record<string, string> = {
  immo: "Immobilier",
  job: "Emploi",
  service: "Service",
  evenement: "Événement",
  community: "Communauté",
  agri: "Agriculture",
  sante: "Santé",
  transport: "Transport",
  annonce: "Annonce",
  restauration: "Restauration",
  hebergement: "Hébergement",
  energie: "Énergie",
  ong: "ONG",
};

const SCREEN_W = Dimensions.get("window").width;
const CHART_HEIGHT = 140;

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

function formatDateShort(iso: string): string {
  const parts = iso.split("-");
  if (parts.length < 3) return iso;
  return `${parts[2]}/${parts[1]}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(0)}k`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
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
          borderRadius: 20,
          opacity,
        },
        style,
      ]}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CHART — Bar series (pure View, animée)
   ════════════════════════════════════════════════════════════════════════════ */

function BarSeries({
  values,
  labels,
  color,
  height = CHART_HEIGHT,
}: {
  values: number[];
  labels: string[];
  color: string;
  height?: number;
}) {
  const max = Math.max(...values, 1);
  const animations = useRef(values.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      25,
      animations.map((a) =>
        Animated.spring(a, {
          toValue: 1,
          useNativeDriver: false,
          friction: 6,
          tension: 80,
        }),
      ),
    ).start();
  }, [animations, values]);

  return (
    <View
      style={{ height, flexDirection: "row", alignItems: "flex-end", gap: 4 }}
    >
      {values.map((v, i) => {
        const ratio = v / max;
        const barHeight = animations[i].interpolate({
          inputRange: [0, 1],
          outputRange: [4, Math.max(6, ratio * (height - 24))],
        });
        return (
          <View
            key={i}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 6,
            }}
          >
            <Animated.View
              style={{
                width: "100%",
                height: barHeight,
                borderRadius: 6,
                backgroundColor: color,
                opacity: 0.92,
              }}
            />
            <Text
              style={{
                color: T.faint,
                fontSize: 9,
                fontWeight: "700",
                transform: [{ rotate: "0deg" }],
              }}
              numberOfLines={1}
            >
              {labels[i]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CHART — Area / Trend (composée de barres fines pour un effet de courbe)
   ════════════════════════════════════════════════════════════════════════════ */

function TrendArea({
  values,
  labels,
  color,
  height = CHART_HEIGHT,
}: {
  values: number[];
  labels: string[];
  color: string;
  height?: number;
}) {
  const max = Math.max(...values, 1);
  const animations = useRef(values.map(() => new Animated.Value(0))).current;
  const [focused, setFocused] = useState<number | null>(null);

  useEffect(() => {
    Animated.stagger(
      25,
      animations.map((a) =>
        Animated.spring(a, {
          toValue: 1,
          useNativeDriver: false,
          friction: 6,
          tension: 80,
        }),
      ),
    ).start();
  }, [animations, values]);

  const total = values.length;
  const barW = Math.max(6, Math.floor((SCREEN_W - 88) / total));

  return (
    <View>
      {/* Ligne de valeur au survol/tap */}
      {focused !== null && (
        <View
          style={{
            position: "absolute",
            top: -6,
            left: focused * (barW + 4) + barW / 2 - 22,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 10,
            backgroundColor: "#1A1A2E",
            borderWidth: 1,
            borderColor: T.borderUp,
            zIndex: 5,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 10.5, fontWeight: "800" }}>
            {values[focused]}
          </Text>
        </View>
      )}

      <View
        style={{
          height,
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 4,
        }}
      >
        {values.map((v, i) => {
          const ratio = v / max;
          const barHeight = animations[i].interpolate({
            inputRange: [0, 1],
            outputRange: [2, Math.max(4, ratio * (height - 10))],
          });
          const isFocused = focused === i;
          return (
            <Pressable
              key={i}
              onPressIn={() => setFocused(i)}
              onPressOut={() => setFocused(null)}
              style={{ flex: 1, justifyContent: "flex-end", height }}
            >
              <Animated.View
                style={{
                  width: "100%",
                  height: barHeight,
                  borderRadius: 6,
                  backgroundColor: color,
                  opacity: isFocused ? 1 : 0.75,
                }}
              />
            </Pressable>
          );
        })}
      </View>

      {/* Labels X (un sur trois pour éviter la surcharge) */}
      <View style={{ flexDirection: "row", gap: 4, marginTop: 8 }}>
        {labels.map((l, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            {i % 3 === 0 && (
              <Text style={{ color: T.faint, fontSize: 9, fontWeight: "700" }}>
                {l}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STAT CARD
   ════════════════════════════════════════════════════════════════════════════ */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  delay?: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 340,
      delay,
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        styles.statCard,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: alpha(color, 0.16) }]}>
        <Icon size={15} color={color} />
      </View>
      <Text style={styles.statValue}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
      {sub && (
        <Text style={styles.statSub} numberOfLines={1}>
          {sub}
        </Text>
      )}
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CHART CARD (wrapper)
   ════════════════════════════════════════════════════════════════════════════ */

function ChartCard({
  title,
  icon: Icon,
  iconColor,
  children,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHead}>
        <View
          style={[
            styles.chartIconWrap,
            { backgroundColor: alpha(iconColor, 0.15) },
          ]}
        >
          <Icon size={13} color={iconColor} />
        </View>
        <Text style={styles.chartTitle}>{title}</Text>
      </View>
      <View style={{ marginTop: 14 }}>{children}</View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TOP PUBLICATION ROW
   ════════════════════════════════════════════════════════════════════════════ */

function TopPublicationRow({
  pub,
  rank,
}: {
  pub: TopPublication;
  rank: number;
}) {
  const rankStyle =
    rank === 0
      ? { bg: "#F59E0B", fg: "#000" }
      : rank === 1
        ? { bg: "#94A3B8", fg: "#000" }
        : rank === 2
          ? { bg: "#EA580C", fg: "#fff" }
          : { bg: "rgba(255,255,255,0.08)", fg: T.dim };

  return (
    <View style={styles.topPubRow}>
      <View style={[styles.rankBadge, { backgroundColor: rankStyle.bg }]}>
        <Text style={[styles.rankText, { color: rankStyle.fg }]}>
          {rank + 1}
        </Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={styles.topPubTitle}>
          {pub.title}
        </Text>
        <Text style={styles.topPubType}>
          {TYPE_LABELS[pub.type] ?? pub.type}
        </Text>
      </View>

      <View style={styles.topPubMetrics}>
        <View style={styles.metaItem}>
          <Eye size={11} color={T.faint} />
          <Text style={styles.metaText}>{formatNumber(pub.views)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Heart size={11} color="#FB7185" />
          <Text style={[styles.metaText, { color: "#FB7185" }]}>
            {formatNumber(pub.likes)}
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   INNER — le cœur analytique
   ════════════════════════════════════════════════════════════════════════════ */

function AnalyticsInner() {
  const raw = useQuery(api.analytics.getMyAnalytics, {});
  const data = raw as unknown as AnalyticsData | undefined;

  const viewsSlice = useMemo(() => (data?.viewsByDay ?? []).slice(-14), [data]);
  const profileSlice = useMemo(
    () => (data?.profileViewsByDay ?? []).slice(-14),
    [data],
  );
  const followersSlice = useMemo(
    () => (data?.followersByDay ?? []).slice(-14),
    [data],
  );

  if (!data) {
    return (
      <View style={{ paddingHorizontal: 20, gap: 14 }}>
        <Skeleton style={{ height: 130, borderRadius: 24 }} />
        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              style={{ height: 108, width: "48%", borderRadius: 20 }}
            />
          ))}
        </View>
        <Skeleton style={{ height: 220, borderRadius: 24 }} />
        <Skeleton style={{ height: 220, borderRadius: 24 }} />
      </View>
    );
  }

  const isEmpty =
    data.totalViews === 0 &&
    data.totalLikes === 0 &&
    data.totalPublications === 0;

  /* ── Rendu vide ─────────────────────────────────────────────────────────── */
  if (isEmpty) {
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIcon}>
          <BarChart2 size={30} color={T.faint} />
        </View>
        <Text style={styles.emptyTitle}>Pas encore de données</Text>
        <Text style={styles.emptyText}>
          Publie du contenu et interagis avec la communauté — tes statistiques
          apparaîtront ici en temps réel.
        </Text>
      </View>
    );
  }

  /* ── Rend principal ─────────────────────────────────────────────────────── */
  return (
    <View style={{ gap: 18, paddingBottom: 40 }}>
      {/* Hero — cette semaine */}
      <Animated.View style={styles.weekCard}>
        <View style={styles.weekCardHead}>
          <View style={styles.weekIcon}>
            <Zap size={15} color="#A78BFA" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.weekTitle}>Cette semaine</Text>
            <Text style={styles.weekSubtitle}>Tes 7 derniers jours</Text>
          </View>
          <View style={styles.weekPill}>
            <ArrowUpRight size={11} color="#4ADE80" />
            <Text style={styles.weekPillText}>Live</Text>
          </View>
        </View>

        <View style={styles.weekBody}>
          <View style={styles.weekStat}>
            <Text style={styles.weekStatValue}>
              {formatNumber(data.weekSummary.views)}
            </Text>
            <Text style={styles.weekStatLabel}>vues</Text>
          </View>
          <View style={styles.weekDivider} />
          <View style={styles.weekStat}>
            <Text style={styles.weekStatValue}>
              {formatNumber(data.weekSummary.likes)}
            </Text>
            <Text style={styles.weekStatLabel}>likes reçus</Text>
          </View>
          <View style={styles.weekDivider} />
          <View style={styles.weekStat}>
            <Text style={styles.weekStatValue}>
              {data.engagementRate.toFixed(1)}%
            </Text>
            <Text style={styles.weekStatLabel}>engagement</Text>
          </View>
        </View>
      </Animated.View>

      {/* Grille de stats */}
      <View style={styles.statGrid}>
        <StatCard
          icon={Eye}
          label="Vues totales"
          value={data.totalViews}
          color="#818CF8"
          delay={0}
        />
        <StatCard
          icon={Heart}
          label="Likes reçus"
          value={data.totalLikes}
          color="#FB7185"
          delay={60}
        />
        <StatCard
          icon={MessageCircle}
          label="Commentaires"
          value={data.totalComments}
          color="#FBBF24"
          delay={120}
        />
        <StatCard
          icon={Users}
          label="Abonnés"
          value={data.totalFollowers}
          color="#34D399"
          delay={180}
        />
        <StatCard
          icon={FileText}
          label="Publications"
          value={data.totalPublications}
          color="#22D3EE"
          delay={240}
        />
        <StatCard
          icon={TrendingUp}
          label="Engagement"
          value={`${data.engagementRate.toFixed(1)}%`}
          sub="likes + comm / vues"
          color="#A78BFA"
          delay={300}
        />
      </View>

      {/* Charts */}
      {viewsSlice.length > 0 && (
        <ChartCard title="Vues / jour" icon={Eye} iconColor="#818CF8">
          <TrendArea
            values={viewsSlice.map((d) => d.views ?? 0)}
            labels={viewsSlice.map((d) => formatDateShort(d.date))}
            color="#818CF8"
          />
        </ChartCard>
      )}

      {profileSlice.length > 0 && (
        <ChartCard title="Visites du profil" icon={Users} iconColor="#34D399">
          <BarSeries
            values={profileSlice.map((d) => d.views ?? 0)}
            labels={profileSlice.map((d) => formatDateShort(d.date))}
            color="#34D399"
          />
        </ChartCard>
      )}

      {followersSlice.length > 0 && (
        <ChartCard
          title="Croissance abonnés"
          icon={TrendingUp}
          iconColor="#A78BFA"
        >
          <TrendArea
            values={followersSlice.map((d) => d.count ?? 0)}
            labels={followersSlice.map((d) => formatDateShort(d.date))}
            color="#A78BFA"
          />
        </ChartCard>
      )}

      {/* Top publications */}
      {data.topPublications.length > 0 ? (
        <View style={styles.topPubCard}>
          <View style={styles.chartHead}>
            <View
              style={[
                styles.chartIconWrap,
                { backgroundColor: alpha("#FBBF24", 0.15) },
              ]}
            >
              <Star size={13} color="#FBBF24" />
            </View>
            <Text style={styles.chartTitle}>Meilleures publications</Text>
          </View>

          <View style={{ marginTop: 14, gap: 10 }}>
            {data.topPublications.map((pub, i) => (
              <TopPublicationRow key={pub._id} pub={pub} rank={i} />
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.emptyTopPub}>
          <BarChart2 size={24} color={T.faint} />
          <Text style={styles.emptyTopPubText}>
            Publie du contenu pour voir tes meilleurs posts ici
          </Text>
        </View>
      )}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ════════════════════════════════════════════════════════════════════════════ */

export default function AnalyticsPage({ onBack }: AnalyticsPageProps) {
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

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Analytics</Text>
            <Text style={styles.subtitle}>Tes statistiques personnelles</Text>
          </View>

          <View style={styles.periodPill}>
            <View style={styles.periodDot} />
            <Text style={styles.periodText}>30 jours</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Authenticated>
          <AnalyticsInner />
        </Authenticated>

        <Unauthenticated>
          <View style={styles.authGate}>
            <View style={styles.authIcon}>
              <BarChart2 size={32} color="#A78BFA" />
            </View>
            <Text style={styles.authTitle}>Analytics</Text>
            <Text style={styles.authText}>
              Connecte-toi pour suivre tes vues, likes, abonnés et l'impact de
              chaque publication en temps réel.
            </Text>
            <View style={{ marginTop: 10 }}>
              <SignInButton />
            </View>
          </View>
        </Unauthenticated>
      </ScrollView>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  glow: {
    position: "absolute",
    top: -160,
    left: -80,
    right: -80,
    height: 320,
    borderRadius: 220,
    backgroundColor: "rgba(129,140,248,0.12)",
  },

  /* Header */
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 6 },
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
  periodPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: alpha("#818CF8", 0.14),
    borderWidth: 1,
    borderColor: alpha("#818CF8", 0.3),
  },
  periodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ADE80",
  },
  periodText: {
    color: "#A5B4FC",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  /* Content */
  content: { paddingHorizontal: 20, paddingTop: 16 },

  /* Week hero */
  weekCard: {
    padding: 18,
    borderRadius: 26,
    backgroundColor: alpha("#8B5CF6", 0.09),
    borderWidth: 1,
    borderColor: alpha("#8B5CF6", 0.28),
  },
  weekCardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  weekIcon: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha("#8B5CF6", 0.2),
  },
  weekTitle: {
    color: T.text,
    fontSize: 14.5,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  weekSubtitle: { color: T.faint, fontSize: 11, marginTop: 2 },
  weekPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: alpha("#4ADE80", 0.15),
    borderWidth: 1,
    borderColor: alpha("#4ADE80", 0.32),
  },
  weekPillText: {
    color: "#4ADE80",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  weekBody: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  weekStat: { flex: 1, alignItems: "center", gap: 4 },
  weekStatValue: {
    color: T.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  weekStatLabel: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  weekDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  /* Stat grid */
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: "48.5%",
    flexGrow: 1,
    padding: 14,
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    gap: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    color: T.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  statLabel: { color: T.dim, fontSize: 11.5, fontWeight: "700" },
  statSub: { color: T.faint, fontSize: 10, fontWeight: "600" },

  /* Chart card */
  chartCard: {
    padding: 16,
    borderRadius: 24,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  chartHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  chartIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  chartTitle: {
    color: T.text,
    fontSize: 13.5,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  /* Top publications */
  topPubCard: {
    padding: 16,
    borderRadius: 24,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  topPubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { fontSize: 11.5, fontWeight: "900" },
  topPubTitle: {
    color: T.text,
    fontSize: 13,
    fontWeight: "700",
  },
  topPubType: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 2,
  },
  topPubMetrics: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: T.faint,
    fontSize: 11,
    fontWeight: "800",
  },

  /* Empty states */
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 14,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: T.border,
  },
  emptyTitle: {
    color: T.text,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  emptyText: {
    color: T.faint,
    fontSize: 12.5,
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 280,
  },
  emptyTopPub: {
    padding: 26,
    borderRadius: 24,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    gap: 10,
  },
  emptyTopPubText: {
    color: T.faint,
    fontSize: 12,
    textAlign: "center",
    maxWidth: 240,
    lineHeight: 18,
  },

  /* Auth gate */
  authGate: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
    paddingHorizontal: 32,
    gap: 14,
  },
  authIcon: {
    width: 78,
    height: 78,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha("#8B5CF6", 0.14),
    borderWidth: 1,
    borderColor: alpha("#8B5CF6", 0.32),
    marginBottom: 6,
  },
  authTitle: {
    color: T.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.4,
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
