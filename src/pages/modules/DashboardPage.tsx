import { View, Pressable, Text } from "react-native";
import { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  ArrowLeft,
  Zap,
  Trophy,
  TrendingUp,
  Flame,
  Target,
  Award,
  ChevronRight,
  Sparkles,
  Building2,
  Bus,
  Briefcase,
  Heart,
  Package,
  Map,
  MessageCircle,
  Leaf,
  Newspaper,
  PartyPopper,
  BarChart2,
  CheckCircle,
  AlertCircle,
  TrendingDown,
  Calendar,
  MessageSquare,
} from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

// ─── Data ────────────────────────────────────────────────────────────────────

const weeklyActivity = [
  { day: "Lun", score: 42, actions: 5 },
  { day: "Mar", score: 68, actions: 9 },
  { day: "Mer", score: 55, actions: 7 },
  { day: "Jeu", score: 87, actions: 13 },
  { day: "Ven", score: 72, actions: 10 },
  { day: "Sam", score: 91, actions: 14 },
  { day: "Auj", score: 63, actions: 8 },
];

const moduleStats = [
  { name: "Immo", uses: 18, color: "#F97316", icon: Building2 },
  { name: "Transport", uses: 14, color: "#3B82F6", icon: Bus },
  { name: "Emplois", uses: 11, color: "#8B5CF6", icon: Briefcase },
  { name: "Santé", uses: 9, color: "#EF4444", icon: Heart },
  { name: "Livraison", uses: 7, color: "#F59E0B", icon: Package },
  { name: "Carte", uses: 6, color: "#6366F1", icon: Map },
  { name: "Messages", uses: 22, color: "#3B82F6", icon: MessageCircle },
  { name: "Agri", uses: 4, color: "#22C55E", icon: Leaf },
  { name: "Media", uses: 8, color: "#06B6D4", icon: Newspaper },
  { name: "Événements", uses: 5, color: "#EC4899", icon: PartyPopper },
];

const radialData = [{ name: "Score hebdo", value: 78, fill: "#8B5CF6" }];

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

const weekSummary = [
  { icon: "📋", label: "Annonces publiées", value: "3" },
  { icon: "💬", label: "Messages envoyés", value: "41" },
  { icon: "🗺️", label: "Explorations carte", value: "6" },
  { icon: "🌱", label: "Conseils Agri consultés", value: "9" },
  { icon: "⚡", label: "Actions rapides", value: "66" },
];

const XP_CURRENT = 3_240;
const XP_NEXT = 4_000;
const XP_LEVEL = 12;
const XP_PERCENT = Math.round((XP_CURRENT / XP_NEXT) * 100);

// ─── Analytics data ──────────────────────────────────────────────────────────

