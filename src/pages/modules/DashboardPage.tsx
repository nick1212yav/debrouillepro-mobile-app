// src/pages/modules/DashboardPage.tsx
import {
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
import Svg, { Circle } from "react-native-svg";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BarChart2,
  Briefcase,
  Building2,
  Bus,
  Calendar,
  CheckCircle,
  ChevronRight,
  Flame,
  Heart,
  Leaf,
  Map as MapIcon,
  MessageCircle,
  MessageSquare,
  Newspaper,
  Package,
  PartyPopper,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

interface DashboardPageProps {
  onBack: () => void;
}

type TabId = "activite" | "modules" | "badges" | "analytics";
type BadgeTier = "or" | "argent" | "bronze" | "locked";

type Badge = {
  id: string;
  icon: string;
  label: string;
  desc: string;
  color: string;
  tier: BadgeTier;
  unlocked: boolean;
  date?: string;
};

type ModuleStat = {
  name: string;
  uses: number;
  color: string;
  icon: React.ElementType;
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
  primary: "#8B5CF6",
  primarySoft: "#C4B5FD",
  amber: "#F59E0B",
  amberSoft: "#FCD34D",
  success: "#10B981",
  danger: "#EF4444",
  cyan: "#22D3EE",
} as const;

const SCREEN_W = Dimensions.get("window").width;

/* ════════════════════════════════════════════════════════════════════════════
   DATA — fallbacks locaux (aucun mock réseau)
   ════════════════════════════════════════════════════════════════════════════ */

const WEEKLY_ACTIVITY = [
  { day: "Lun", score: 42, actions: 5 },
  { day: "Mar", score: 68, actions: 9 },
  { day: "Mer", score: 55, actions: 7 },
  { day: "Jeu", score: 87, actions: 13 },
  { day: "Ven", score: 72, actions: 10 },
  { day: "Sam", score: 91, actions: 14 },
  { day: "Auj", score: 63, actions: 8 },
];

const MODULE_STATS: ModuleStat[] = [
  { name: "Messages", uses: 22, color: "#3B82F6", icon: MessageCircle },
  { name: "Immo", uses: 18, color: "#F97316", icon: Building2 },
  { name: "Transport", uses: 14, color: "#3B82F6", icon: Bus },
  { name: "Emplois", uses: 11, color: "#8B5CF6", icon: Briefcase },
  { name: "Santé", uses: 9, color: "#EF4444", icon: Heart },
  { name: "Media", uses: 8, color: "#06B6D4", icon: Newspaper },
  { name: "Livraison", uses: 7, color: "#F59E0B", icon: Package },
  { name: "Carte", uses: 6, color: "#6366F1", icon: MapIcon },
  { name: "Événements", uses: 5, color: "#EC4899", icon: PartyPopper },
  { name: "Agri", uses: 4, color: "#22C55E", icon: Leaf },
];

const BADGES: Badge[] = [
  {
    id: "b1",
    icon: "✅",
    label: "Identité vérifiée",
    desc: "Profil vérifié avec succès",
    color: "#10B981",
    tier: "or",
    unlocked: true,
    date: "Jan 2025",
  },
  {
    id: "b2",
    icon: "⚡",
    label: "Réponse rapide",
    desc: "Moins de 5 min en moyenne",
    color: "#F97316",
    tier: "or",
    unlocked: true,
    date: "Fév 2025",
  },
  {
    id: "b3",
    icon: "🏆",
    label: "Top Vendeur",
    desc: "50+ transactions réalisées",
    color: "#F59E0B",
    tier: "or",
    unlocked: true,
    date: "Mar 2025",
  },
  {
    id: "b4",
    icon: "🛡️",
    label: "Compte sécurisé",
    desc: "2FA activé, KYC validé",
    color: "#3B82F6",
    tier: "argent",
    unlocked: true,
    date: "Jan 2025",
  },
  {
    id: "b5",
    icon: "🌱",
    label: "Agri Pioneer",
    desc: "Premier dans le module Agri",
    color: "#22C55E",
    tier: "argent",
    unlocked: true,
    date: "Avr 2025",
  },
  {
    id: "b6",
    icon: "🗺️",
    label: "Explorateur",
    desc: "10 modules différents utilisés",
    color: "#6366F1",
    tier: "argent",
    unlocked: true,
    date: "Mai 2025",
  },
  {
    id: "b7",
    icon: "💎",
    label: "Débrouille Legend",
    desc: "Atteindre le niveau 20",
    color: "#A78BFA",
    tier: "locked",
    unlocked: false,
  },
  {
    id: "b8",
    icon: "🚀",
    label: "Super Actif",
    desc: "7 jours consécutifs d'activité",
    color: "#EC4899",
    tier: "locked",
    unlocked: false,
  },
];

const MODULE_TREND = [
  { week: "S-3", messages: 8, transport: 4, immo: 5 },
  { week: "S-2", messages: 12, transport: 6, immo: 9 },
  { week: "S-1", messages: 18, transport: 10, immo: 14 },
  { week: "Sem.", messages: 22, transport: 14, immo: 18 },
];

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

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/* Heatmap locale — simulée, mais cohérente avec l'app */
function generateHeatmap(): { date: string; level: number }[] {
  const cells: { date: string; level: number }[] = [];
  const today = new Date();
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const level =
      i === 0
        ? 3
        : i === 1
          ? 4
          : i === 3
            ? 2
            : i === 5
              ? 1
              : i === 7
                ? 4
                : i === 9
                  ? 3
                  : i === 10
                    ? 0
                    : i === 11
                      ? 1
                      : i === 14
                        ? 3
                        : i === 15
                          ? 2
                          : i === 18
                            ? 4
                            : i === 21
                              ? 0
                              : i % 3 === 0
                                ? 2
                                : i % 5 === 0
                                  ? 1
                                  : 3;
    cells.push({ date: dateStr, level });
  }
  return cells;
}