// Generate last 28 days activity heatmap
function generateHeatmap(): { date: string; level: number }[] {
  const cells = [];
  const today = new Date();
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    // Simulate varying activity levels 0-4
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

const heatmapData = generateHeatmap();

const HEATMAP_COLORS = [
  "rgba(255,255,255,0.05)",
  "rgba(99,102,241,0.25)",
  "rgba(99,102,241,0.45)",
  "rgba(99,102,241,0.7)",
  "#6366F1",
];

// Streak: count consecutive active days from today going back
function computeStreak(): number {
  let streak = 0;
  for (let i = 0; i < heatmapData.length; i++) {
    const cell = heatmapData[heatmapData.length - 1 - i];
    if (cell.level > 0) streak++;
    else break;
  }
  return streak;
}

const STREAK = computeStreak();

// Budget health score from localStorage budget data
function getBudgetHealthScore(): {
  score: number;
  label: string;
  color: string;
  detail: string;
} {
  try {
    const raw = localStorage.getItem("debrouille_budget_categories");
    if (!raw)
      return {
        score: 72,
        label: "Bien",
        color: "#10B981",
        detail: "Pas de données budget",
      };
    const cats: { spent: number; limit: number }[] = JSON.parse(raw);
    const total = cats.reduce((sum, c) => sum + c.limit, 0);
    const spent = cats.reduce((sum, c) => sum + c.spent, 0);
    if (total === 0)
      return {
        score: 72,
        label: "Bien",
        color: "#10B981",
        detail: "Budget non configuré",
      };
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
    return {
      score: 72,
      label: "Bien",
      color: "#10B981",
      detail: "Données insuffisantes",
    };
  }
}

// Monthly modules usage trend (last 4 weeks)
const moduleTrendData = [
  { week: "S-3", messages: 8, transport: 4, immo: 5, sante: 2 },
  { week: "S-2", messages: 12, transport: 6, immo: 9, sante: 4 },
  { week: "S-1", messages: 18, transport: 10, immo: 14, sante: 6 },
  { week: "Sem.", messages: 22, transport: 14, immo: 18, sante: 9 },
];

// Weekly summary dynamic
function getWeeklySummary() {
  const agendaRaw = localStorage.getItem("debrouille_agenda_events");
  const agendaCount = agendaRaw
    ? (JSON.parse(agendaRaw) as unknown[]).length
    : 0;
  const communityRaw = localStorage.getItem("debrouille_community_posts");
  const postsCount = communityRaw
    ? (JSON.parse(communityRaw) as unknown[]).length
    : 0;
  return [
    {
      icon: MessageSquare,
      label: "Posts communautaires",
      value: postsCount.toString(),
      color: "#8B5CF6",
    },
    { icon: Zap, label: "Actions rapides", value: "66", color: "#F97316" },
    {
      icon: Calendar,
      label: "Événements agenda",
      value: agendaCount.toString(),
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
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">{children}</Text>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={`rounded-3xl p-4 ${className}`} style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>{children}</View>
  );
}

// Custom tooltip for activity chart
function ActivityTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <View className="rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: "rgba(10,10,26,0.95)", borderWidth: 1, borderColor: "rgba(139,92,246,0.4)", borderStyle: "solid" }}><Text className="text-white/50 mb-0.5">{label}</Text><Text className="text-purple-400 font-bold">{payload[0].value}pts</Text></View>
  );
}

function BarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; fill: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <View className="rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: "rgba(10,10,26,0.95)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", borderStyle: "solid" }}><Text className="text-white/50 mb-0.5">{label}</Text><Text className="font-bold" style={{ color: payload[0].fill }}>{payload[0].value}fois
      </Text></View>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<
    "activite" | "modules" | "badges" | "analytics"
  >("activite");
  const budgetHealth = useMemo(() => getBudgetHealthScore(), []);
  const weeklySummary = useMemo(() => getWeeklySummary(), []);

  // Live stats from Convex (only when authenticated)
  const { user } = useFirebaseAuth();
  const liveStats = useQuery(api.utility.getDashboardStats, user ? {} : "skip");

  const xpCurrent = liveStats?.totalXp ?? XP_CURRENT;
  const xpLevel = liveStats?.level ?? XP_LEVEL;
  const xpNext = liveStats?.xpForNextLevel ?? XP_NEXT;
  const xpPercent = Math.round(Math.min((xpCurrent / xpNext) * 100, 100));
  const badgeCount =
    liveStats?.badgeCount ?? BADGES.filter((b) => b.unlocked).length;

  return (
    <View className="h-full flex flex-col overflow-hidden" style={{  }}>{}<View className="absolute top-0 right-0 w-64 h-64 pointer-events-none rounded-full" style={{  }} /><View className="absolute bottom-32 left-0 w-48 h-48 pointer-events-none rounded-full" style={{  }} />{}<View initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex-shrink-0 px-5 pt-12 pb-4" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }}><View className="flex items-center gap-3 mb-4"><Pressable onPress={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><ArrowLeft size={20} className="text-white" /></Pressable><View className="flex-1"><Text className="text-xl font-black text-white tracking-tight">Tableau de Bord
            </Text><Text className="text-white/40 text-xs">Semaine du 2–8 juin 2025</Text></View><View className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: "rgba(139,92,246,0.2)", borderWidth: 1, borderColor: "rgba(139,92,246,0.4)", borderStyle: "solid" }}><Sparkles size={12} className="text-purple-400" /><Text className="text-xs font-black text-purple-400">Niv. {xpLevel}</Text></View></View>{}<View className="rounded-2xl p-3" style={{ backgroundColor: "rgba(139,92,246,0.1)", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", borderStyle: "solid" }}><View className="flex items-center justify-between mb-2"><View className="flex items-center gap-2"><Trophy size={14} className="text-yellow-400" /><Text className="text-xs font-bold text-white">Niveau {xpLevel}— Expert Débrouille
              </Text></View><Text className="text-xs text-white/50">{xpCurrent.toLocaleString()}/ {xpNext.toLocaleString()}XP
            </Text></View><View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><View initial={{ width: 0 }} animate={{ width: `${xpPercent}%` }} transition={{ delay: 0.4, duration: 1, ease: "easeOut" }} className="h-full rounded-full" style={{  }} /></View><Text className="text-[10px] text-white/30 mt-1.5">{xpNext - xpCurrent}XP pour atteindre le niveau {xpLevel + 1}</Text></View></View>{}<View className="flex-shrink-0 flex gap-1 px-5 py-3 overflow-x-auto" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" }}>{(["activite", "modules", "badges", "analytics"] as const).map(
          (tab) => {
            const labels = {
              activite: "Activité",
              modules: "Modules",
              badges: "Badges",
              analytics: "Analytics",
            };
            const icons = {
              activite: Flame,
              modules: Target,
              badges: Award,
              analytics: BarChart2,
            };
            const Icon = icons[tab];
            const isActive = activeTab === tab;
            return (
              <Pressable key={tab} whileTap={{ scale: 0.93 }} onPress={() => setActiveTab(tab)} className="flex-shrink-0 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all" style={{ backgroundColor: isActive
                                  ? "rgba(139,92,246,0.25)"
                                  : "transparent", borderColor: "rgba(139,92,246,0.4)", borderStyle: "solid" }}>
                <Icon size={13} />
                {labels[tab]}
              </Pressable>
            );
          },
        )}</View>{}<View className="flex-1 overflow-y-auto px-5 py-4 pb-8" style={{  }}>{}{activeTab === "activite" && (
          <View initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
            {/* Score hebdo radial + total */}
            <View className="gap-3">{}<Card className="flex flex-col items-center justify-center py-3"><ResponsiveContainer width="100%" height={100}><RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="90%" startAngle={220} endAngle={-40} data={radialData}><RadialBar dataKey="value" background={{ fill: "rgba(255,255,255,0.06)" }} cornerRadius={8} /></RadialBarChart></ResponsiveContainer><Text className="text-2xl font-black text-white -mt-2">78</Text><Text className="text-[10px] text-white/40">Score hebdo</Text></Card>{}<View className="flex flex-col gap-2">{[
                  {
                    label: "Actions totales",
                    value: "66",
                    icon: Zap,
                    color: "#F97316",
                  },
                  {
                    label: "Jours actifs",
                    value: "7 / 7",
                    icon: Flame,
                    color: "#EF4444",
                  },
                  {
                    label: "Streak",
                    value: "14 jours",
                    icon: TrendingUp,
                    color: "#10B981",
                  },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <View key={s.label} className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5" style={{ backgroundColor: `${s.color}12`, borderStyle: "solid" }}><Icon size={14} style={{  }} className="flex-shrink-0" /><View className="min-w-0"><Text className="text-white font-black text-sm leading-none">{s.value}</Text><Text className="text-white/40 text-[9px] mt-0.5 truncate">{s.label}</Text></View></View>
                  );
                })}</View></View>

            {/* Area chart – weekly score */}
            <Card>
              <SectionTitle>Score d'activité — 7 jours</SectionTitle>
              <ResponsiveContainer width="100%" height={130}>
                <AreaChart
                  data={weeklyActivity}
                  margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                >
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<ActivityTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#8B5CF6"
                    strokeWidth={2.5}
                    fill="url(#scoreGrad)"
                    dot={{ fill: "#8B5CF6", r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#A78BFA" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Weekly summary */}
            <Card>
              <SectionTitle>Ce que tu as accompli cette semaine</SectionTitle>
              <View className="flex flex-col gap-2">{weekSummary.map((item, i) => (
                  <View key={item.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                    <Text className="text-lg w-7 text-center flex-shrink-0">{item.icon}</Text>
                    <Text className="flex-1 text-sm text-white/70">{item.label}</Text>
                    <Text className="font-black text-white text-sm">{item.value}</Text>
                    <ChevronRight size={13} className="text-white/20" />
                  </View>
                ))}</View>
            </Card>
          </View>
        )}{}{activeTab === "modules" && (
          <View initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
            <Card>
              <SectionTitle>Utilisation par module (7 jours)</SectionTitle>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={moduleStats}
                  margin={{ top: 4, right: 4, bottom: 4, left: -20 }}
                  barSize={14}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<BarTooltip />}
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  />
                  <Bar dataKey="uses" radius={[6, 6, 0, 0]}>
                    {moduleStats.map((entry, i) => (
                      <rect key={`bar-${i}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Module list with progress bars */}
            <Card>
              <SectionTitle>Détail par module</SectionTitle>
              <View className="flex flex-col gap-3">{moduleStats
                  .sort((a, b) => b.uses - a.uses)
                  .map((mod, i) => {
                    const Icon = mod.icon;
                    const maxUses = moduleStats[0].uses;
                    return (
                      <View key={mod.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3">
                        <View className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${mod.color}18`, borderStyle: "solid" }}><Icon size={14} style={{  }} /></View>
                        <View className="flex-1 min-w-0"><View className="flex items-center justify-between mb-1"><Text className="text-xs font-semibold text-white/75 truncate">{mod.name}</Text><Text className="text-xs font-black text-white/60 ml-2 flex-shrink-0">{mod.uses}×
                            </Text></View><View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}><View initial={{ width: 0 }} animate={{
                                width: `${(mod.uses / maxUses) * 100}%`,
                              }} transition={{
                                delay: 0.2 + i * 0.04,
                                duration: 0.7,
                                ease: "easeOut",
                              }} className="h-full rounded-full" style={{ backgroundColor: mod.color }} /></View></View>
                      </View>
                    );
                  })}</View>
            </Card>
          </View>
        )}{}{activeTab === "badges" && (
          <View initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
            {/* Summary */}
            <View className="gap-3">{[
                { label: "Débloqués", value: badgeCount, color: "#10B981" },
                {
                  label: "Verrouillés",
                  value: BADGES.filter((b) => !b.unlocked).length,
                  color: "#6B7280",
                },
                {
                  label: "Niveau XP",
                  value: `Niv. ${xpLevel}`,
                  color: "#8B5CF6",
                },
              ].map((s) => (
                <View key={s.label} className="rounded-2xl p-3 text-center" style={{ backgroundColor: `${s.color}12`, borderStyle: "solid" }}><Text className="text-xl font-black text-white">{s.value}</Text><Text className="text-[10px] text-white/40 mt-0.5">{s.label}</Text></View>
              ))}</View>

            {/* Unlocked badges */}
            <View><SectionTitle>Badges débloqués ({BADGES.filter((b) => b.unlocked).length})
              </SectionTitle><View className="gap-3">{BADGES.filter((b) => b.unlocked).map((badge, i) => (
                  <View key={badge.id} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{
                      delay: i * 0.07,
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                    }} className="rounded-3xl p-4 flex flex-col items-center gap-2 text-center" style={{ backgroundColor: `${badge.color}10`, borderStyle: "solid" }}>
                    <Text className="text-3xl">{badge.icon}</Text>
                    <View><Text className="text-xs font-bold text-white">{badge.label}</Text><Text className="text-[10px] text-white/40 mt-0.5">{badge.desc}</Text></View>
                    {badge.date && (
                      <Text className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${badge.color}20`, color: badge.color }}>{badge.date}</Text>
                    )}
                  </View>
                ))}</View></View>

            {/* Locked badges */}
            <View><SectionTitle>À débloquer ({BADGES.filter((b) => !b.unlocked).length})
              </SectionTitle><View className="gap-3">{BADGES.filter((b) => !b.unlocked).map((badge, i) => (
                  <View key={badge.id} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.07 }} className="rounded-3xl p-4 flex flex-col items-center gap-2 text-center opacity-40" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                    <Text className="text-3xl grayscale">{badge.icon}</Text>
                    <View><Text className="text-xs font-bold text-white/60">{badge.label}</Text><Text className="text-[10px] text-white/30 mt-0.5">{badge.desc}</Text></View>
                    <Text className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)" }}>Verrouillé
                    </Text>
                  </View>
                ))}</View></View>
          </View>
        )}{}{activeTab === "analytics" && (
          <View initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
            {/* Streak tracker */}
            <Card>
              <View className="flex items-center justify-between mb-3"><SectionTitle>Streak d'utilisation</SectionTitle><View animate={{ scale: [1, 1.15, 1] }} transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut",
                  }} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(239,68,68,0.15)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)", borderStyle: "solid" }}><Flame size={14} className="text-red-400" /><Text className="text-sm font-black text-red-400">{STREAK}jours
                  </Text></View></View>
              <View className="flex items-end gap-1.5 mb-2">{[3, 5, 2, 7, 4, 6, STREAK].map((v, i) => (
                  <View key={i} className="flex-1 flex flex-col items-center gap-1"><View className="w-full rounded-t-md transition-all" style={{ height: `${v * 8}px`, backgroundColor: i === 6 ? "#EF4444" : "rgba(239,68,68,0.35)" }} /><Text className="text-[9px] text-white/30">{["S-6", "S-5", "S-4", "S-3", "S-2", "S-1", "Auj"][i]}</Text></View>
                ))}</View>
              <Text className="text-xs text-white/40 mt-1">🔥 Record personnel :{" "}<Text className="text-white/70 font-semibold">21 jours</Text></Text>
            </Card>

            {/* Activity heatmap – GitHub style */}
            <Card>
              <SectionTitle>Heatmap d'activité — 4 semaines</SectionTitle>
              <View className="gap-1" style={{  }}>{["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                  <View key={i} className="text-center text-[9px] text-white/25 pb-1">{d}</View>
                ))}{heatmapData.map((cell, i) => (
                  <View key={cell.date} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.012 }} title={`${cell.date}: niveau ${cell.level}`} className="aspect-square rounded-sm" style={{ backgroundColor: HEATMAP_COLORS[cell.level] }} />
                ))}</View>
              <View className="flex items-center gap-1 mt-2 justify-end"><Text className="text-[9px] text-white/25">Moins</Text>{HEATMAP_COLORS.map((c, i) => (
                  <View key={i} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c }} />
                ))}<Text className="text-[9px] text-white/25">Plus</Text></View>
            </Card>

            {/* Top modules podium */}
            <Card>
              <SectionTitle>Modules les plus utilisés</SectionTitle>
              {/* Podium */}
              <View className="flex items-end justify-center gap-3 mb-4">{moduleStats
                  .sort((a, b) => b.uses - a.uses)
                  .slice(0, 3)
                  .map((mod, i) => {
                    const heights = [100, 70, 55];
                    const medals = ["🥇", "🥈", "🥉"];
                    const Icon = mod.icon;
                    return (
                      <View key={mod.name} className="flex flex-col items-center gap-1"><Text className="text-lg">{medals[i]}</Text><View className="w-16 flex flex-col items-center justify-end rounded-t-xl px-1" style={{ height: `${heights[i]}px`, backgroundColor: `${mod.color}25`, borderStyle: "solid" }}><Icon size={16} style={{  }} /><Text className="text-[9px] text-white/60 mt-1">{mod.uses}×
                          </Text></View><Text className="text-[10px] text-white/60 text-center w-16 truncate">{mod.name}</Text></View>
                    );
                  })}</View>
              {/* Horizontal bars */}
              {moduleStats
                .sort((a, b) => b.uses - a.uses)
                .slice(0, 6)
                .map((mod, i) => {
                  const max = moduleStats[0].uses;
                  const Icon = mod.icon;
                  return (
                    <View key={mod.name} className="flex items-center gap-2 mb-2"><View className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${mod.color}18` }}><Icon size={11} style={{  }} /></View><Text className="text-xs text-white/60 w-20 flex-shrink-0 truncate">{mod.name}</Text><View className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}><View initial={{ width: 0 }} animate={{ width: `${(mod.uses / max) * 100}%` }} transition={{
                            delay: 0.2 + i * 0.07,
                            duration: 0.7,
                            ease: "easeOut",
                          }} className="h-full rounded-full" style={{ backgroundColor: mod.color }} /></View><Text className="text-xs font-bold text-white/50 w-6 text-right flex-shrink-0">{mod.uses}</Text></View>
                  );
                })}
            </Card>

            {/* Weekly summary */}
            <Card>
              <SectionTitle>Cette semaine vous avez…</SectionTitle>
              <View className="flex flex-col gap-2">{weeklySummary.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <View key={item.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl" style={{ backgroundColor: `${item.color}0d` }}>
                      <View className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${item.color}18` }}><Icon size={14} style={{  }} /></View>
                      <Text className="flex-1 text-sm text-white/70">{item.label}</Text>
                      <Text className="font-black text-white text-sm">{item.value}</Text>
                    </View>
                  );
                })}</View>
            </Card>

            {/* Financial health score */}
            <Card>
              <SectionTitle>Score de santé financière</SectionTitle>
              <View className="flex items-center gap-4">{}<View className="relative w-20 h-20 flex-shrink-0"><svg viewBox="0 0 80 80" className="w-full h-full -rotate-90"><circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" /><motion.circle cx="40" cy="40" r="32" fill="none" stroke={budgetHealth.color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 32}`} initial={{ strokeDashoffset: 2 * Math.PI * 32 }} animate={{
                        strokeDashoffset:
                          2 * Math.PI * 32 * (1 - budgetHealth.score / 100),
                      }} transition={{
                        duration: 1.2,
                        delay: 0.3,
                        ease: "easeOut",
                      }} /></svg><View className="absolute inset-0 flex flex-col items-center justify-center"><Text className="text-lg font-black text-white">{budgetHealth.score}</Text><Text className="text-[8px] text-white/40">/100</Text></View></View><View className="flex-1"><View className="flex items-center gap-2 mb-1">{budgetHealth.score >= 70 ? (
                      <CheckCircle
                        size={16}
                        style={{  }}
                      />
                    ) : budgetHealth.score >= 50 ? (
                      <AlertCircle
                        size={16}
                        style={{  }}
                      />
                    ) : (
                      <TrendingDown
                        size={16}
                        style={{  }}
                      />
                    )}<Text className="font-bold text-sm" style={{ color: budgetHealth.color }}>{budgetHealth.label}</Text></View><Text className="text-xs text-white/50 mb-2">{budgetHealth.detail}</Text><View className="flex flex-col gap-1">{[
                      {
                        label: "Dépenses vs budget",
                        ok: budgetHealth.score > 60,
                      },
                      { label: "Épargne active", ok: budgetHealth.score > 75 },
                      {
                        label: "Aucune catégorie critique",
                        ok: budgetHealth.score > 50,
                      },
                    ].map((tip) => (
                      <View key={tip.label} className="flex items-center gap-1.5">
                        {tip.ok ? (
                          <CheckCircle
                            size={11}
                            className="text-green-400 flex-shrink-0"
                          />
                        ) : (
                          <AlertCircle
                            size={11}
                            className="text-yellow-400 flex-shrink-0"
                          />
                        )}
                        <Text className="text-[10px] text-white/50">
                          {tip.label}
                        </Text>
                      </View>
                    ))}</View></View></View>
            </Card>

            {/* Module trend */}
            <Card>
              <SectionTitle>Tendance d'utilisation — 4 semaines</SectionTitle>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart
                  data={moduleTrendData}
                  margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                >
                  <defs>
                    {[
                      { id: "msg", color: "#3B82F6" },
                      { id: "trp", color: "#F59E0B" },
                      { id: "imm", color: "#F97316" },
                    ].map((g) => (
                      <linearGradient
                        key={g.id}
                        id={g.id}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={g.color}
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="100%"
                          stopColor={g.color}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                  />
                  <XAxis
                    dataKey="week"
                    tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(10,10,26,0.95)",
                      border: "1px solid rgba(99,102,241,0.3)",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="messages"
                    name="Messages"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#msg)"
                  />
                  <Area
                    type="monotone"
                    dataKey="transport"
                    name="Transport"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    fill="url(#trp)"
                  />
                  <Area
                    type="monotone"
                    dataKey="immo"
                    name="Immo"
                    stroke="#F97316"
                    strokeWidth={2}
                    fill="url(#imm)"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <View className="flex gap-3 mt-2 justify-center">
                {[
                  { label: "Messages", color: "#3B82F6" },
                  { label: "Transport", color: "#F59E0B" },
                  { label: "Immo", color: "#F97316" },
                ].map((l) => (
                  <View key={l.label} className="flex items-center gap-1">
                    <View className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                    <Text className="text-[10px] text-white/40">{l.label}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        )}</View></View>
  );
}