const HEATMAP_DATA = generateHeatmap();
const HEATMAP_COLORS = [
  "rgba(255,255,255,0.05)",
  "rgba(139,92,246,0.22)",
  "rgba(139,92,246,0.42)",
  "rgba(139,92,246,0.65)",
  "#8B5CF6",
];

function computeStreak(): number {
  let streak = 0;
  for (let i = 0; i < HEATMAP_DATA.length; i++) {
    const cell = HEATMAP_DATA[HEATMAP_DATA.length - 1 - i];
    if (cell.level > 0) streak++;
    else break;
  }
  return streak;
}

const STREAK = computeStreak();

/* Budget health — fallback sûr si localStorage indisponible */
function getBudgetHealthScore(): {
  score: number;
  label: string;
  color: string;
  detail: string;
} {
  const fallback = {
    score: 72,
    label: "Bien",
    color: "#10B981",
    detail: "Données insuffisantes",
  };
  try {
    if (typeof localStorage === "undefined") return fallback;
    const raw = localStorage.getItem("debrouille_budget_categories");
    if (!raw) return { ...fallback, detail: "Pas de données budget" };
    const cats: { spent: number; limit: number }[] = JSON.parse(raw);
    const total = cats.reduce((sum, c) => sum + c.limit, 0);
    const spent = cats.reduce((sum, c) => sum + c.spent, 0);
    if (total === 0) return { ...fallback, detail: "Budget non configuré" };
    const ratio = spent / total;
    if (ratio > 0.95)
      return {
        score: 22,
        label: "Critique",
        color: "#EF4444",
        detail: "Budget presque épuisé",
      };
    if (ratio > 0.8)
      return {
        score: 45,
        label: "Attention",
        color: "#F59E0B",
        detail: "Dépenses élevées",
      };
    if (ratio > 0.6)
      return {
        score: 65,
        label: "Correct",
        color: "#F59E0B",
        detail: "Dans les normes",
      };
    return {
      score: 88,
      label: "Excellent",
      color: "#10B981",
      detail: "Budget bien géré",
    };
  } catch {
    return fallback;
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   PRIMITIVES
   ════════════════════════════════════════════════════════════════════════════ */

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.ComponentProps<typeof View>["style"];
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function SectionTitle({
  children,
  icon: Icon,
  iconColor,
}: {
  children: React.ReactNode;
  icon?: React.ElementType;
  iconColor?: string;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      {Icon && (
        <View
          style={[
            styles.sectionTitleIcon,
            { backgroundColor: alpha(iconColor ?? T.primary, 0.15) },
          ]}
        >
          <Icon size={12} color={iconColor ?? T.primarySoft} />
        </View>
      )}
      <Text style={styles.sectionTitleText}>{children}</Text>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   RADIAL SCORE (SVG animé)
   ════════════════════════════════════════════════════════════════════════════ */

function RadialScore({
  value,
  color,
  size = 100,
  stroke = 8,
}: {
  value: number;
  color: string;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const anim = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const listener = anim.addListener(({ value: v }) => setProgress(v));
    Animated.timing(anim, {
      toValue: Math.min(100, Math.max(0, value)),
      duration: 1100,
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(listener);
  }, [anim, value]);

  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </Svg>
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <Text style={styles.radialValue}>{Math.round(progress)}</Text>
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   NATIVE AREA CHART (bars avec gradient simulé)
   ════════════════════════════════════════════════════════════════════════════ */

function NativeAreaChart({
  data,
  maxValue,
  color,
  height = 120,
}: {
  data: { label: string; value: number }[];
  maxValue: number;
  color: string;
  height?: number;
}) {
  const animations = useRef(data.map(() => new Animated.Value(0))).current;
  const [focused, setFocused] = useState<number | null>(null);

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

  return (
    <View>
      {focused !== null && (
        <View
          style={[
            styles.chartTooltip,
            {
              left: Math.min(
                Math.max(0, (focused * (SCREEN_W - 80)) / data.length - 30),
                SCREEN_W - 120,
              ),
            },
          ]}
        >
          <Text style={styles.chartTooltipLabel}>{data[focused].label}</Text>
          <Text style={[styles.chartTooltipValue, { color }]}>
            {data[focused].value} pts
          </Text>
        </View>
      )}

      <View
        style={{ height, flexDirection: "row", alignItems: "flex-end", gap: 8 }}
      >
        {data.map((point, i) => {
          const ratio = point.value / maxValue;
          const barHeight = animations[i].interpolate({
            inputRange: [0, 1],
            outputRange: [4, Math.max(8, ratio * (height - 30))],
          });
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
                height,
              }}
            >
              <Animated.View
                style={{
                  width: "100%",
                  height: barHeight,
                  borderRadius: 8,
                  backgroundColor: color,
                  opacity: isFocused ? 1 : 0.85,
                }}
              />
            </Pressable>
          );
        })}
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
        {data.map((point, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <Text
              style={{
                color: focused === i ? color : T.faint,
                fontSize: 10,
                fontWeight: "800",
                letterSpacing: 0.3,
              }}
            >
              {point.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   NATIVE BAR CHART (couleurs par point)
   ════════════════════════════════════════════════════════════════════════════ */

function NativeBarChart({
  data,
  height = 170,
}: {
  data: { name: string; uses: number; color: string }[];
  height?: number;
}) {
  const animations = useRef(data.map(() => new Animated.Value(0))).current;
  const [focused, setFocused] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.uses), 1);

  useEffect(() => {
    Animated.stagger(
      50,
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

  return (
    <View>
      <View
        style={{ height, flexDirection: "row", alignItems: "flex-end", gap: 6 }}
      >
        {data.map((point, i) => {
          const ratio = point.uses / max;
          const barHeight = animations[i].interpolate({
            inputRange: [0, 1],
            outputRange: [4, Math.max(8, ratio * (height - 20))],
          });
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
                height,
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

      <View style={{ flexDirection: "row", gap: 6, marginTop: 10 }}>
        {data.map((point, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center", gap: 2 }}>
            <Text
              numberOfLines={1}
              style={{
                color: focused === i ? point.color : T.faint,
                fontSize: 9,
                fontWeight: "800",
              }}
            >
              {point.name}
            </Text>
            <Text style={{ color: T.dim, fontSize: 10, fontWeight: "900" }}>
              {point.uses}×
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   HEATMAP
   ════════════════════════════════════════════════════════════════════════════ */

function Heatmap() {
  const weeks: (typeof HEATMAP_DATA)[] = [];
  for (let i = 0; i < HEATMAP_DATA.length; i += 7) {
    weeks.push(HEATMAP_DATA.slice(i, i + 7));
  }

  return (
    <View>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {weeks.map((week, wi) => (
          <View key={wi} style={{ flex: 1, gap: 4 }}>
            {week.map((cell, ci) => (
              <View
                key={ci}
                style={{
                  aspectRatio: 1,
                  borderRadius: 4,
                  backgroundColor: HEATMAP_COLORS[cell.level],
                }}
              />
            ))}
          </View>
        ))}
      </View>
      <View style={styles.heatmapLegend}>
        <Text style={styles.heatmapLegendText}>Moins</Text>
        {HEATMAP_COLORS.map((c, i) => (
          <View
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              backgroundColor: c,
              marginHorizontal: 2,
            }}
          />
        ))}
        <Text style={styles.heatmapLegendText}>Plus</Text>
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   BADGE CARD
   ════════════════════════════════════════════════════════════════════════════ */

function BadgeCard({ badge, index }: { badge: Badge; index: number }) {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      delay: Math.min(index * 60, 400),
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  const locked = !badge.unlocked;

  return (
    <Animated.View
      style={[
        styles.badgeCard,
        {
          borderColor: locked ? T.border : alpha(badge.color, 0.32),
          backgroundColor: locked
            ? "rgba(255,255,255,0.03)"
            : alpha(badge.color, 0.07),
          opacity: enter,
          transform: [
            {
              scale: enter.interpolate({
                inputRange: [0, 1],
                outputRange: [0.92, 1],
              }),
            },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.badgeEmblem,
          {
            backgroundColor: locked
              ? "rgba(255,255,255,0.05)"
              : alpha(badge.color, 0.18),
            borderColor: locked ? T.border : alpha(badge.color, 0.4),
          },
        ]}
      >
        <Text style={{ fontSize: 26, opacity: locked ? 0.4 : 1 }}>
          {badge.icon}
        </Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.badgeLabel, { color: locked ? T.dim : T.text }]}>
          {badge.label}
        </Text>
        <Text
          numberOfLines={2}
          style={[styles.badgeDesc, { color: locked ? T.faint : T.dim }]}
        >
          {badge.desc}
        </Text>
      </View>

      {locked ? (
        <View style={styles.badgeLockPill}>
          <Text style={styles.badgeLockText}>Verrouillé</Text>
        </View>
      ) : badge.date ? (
        <View
          style={[
            styles.badgeDatePill,
            { backgroundColor: alpha(badge.color, 0.18) },
          ]}
        >
          <Text style={[styles.badgeDateText, { color: badge.color }]}>
            {badge.date}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PODIUM
   ════════════════════════════════════════════════════════════════════════════ */

function Podium() {
  const sorted = [...MODULE_STATS].sort((a, b) => b.uses - a.uses).slice(0, 3);
  const heights = [110, 80, 62];
  const medals = ["🥇", "🥈", "🥉"];
  const order = [1, 0, 2]; // argent, or, bronze

  return (
    <View style={styles.podiumWrap}>
      {order.map((rank) => {
        const mod = sorted[rank];
        const Icon = mod.icon;
        return (
          <View key={mod.name} style={styles.podiumColumn}>
            <Text style={styles.podiumMedal}>{medals[rank]}</Text>
            <View
              style={[
                styles.podiumBar,
                {
                  height: heights[rank],
                  backgroundColor: alpha(mod.color, 0.18),
                  borderColor: alpha(mod.color, 0.32),
                },
              ]}
            >
              <Icon size={17} color={mod.color} />
              <Text style={styles.podiumUses}>{mod.uses}×</Text>
            </View>
            <Text numberOfLines={1} style={styles.podiumName}>
              {mod.name}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB — ACTIVITÉ
   ════════════════════════════════════════════════════════════════════════════ */

function ActiviteTab({
  weeklySummary,
}: {
  weeklySummary: {
    icon: React.ElementType;
    label: string;
    value: string;
    color: string;
  }[];
}) {
  const radialData = WEEKLY_ACTIVITY.map((d) => ({
    label: d.day,
    value: d.score,
  }));

  const quickStats = [
    { label: "Actions totales", value: "66", icon: Zap, color: "#F97316" },
    { label: "Jours actifs", value: "7 / 7", icon: Flame, color: "#EF4444" },
    { label: "Streak", value: "14 jours", icon: TrendingUp, color: "#10B981" },
  ];

  return (
    <View style={{ gap: 16 }}>
      {/* Score + stats */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={[styles.scoreCard, { flex: 1 }]}>
          <RadialScore value={78} color={T.primary} size={100} stroke={8} />
          <Text style={styles.scoreLabel}>Score hebdo</Text>
        </View>

        <View style={{ flex: 1.2, gap: 8 }}>
          {quickStats.map(({ label, value, icon: Icon, color }) => (
            <View
              key={label}
              style={[
                styles.quickStatRow,
                { backgroundColor: alpha(color, 0.09) },
              ]}
            >
              <View
                style={[
                  styles.quickStatIcon,
                  { backgroundColor: alpha(color, 0.16) },
                ]}
              >
                <Icon size={13} color={color} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.quickStatValue}>{value}</Text>
                <Text numberOfLines={1} style={styles.quickStatLabel}>
                  {label}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Score d'activité 7 jours */}
      <Card>
        <SectionTitle icon={TrendingUp} iconColor={T.primarySoft}>
          Score d'activité — 7 jours
        </SectionTitle>
        <View style={{ marginTop: 16 }}>
          <NativeAreaChart
            data={radialData}
            maxValue={100}
            color={T.primary}
            height={130}
          />
        </View>
      </Card>

      {/* Ce que tu as accompli */}
      <Card>
        <SectionTitle icon={Sparkles} iconColor={T.amberSoft}>
          Ce que tu as accompli cette semaine
        </SectionTitle>
        <View style={{ gap: 8, marginTop: 14 }}>
          {weeklySummary.map((item) => {
            const Icon = item.icon;
            return (
              <View key={item.label} style={styles.summaryRow}>
                <View
                  style={[
                    styles.summaryIcon,
                    { backgroundColor: alpha(item.color, 0.16) },
                  ]}
                >
                  <Icon size={14} color={item.color} />
                </View>
                <Text numberOfLines={1} style={styles.summaryLabel}>
                  {item.label}
                </Text>
                <Text style={styles.summaryValue}>{item.value}</Text>
              </View>
            );
          })}
        </View>
      </Card>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB — MODULES
   ════════════════════════════════════════════════════════════════════════════ */

function ModulesTab() {
  const sorted = [...MODULE_STATS].sort((a, b) => b.uses - a.uses);
  const max = sorted[0]?.uses ?? 1;

  return (
    <View style={{ gap: 16 }}>
      <Card>
        <SectionTitle icon={BarChart2} iconColor={T.primarySoft}>
          Utilisation par module (7 jours)
        </SectionTitle>
        <View style={{ marginTop: 16 }}>
          <NativeBarChart data={MODULE_STATS.slice(0, 6)} height={170} />
        </View>
      </Card>

      <Card>
        <SectionTitle icon={Target} iconColor={T.cyan}>
          Détail par module
        </SectionTitle>
        <View style={{ gap: 12, marginTop: 14 }}>
          {sorted.map((mod, i) => {
            const Icon = mod.icon;
            const ratio = (mod.uses / max) * 100;
            return (
              <AnimatedRow key={mod.name} index={i}>
                <View
                  style={[
                    styles.moduleIcon,
                    { backgroundColor: alpha(mod.color, 0.16) },
                  ]}
                >
                  <Icon size={14} color={mod.color} />
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
                  <View style={styles.moduleLabelRow}>
                    <Text numberOfLines={1} style={styles.moduleLabel}>
                      {mod.name}
                    </Text>
                    <Text style={[styles.moduleUses, { color: mod.color }]}>
                      {mod.uses}×
                    </Text>
                  </View>
                  <View style={styles.moduleTrack}>
                    <AnimatedFillBar
                      value={ratio}
                      color={mod.color}
                      delay={i * 60}
                    />
                  </View>
                </View>
              </AnimatedRow>
            );
          })}
        </View>
      </Card>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   SMALL HELPERS
   ════════════════════════════════════════════════════════════════════════════ */

function AnimatedRow({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 320,
      delay: Math.min(index * 50, 400),
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [
          {
            translateX: enter.interpolate({
              inputRange: [0, 1],
              outputRange: [-10, 0],
            }),
          },
        ],
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      {children}
    </Animated.View>
  );
}

function AnimatedFillBar({
  value,
  color,
  delay = 0,
}: {
  value: number;
  color: string;
  delay?: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(100, Math.max(0, value)),
      duration: 700,
      delay,
      useNativeDriver: false,
    }).start();
  }, [anim, value, delay]);

  return (
    <View style={styles.moduleTrack}>
      <Animated.View
        style={{
          height: "100%",
          borderRadius: 999,
          backgroundColor: color,
          width: anim.interpolate({
            inputRange: [0, 100],
            outputRange: ["0%", "100%"],
          }),
        }}
      />
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB — BADGES
   ════════════════════════════════════════════════════════════════════════════ */

function BadgesTab({
  xpLevel,
  badgeCount,
}: {
  xpLevel: number;
  badgeCount: number;
}) {
  const unlocked = BADGES.filter((b) => b.unlocked);
  const locked = BADGES.filter((b) => !b.unlocked);

  const summary = [
    { label: "Débloqués", value: badgeCount, color: T.success },
    { label: "Verrouillés", value: locked.length, color: "#6B7280" },
    { label: "Niveau XP", value: `Niv. ${xpLevel}`, color: T.primary },
  ];

  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {summary.map((s) => (
          <View
            key={s.label}
            style={[
              styles.badgeSummaryCard,
              {
                backgroundColor: alpha(s.color, 0.08),
                borderColor: alpha(s.color, 0.22),
              },
            ]}
          >
            <Text style={styles.badgeSummaryValue}>{s.value}</Text>
            <Text style={styles.badgeSummaryLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={{ gap: 10 }}>
        <SectionTitle icon={Award} iconColor={T.success}>
          Badges débloqués ({unlocked.length})
        </SectionTitle>
        {unlocked.map((badge, i) => (
          <BadgeCard key={badge.id} badge={badge} index={i} />
        ))}
      </View>

      <View style={{ gap: 10 }}>
        <SectionTitle icon={Trophy} iconColor={T.faint}>
          À débloquer ({locked.length})
        </SectionTitle>
        {locked.map((badge, i) => (
          <BadgeCard key={badge.id} badge={badge} index={unlocked.length + i} />
        ))}
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB — ANALYTICS
   ════════════════════════════════════════════════════════════════════════════ */

function AnalyticsTab({
  weeklySummary,
  budgetHealth,
}: {
  weeklySummary: {
    icon: React.ElementType;
    label: string;
    value: string;
    color: string;
  }[];
  budgetHealth: { score: number; label: string; color: string; detail: string };
}) {
  const streakWeeks = [3, 5, 2, 7, 4, 6, STREAK];
  const streakLabels = ["S-6", "S-5", "S-4", "S-3", "S-2", "S-1", "Auj"];
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const sortedModules = [...MODULE_STATS].sort((a, b) => b.uses - a.uses);
  const topSix = sortedModules.slice(0, 6);
  const maxUses = sortedModules[0]?.uses ?? 1;

  return (
    <View style={{ gap: 16 }}>
      {/* Streak */}
      <Card>
        <View style={styles.streakHead}>
          <SectionTitle icon={Flame} iconColor={T.danger}>
            Streak d'utilisation
          </SectionTitle>
          <Animated.View
            style={[
              styles.streakPill,
              {
                transform: [
                  {
                    scale: pulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.06],
                    }),
                  },
                ],
              },
            ]}
          >
            <Flame size={13} color="#F87171" fill="#F87171" />
            <Text style={styles.streakPillText}>{STREAK} jours</Text>
          </Animated.View>
        </View>

        <View style={styles.streakBars}>
          {streakWeeks.map((v, i) => (
            <View key={i} style={styles.streakBarColumn}>
              <View
                style={{
                  width: "100%",
                  height: v * 8,
                  borderRadius: 6,
                  backgroundColor: i === 6 ? T.danger : alpha(T.danger, 0.35),
                }}
              />
              <Text style={styles.streakBarLabel}>{streakLabels[i]}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.streakFoot}>
          🔥 Record personnel :{" "}
          <Text style={styles.streakFootStrong}>21 jours</Text>
        </Text>
      </Card>

      {/* Heatmap */}
      <Card>
        <SectionTitle icon={Calendar} iconColor={T.primarySoft}>
          Heatmap d'activité — 4 semaines
        </SectionTitle>
        <View style={{ marginTop: 16 }}>
          <Heatmap />
        </View>
      </Card>

      {/* Podium */}
      <Card>
        <SectionTitle icon={Trophy} iconColor={T.amberSoft}>
          Modules les plus utilisés
        </SectionTitle>
        <View style={{ marginTop: 20 }}>
          <Podium />
        </View>

        <View style={{ gap: 10, marginTop: 22 }}>
          {topSix.map((mod) => {
            const Icon = mod.icon;
            const ratio = (mod.uses / maxUses) * 100;
            return (
              <View key={mod.name} style={styles.topModuleRow}>
                <View
                  style={[
                    styles.topModuleIcon,
                    { backgroundColor: alpha(mod.color, 0.16) },
                  ]}
                >
                  <Icon size={12} color={mod.color} />
                </View>
                <Text numberOfLines={1} style={styles.topModuleLabel}>
                  {mod.name}
                </Text>
                <View style={{ flex: 1 }}>
                  <AnimatedFillBar value={ratio} color={mod.color} />
                </View>
                <Text style={styles.topModuleUses}>{mod.uses}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      {/* Résumé */}
      <Card>
        <SectionTitle icon={Sparkles} iconColor={T.primarySoft}>
          Cette semaine tu as…
        </SectionTitle>
        <View style={{ gap: 8, marginTop: 14 }}>
          {weeklySummary.map((item) => {
            const Icon = item.icon;
            return (
              <View
                key={item.label}
                style={[
                  styles.weekSummaryRow,
                  { backgroundColor: alpha(item.color, 0.07) },
                ]}
              >
                <View
                  style={[
                    styles.summaryIcon,
                    { backgroundColor: alpha(item.color, 0.16) },
                  ]}
                >
                  <Icon size={14} color={item.color} />
                </View>
                <Text numberOfLines={1} style={styles.summaryLabel}>
                  {item.label}
                </Text>
                <Text style={styles.summaryValue}>{item.value}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      {/* Score de santé financière */}
      <Card>
        <SectionTitle icon={TrendingUp} iconColor={T.success}>
          Score de santé financière
        </SectionTitle>

        <View style={styles.financeRow}>
          <RadialScore
            value={budgetHealth.score}
            color={budgetHealth.color}
            size={92}
            stroke={7}
          />

          <View style={{ flex: 1, gap: 8 }}>
            <View style={styles.financeHead}>
              {budgetHealth.score >= 70 ? (
                <CheckCircle size={15} color={budgetHealth.color} />
              ) : budgetHealth.score >= 50 ? (
                <AlertCircle size={15} color={budgetHealth.color} />
              ) : (
                <TrendingDown size={15} color={budgetHealth.color} />
              )}
              <Text
                style={[styles.financeLabel, { color: budgetHealth.color }]}
              >
                {budgetHealth.label}
              </Text>
            </View>
            <Text style={styles.financeDetail}>{budgetHealth.detail}</Text>

            {[
              { label: "Dépenses vs budget", ok: budgetHealth.score > 60 },
              { label: "Épargne active", ok: budgetHealth.score > 75 },
              {
                label: "Aucune catégorie critique",
                ok: budgetHealth.score > 50,
              },
            ].map((tip) => (
              <View key={tip.label} style={styles.financeCheckRow}>
                {tip.ok ? (
                  <CheckCircle size={11} color="#4ADE80" />
                ) : (
                  <AlertCircle size={11} color={T.amberSoft} />
                )}
                <Text style={styles.financeCheckText}>{tip.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </Card>

      {/* Tendance modules */}
      <Card>
        <SectionTitle icon={BarChart2} iconColor={T.primarySoft}>
          Tendance d'utilisation — 4 semaines
        </SectionTitle>
        <View style={{ marginTop: 16 }}>
          <NativeAreaChart
            data={MODULE_TREND.map((w) => ({
              label: w.week,
              value: w.messages,
            }))}
            maxValue={Math.max(...MODULE_TREND.map((w) => w.messages))}
            color="#3B82F6"
            height={130}
          />
        </View>
        <View style={styles.legendRow}>
          {[
            { label: "Messages", color: "#3B82F6" },
            { label: "Transport", color: "#F59E0B" },
            { label: "Immo", color: "#F97316" },
          ].map((l) => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color }]} />
              <Text style={styles.legendText}>{l.label}</Text>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════════════ */

const XP_CURRENT_FALLBACK = 3_240;
const XP_NEXT_FALLBACK = 4_000;
const XP_LEVEL_FALLBACK = 12;

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "activite", label: "Activité", icon: Flame },
  { id: "modules", label: "Modules", icon: Target },
  { id: "badges", label: "Badges", icon: Award },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
];

export default function DashboardPage({ onBack }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState<TabId>("activite");
  const [refreshing, setRefreshing] = useState(false);

  const panelOpacity = useRef(new Animated.Value(1)).current;
  const panelTranslate = useRef(new Animated.Value(0)).current;

  const budgetHealth = useMemo(() => getBudgetHealthScore(), []);

  const weeklySummary = useMemo(() => {
    const agendaCount = (() => {
      try {
        if (typeof localStorage === "undefined") return 0;
        const raw = localStorage.getItem("debrouille_agenda_events");
        return raw ? (JSON.parse(raw) as unknown[]).length : 0;
      } catch {
        return 0;
      }
    })();
    const postsCount = (() => {
      try {
        if (typeof localStorage === "undefined") return 0;
        const raw = localStorage.getItem("debrouille_community_posts");
        return raw ? (JSON.parse(raw) as unknown[]).length : 0;
      } catch {
        return 0;
      }
    })();

    return [
      {
        icon: MessageSquare,
        label: "Posts communautaires",
        value: String(postsCount),
        color: "#8B5CF6",
      },
      { icon: Zap, label: "Actions rapides", value: "66", color: "#F97316" },
      {
        icon: Calendar,
        label: "Événements agenda",
        value: String(agendaCount),
        color: "#6366F1",
      },
      {
        icon: MessageCircle,
        label: "Messages envoyés",
        value: "41",
        color: "#3B82F6",
      },
      { icon: Trophy, label: "XP gagnés", value: "+340", color: "#F59E0B" },
    ];
  }, []);

  const { user } = useFirebaseAuth();
  const liveStats = useQuery(api.utility.getDashboardStats, user ? {} : "skip");

  const xpCurrent = liveStats?.totalXp ?? XP_CURRENT_FALLBACK;
  const xpLevel = liveStats?.level ?? XP_LEVEL_FALLBACK;
  const xpNext = liveStats?.xpForNextLevel ?? XP_NEXT_FALLBACK;
  const xpPercent = Math.round(
    Math.min((xpCurrent / Math.max(1, xpNext)) * 100, 100),
  );
  const badgeCount =
    liveStats?.badgeCount ?? BADGES.filter((b) => b.unlocked).length;

  const xpBarAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(xpBarAnim, {
      toValue: xpPercent,
      duration: 1100,
      delay: 300,
      useNativeDriver: false,
    }).start();
  }, [xpBarAnim, xpPercent]);

  const switchTab = useCallback(
    (next: TabId) => {
      if (next === activeTab) return;
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
        setActiveTab(next);
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
    [activeTab, panelOpacity, panelTranslate],
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowBottom} />

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
            <Text style={styles.title}>Tableau de bord</Text>
            <Text style={styles.subtitle}>Ta semaine en un coup d'œil</Text>
          </View>

          <View style={styles.levelPill}>
            <Sparkles size={11} color={T.primarySoft} />
            <Text style={styles.levelPillText}>Niv. {xpLevel}</Text>
          </View>
        </View>

        {/* XP Bar */}
        <View style={styles.xpCard}>
          <View style={styles.xpHead}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Trophy size={13} color={T.amberSoft} />
              <Text style={styles.xpTitle}>Niveau {xpLevel} — Expert</Text>
            </View>
            <Text style={styles.xpCounter}>
              {xpCurrent.toLocaleString()}/{xpNext.toLocaleString()} XP
            </Text>
          </View>
          <View style={styles.xpTrack}>
            <Animated.View
              style={[
                styles.xpFill,
                {
                  width: xpBarAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.xpHint}>
            {Math.max(0, xpNext - xpCurrent).toLocaleString()} XP pour atteindre
            le niveau {xpLevel + 1}
          </Text>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 20, paddingTop: 14 }}
          style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
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
          {activeTab === "activite" && (
            <ActiviteTab weeklySummary={weeklySummary} />
          )}
          {activeTab === "modules" && <ModulesTab />}
          {activeTab === "badges" && (
            <BadgesTab xpLevel={xpLevel} badgeCount={badgeCount} />
          )}
          {activeTab === "analytics" && (
            <AnalyticsTab
              weeklySummary={weeklySummary}
              budgetHealth={budgetHealth}
            />
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  glowTop: {
    position: "absolute",
    top: -150,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 200,
    backgroundColor: alpha(T.primary, 0.14),
  },
  glowBottom: {
    position: "absolute",
    bottom: 60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 200,
    backgroundColor: alpha(T.primary, 0.08),
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
  subtitle: { color: T.faint, fontSize: 11.5, marginTop: 2, fontWeight: "600" },
  levelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: alpha(T.primary, 0.16),
    borderWidth: 1,
    borderColor: alpha(T.primary, 0.4),
  },
  levelPillText: {
    color: T.primarySoft,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  /* XP card */
  xpCard: {
    marginTop: 18,
    padding: 14,
    borderRadius: 20,
    backgroundColor: alpha(T.primary, 0.08),
    borderWidth: 1,
    borderColor: alpha(T.primary, 0.24),
    gap: 10,
  },
  xpHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  xpTitle: {
    color: T.text,
    fontSize: 12.5,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  xpCounter: {
    color: T.faint,
    fontSize: 11,
    fontWeight: "700",
  },
  xpTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  xpFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: T.primary,
  },
  xpHint: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "600",
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
  tabPillText: { color: T.faint, fontSize: 12, fontWeight: "700" },

  content: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 60 },

  /* Card */
  card: {
    padding: 16,
    borderRadius: 24,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },

  /* Section title */
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitleIcon: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitleText: {
    color: T.dim,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  /* Radial */
  radialValue: {
    color: T.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  /* Score card */
  scoreCard: {
    padding: 14,
    borderRadius: 22,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  scoreLabel: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  /* Quick stats */
  quickStatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 14,
  },
  quickStatIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quickStatValue: {
    color: T.text,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  quickStatLabel: {
    color: T.faint,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },

  /* Native charts */
  chartTooltip: {
    position: "absolute",
    top: -34,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(10,10,26,0.96)",
    borderWidth: 1,
    borderColor: alpha(T.primary, 0.4),
    zIndex: 5,
  },
  chartTooltipLabel: {
    color: T.faint,
    fontSize: 9.5,
    fontWeight: "700",
  },
  chartTooltipValue: {
    fontSize: 11.5,
    fontWeight: "900",
    marginTop: 2,
  },

  /* Summary rows */
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryLabel: {
    flex: 1,
    color: T.dim,
    fontSize: 12.5,
    fontWeight: "600",
  },
  summaryValue: {
    color: T.text,
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  weekSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
  },

  /* Module bars */
  moduleIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  moduleLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  moduleLabel: {
    color: T.dim,
    fontSize: 12.5,
    fontWeight: "700",
    flex: 1,
  },
  moduleUses: {
    fontSize: 12,
    fontWeight: "900",
  },
  moduleTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },

  /* Badges */
  badgeSummaryCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  badgeSummaryValue: {
    color: T.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  badgeSummaryLabel: {
    color: T.faint,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  badgeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeEmblem: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  badgeLabel: {
    fontSize: 13.5,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  badgeDesc: {
    fontSize: 11.5,
    marginTop: 3,
    lineHeight: 16,
    fontWeight: "600",
  },
  badgeLockPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: T.border,
  },
  badgeLockText: {
    color: T.faint,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  badgeDatePill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeDateText: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  /* Streak */
  streakHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: alpha(T.danger, 0.16),
    borderWidth: 1,
    borderColor: alpha(T.danger, 0.32),
  },
  streakPillText: {
    color: "#F87171",
    fontSize: 11,
    fontWeight: "900",
  },
  streakBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 18,
  },
  streakBarColumn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  streakBarLabel: {
    color: T.faint,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  streakFoot: {
    color: T.dim,
    fontSize: 11.5,
    fontWeight: "600",
    marginTop: 12,
  },
  streakFootStrong: {
    color: T.text,
    fontWeight: "800",
  },

  /* Heatmap */
  heatmapLegend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
    marginTop: 14,
  },
  heatmapLegendText: {
    color: T.faint,
    fontSize: 9.5,
    fontWeight: "700",
    marginHorizontal: 4,
  },

  /* Podium */
  podiumWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 12,
  },
  podiumColumn: {
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  podiumMedal: { fontSize: 20 },
  podiumBar: {
    width: "100%",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 10,
    gap: 4,
  },
  podiumUses: {
    color: T.text,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: -0.1,
  },
  podiumName: {
    color: T.faint,
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },

  /* Top module rows */
  topModuleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  topModuleIcon: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  topModuleLabel: {
    color: T.dim,
    fontSize: 11.5,
    fontWeight: "700",
    width: 70,
  },
  topModuleUses: {
    color: T.faint,
    fontSize: 11.5,
    fontWeight: "900",
    minWidth: 22,
    textAlign: "right",
  },

  /* Finance */
  financeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 16,
  },
  financeHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  financeLabel: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  financeDetail: {
    color: T.dim,
    fontSize: 11.5,
    fontWeight: "600",
    marginBottom: 4,
  },
  financeCheckRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  financeCheckText: {
    color: T.dim,
    fontSize: 10.5,
    fontWeight: "600",
  },

  /* Legend */
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginTop: 14,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendText: {
    color: T.faint,
    fontSize: 10,
    fontWeight: "700",
  },
});
