import { Pressable, View, Text } from "react-native";
import { useState, useMemo } from "react";
import {
  ArrowLeft, Dumbbell, Salad, Moon, Heart, TrendingUp,
  Flame, Target, ChevronRight, Sparkles, CheckCircle2,
  BarChart2, Calendar, Award, Zap, Sun, Wind,
} from "lucide-react-native";
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area,
} from "recharts";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";
import { SignInButton } from "@/components/ui/signin";

// ─── Types & helpers ──────────────────────────────────────────────────────────

type GoalStatus = "on_track" | "behind" | "done";

interface SmartGoal {
  id: string;
  label: string;
  target: number;
  current: number;
  unit: string;
  color: string;
  module: "fitness" | "nutrition" | "meditation";
  status: GoalStatus;
}

interface DayData {
  day: string;
  fitness: number;
  nutrition: number;
  meditation: number;
  score: number;
}

// Read data from localStorage written by fitness/nutrition/meditation pages
function readFitnessData() {
  try {
    const raw = localStorage.getItem("fitness_data");
    if (raw) return JSON.parse(raw) as { completedWorkouts?: string[]; streak?: number; totalCalories?: number };
  } catch { /* empty */ }
  return { completedWorkouts: [], streak: 5, totalCalories: 2340 };
}

function readNutritionData() {
  try {
    const raw = localStorage.getItem("nutrition_data");
    if (raw) return JSON.parse(raw) as { streak?: number; waterGlasses?: number; mealLog?: unknown[] };
  } catch { /* empty */ }
  return { streak: 4, waterGlasses: 6, mealLog: [] };
}

function readMeditationData() {
  try {
    const raw = localStorage.getItem("meditation_data");
    if (raw) return JSON.parse(raw) as { streak?: number; totalMinutes?: number; completedSessions?: string[] };
  } catch { /* empty */ }
  return { streak: 3, totalMinutes: 95, completedSessions: [] };
}

function scoreFor(v: number, max: number) {
  return Math.min(100, Math.round((v / max) * 100));
}

// Fake 30-day history for chart (seeded from current streaks)
function build30Days(fStreak: number, nStreak: number, mStreak: number): DayData[] {
  const labels = ["1/5","2/5","3/5","4/5","5/5","6/5","7/5","8/5","9/5","10/5",
    "11/5","12/5","13/5","14/5","15/5","16/5","17/5","18/5","19/5","20/5",
    "21/5","22/5","23/5","24/5","25/5","26/5","27/5","28/5","29/5","30/5"];
  return labels.map((day, i) => {
    const base = i / 30;
    const f = Math.min(100, Math.round(20 + base * 60 + (fStreak * 3) + Math.sin(i) * 10));
    const n = Math.min(100, Math.round(30 + base * 50 + (nStreak * 3) + Math.cos(i) * 8));
    const m = Math.min(100, Math.round(15 + base * 55 + (mStreak * 3) + Math.sin(i * 1.3) * 12));
    return { day, fitness: f, nutrition: n, meditation: m, score: Math.round((f + n + m) / 3) };
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreRing({ score, color, size = 100 }: { score: number; color: string; size?: number }) {
  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={`${circ}`}
      />
    </svg>
  );
}

function ModuleCard({
  icon: Icon, label, color, streak, score, detail, onClick,
}: {
  icon: typeof Dumbbell; label: string; color: string; streak: number; score: number; detail: string; onClick: () => void;
}) {
  return (
    <Pressable onPress={onClick}
      className="flex-1 rounded-2xl p-4 flex flex-col gap-3 text-left relative overflow-hidden"
      style={{ borderStyle: "solid" }}>
      <View className="flex items-center justify-between">
        <View className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}25` }}>
          <Icon size={18} style={{ color }} />
        </View>
        <View className="relative" style={{ width: 44, height: 44 }}>
          <ScoreRing score={score} color={color} size={44} />
          <Text className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">{score}</Text>
        </View>
      </View>
      <View>
        <Text className="text-white font-semibold text-sm">{label}</Text>
        <Text className="text-white/50 text-xs">{detail}</Text>
      </View>
      <View className="flex items-center gap-1">
        <Flame size={11} className="text-orange-400" />
        <Text className="text-orange-300 text-xs font-medium">{streak}j</Text>
      </View>
    </Pressable>
  );
}

// ─── Recommendation card ─────────────────────────────────────────────────────

const AI_RECS = [
  { emoji: "💧", text: "Buvez encore 2 verres d'eau pour atteindre votre objectif d'hydratation.", color: "#3B82F6", tag: "Nutrition" },
  { emoji: "🧘", text: "Une session de méditation de 10 min avant le coucher améliorera votre récupération.", color: "#8B5CF6", tag: "Méditation" },
  { emoji: "🏃", text: "30 min de marche rapide aujourd'hui compléterait votre semaine fitness.", color: "#E17055", tag: "Fitness" },
  { emoji: "🥗", text: "Votre apport en protéines est un peu faible — pensez aux légumineuses.", color: "#10B981", tag: "Nutrition" },
  { emoji: "🌬️", text: "2 cycles de cohérence cardiaque peuvent réduire votre niveau de stress perçu.", color: "#6366F1", tag: "Respiration" },
];

// ─── SMART Goals ─────────────────────────────────────────────────────────────

function GoalBar({ goal }: { goal: SmartGoal }) {
  const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
  const statusColor = goal.status === "done" ? "#10B981" : goal.status === "on_track" ? goal.color : "#EF4444";
  return (
    <View className="rounded-xl p-3" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
      <View className="flex items-center justify-between mb-2">
        <Text className="text-white text-sm font-medium">{goal.label}</Text>
        <Text className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
          {goal.status === "done" ? "Atteint ✓" : goal.status === "on_track" ? "En cours" : "En retard"}
        </Text>
      </View>
      <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
        <View
          className="h-full rounded-full" style={{ backgroundColor: goal.color }} />
      </View>
      <View className="flex justify-between mt-1">
        <Text className="text-xs text-white/40">{goal.current} {goal.unit}</Text>
        <Text className="text-xs text-white/40">/{goal.target} {goal.unit}</Text>
      </View>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BienEtreDashboardPage({
  onBack, onNavigate,
}: {
  onBack: () => void;
  onNavigate: (page: string) => void;
}) {
  const [tab, setTab] = useState<"overview" | "progress" | "goals" | "recs">("overview");

  // Real Convex data
  const healthSummary = useQuery(api.health.getHealthSummary, {});

  // Fall back to localStorage data when Convex isn't available or user not authenticated
  const fitness = readFitnessData();
  const nutrition = readNutritionData();
  const meditation = readMeditationData();

  const fitnessStreak = (healthSummary?.workoutCount ?? 0) > 0 ? Math.min(healthSummary!.workoutCount, 14) : (fitness.streak ?? 5);
  const nutritionStreak = nutrition.streak ?? 4;
  const meditationStreak = (healthSummary?.meditationCount ?? 0) > 0 ? Math.min(healthSummary!.meditationCount, 10) : (meditation.streak ?? 3);

  const fitnessScore = scoreFor(fitnessStreak, 14);
  const nutritionScore = scoreFor(nutritionStreak + (nutrition.waterGlasses ?? 0), 20);
  const meditationScore = scoreFor((meditation.totalMinutes ?? 0), 120);

  const globalScore = Math.round((fitnessScore + nutritionScore + meditationScore) / 3);

  const days = useMemo(() => build30Days(fitnessStreak, nutritionStreak, meditationStreak), [fitnessStreak, nutritionStreak, meditationStreak]);
  const last7 = days.slice(-7);

  const goals: SmartGoal[] = [
    { id: "g1", label: "Séances fitness / semaine", target: 5, current: Math.min(5, fitnessStreak), unit: "séances", color: "#E17055", module: "fitness", status: fitnessStreak >= 5 ? "done" : fitnessStreak >= 3 ? "on_track" : "behind" },
    { id: "g2", label: "Eau quotidienne", target: 8, current: nutrition.waterGlasses ?? 6, unit: "verres", color: "#3B82F6", module: "nutrition", status: (nutrition.waterGlasses ?? 6) >= 8 ? "done" : "on_track" },
    { id: "g3", label: "Minutes méditées / semaine", target: 70, current: Math.min(70, meditation.totalMinutes ?? 0), unit: "min", color: "#8B5CF6", module: "meditation", status: (meditation.totalMinutes ?? 0) >= 70 ? "done" : "on_track" },
    { id: "g4", label: "Streak méditation", target: 7, current: meditationStreak, unit: "jours", color: "#6366F1", module: "meditation", status: meditationStreak >= 7 ? "done" : meditationStreak >= 4 ? "on_track" : "behind" },
  ];

  const scoreGrade = globalScore >= 80 ? { label: "Excellent", color: "#10B981" }
    : globalScore >= 60 ? { label: "Bien", color: "#8B5CF6" }
    : globalScore >= 40 ? { label: "Moyen", color: "#F59E0B" }
    : { label: "À améliorer", color: "#EF4444" };

  const tabs = [
    { id: "overview" as const, label: "Vue d'ensemble", icon: BarChart2 },
    { id: "progress" as const, label: "Progression", icon: TrendingUp },
    { id: "goals" as const, label: "Objectifs", icon: Target },
    { id: "recs" as const, label: "IA & Conseils", icon: Sparkles },
  ];

  return (
    <View className="h-full flex flex-col" style={{  }}>
      {/* Header */}
      <View className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Pressable onPress={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
          <ArrowLeft size={20} className="text-white" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-bold text-white">Tableau de Bord Bien-être</Text>
          <Text className="text-xs text-white/50">Vue complète de votre santé</Text>
        </View>
        <View className="flex items-center gap-1 px-3 py-1.5 rounded-xl"
          style={{ backgroundColor: `${scoreGrade.color}20`, borderStyle: "solid" }}>
          <Heart size={13} style={{ color: scoreGrade.color }} />
          <Text className="text-sm font-bold" style={{ color: scoreGrade.color }}>{globalScore}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View className="px-4 pb-2 overflow-x-auto">
        <View className="flex gap-2">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <Pressable key={t.id} onPress={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium"
                style={active
                  ? {  }
                  : { backgroundColor: "rgba(255,255,255,0.06)" }}>
                <Icon size={14} />
                {t.label}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 overflow-y-auto px-4 pb-6">
        <>

          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <View key="overview" className="space-y-4 pt-2">

              {/* Global score hero */}
              <View className="rounded-2xl p-5 flex items-center gap-5 relative overflow-hidden"
                style={{ borderWidth: 1, borderColor: "rgba(139,92,246,0.3)", borderStyle: "solid" }}>
                <View className="absolute top-0 right-0 w-32 h-32 rounded-full"
                  style={{  }} />
                <View className="relative flex-shrink-0" style={{ width: 100, height: 100 }}>
                  <ScoreRing score={globalScore} color={scoreGrade.color} size={100} />
                  <View className="absolute inset-0 flex flex-col items-center justify-center">
                    <Text className="text-2xl font-black text-white">{globalScore}</Text>
                    <Text className="text-[9px] text-white/50">/ 100</Text>
                  </View>
                </View>
                <View>
                  <Text className="text-white/60 text-xs mb-1">Score Bien-être Global</Text>
                  <Text className="text-2xl font-black" style={{ color: scoreGrade.color }}>{scoreGrade.label}</Text>
                  <Text className="text-white/50 text-xs mt-1">Basé sur fitness, nutrition et méditation</Text>
                  <View className="flex gap-3 mt-3">
                    {[
                      { label: "Fitness", score: fitnessScore, color: "#E17055" },
                      { label: "Nutri", score: nutritionScore, color: "#00B894" },
                      { label: "Médit.", score: meditationScore, color: "#8B5CF6" },
                    ].map(m => (
                      <View key={m.label} className="text-center">
                        <Text className="text-sm font-bold" style={{ color: m.color }}>{m.score}</Text>
                        <Text className="text-[10px] text-white/40">{m.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              {/* Module cards */}
              <View className="flex gap-3">
                <ModuleCard icon={Dumbbell} label="Fitness" color="#E17055" streak={fitnessStreak}
                  score={fitnessScore} detail={`${fitness.completedWorkouts?.length ?? 0} séances`}
                  onPress={() => onNavigate("fitness")} />
                <ModuleCard icon={Salad} label="Nutrition" color="#00B894" streak={nutritionStreak}
                  score={nutritionScore} detail={`${nutrition.waterGlasses ?? 0}/8 verres`}
                  onPress={() => onNavigate("nutrition")} />
                <ModuleCard icon={Moon} label="Médit." color="#8B5CF6" streak={meditationStreak}
                  score={meditationScore} detail={`${meditation.totalMinutes ?? 0} min`}
                  onPress={() => onNavigate("meditation")} />
              </View>

              {/* Streak summary */}
              <View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(249,115,22,0.1)", borderWidth: 1, borderColor: "rgba(249,115,22,0.2)", borderStyle: "solid" }}>
                <View className="flex items-center gap-2 mb-3">
                  <Flame size={16} className="text-orange-400" />
                  <Text className="text-white font-semibold text-sm">Streaks actifs</Text>
                </View>
                <View className="flex gap-3">
                  {[
                    { label: "Fitness", streak: fitnessStreak, color: "#E17055", icon: Dumbbell },
                    { label: "Nutrition", streak: nutritionStreak, color: "#00B894", icon: Salad },
                    { label: "Méditation", streak: meditationStreak, color: "#8B5CF6", icon: Moon },
                  ].map(s => {
                    const Icon = s.icon;
                    return (
                      <View key={s.label} className="flex-1 flex flex-col items-center gap-1 rounded-xl py-3"
                        style={{ backgroundColor: `${s.color}10`, borderStyle: "solid" }}>
                        <Icon size={14} style={{ color: s.color }} />
                        <Text className="text-lg font-black text-white">{s.streak}</Text>
                        <Text className="text-[10px] text-white/40">jours</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Today summary */}
              <View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                <View className="flex items-center gap-2 mb-3">
                  <Sun size={16} className="text-yellow-400" />
                  <Text className="text-white font-semibold text-sm">Aujourd'hui</Text>
                </View>
                <View className="space-y-2">
                  {[
                    { label: "Séance fitness complète", done: fitnessStreak > 0, color: "#E17055" },
                    { label: "Journal repas rempli", done: (nutrition.mealLog as unknown[])?.length > 0, color: "#00B894" },
                    { label: "Session méditation", done: (meditation.completedSessions?.length ?? 0) > 0, color: "#8B5CF6" },
                    { label: "Objectif eau", done: (nutrition.waterGlasses ?? 0) >= 8, color: "#3B82F6" },
                  ].map(item => (
                    <View key={item.label} className="flex items-center gap-3">
                      <View className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={item.done ? { backgroundColor: `${item.color}30`, borderStyle: "solid" } : { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
                        {item.done && <CheckCircle2 size={12} style={{ color: item.color }} />}
                      </View>
                      <Text className={`text-sm ${item.done ? "text-white" : "text-white/40 line-through"}`}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* ── PROGRESS ── */}
          {tab === "progress" && (
            <View key="progress" className="space-y-4 pt-2">

              {/* Score 7 days area chart */}
              <View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                <Text className="text-white font-semibold mb-1">Score global — 7 derniers jours</Text>
                <Text className="text-white/40 text-xs mb-3">Tendance du bien-être</Text>
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={last7}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "white", fontSize: 12 }} />
                    <Area type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={2} fill="url(#scoreGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </View>

              {/* 3 modules line chart */}
              <View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                <Text className="text-white font-semibold mb-1">Comparaison modules — 30 jours</Text>
                <View className="flex gap-3 mb-3">
                  {[["#E17055", "Fitness"], ["#00B894", "Nutrition"], ["#8B5CF6", "Méditation"]].map(([c, l]) => (
                    <View key={l} className="flex items-center gap-1.5">
                      <View className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                      <Text className="text-xs text-white/50">{l}</Text>
                    </View>
                  ))}
                </View>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={days}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" tick={false} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "white", fontSize: 12 }} />
                    <Line type="monotone" dataKey="fitness" stroke="#E17055" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="nutrition" stroke="#00B894" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="meditation" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </View>

              {/* Stats row */}
              <View className="gap-3">
                {[
                  { label: "Calories brûlées", value: `${fitness.totalCalories ?? 2340}`, unit: "kcal", color: "#E17055", icon: "🔥" },
                  { label: "Eau consommée", value: `${(nutrition.waterGlasses ?? 6) * 250}`, unit: "ml", color: "#3B82F6", icon: "💧" },
                  { label: "Minutes méditées", value: `${meditation.totalMinutes ?? 95}`, unit: "min", color: "#8B5CF6", icon: "🧘" },
                  { label: "Meilleur streak", value: `${Math.max(fitnessStreak, nutritionStreak, meditationStreak)}`, unit: "jours", color: "#F59E0B", icon: "⭐" },
                ].map(s => (
                  <View key={s.label} className="rounded-2xl p-4" style={{ backgroundColor: `${s.color}10`, borderStyle: "solid" }}>
                    <Text className="text-2xl mb-1">{s.icon}</Text>
                    <Text className="text-xl font-black text-white">{s.value}<Text className="text-xs text-white/40 ml-1">{s.unit}</Text></Text>
                    <Text className="text-xs text-white/50">{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* Radial chart */}
              <View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                <Text className="text-white font-semibold mb-3">Répartition du bien-être</Text>
                <ResponsiveContainer width="100%" height={180}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%"
                    data={[
                      { name: "Fitness", value: fitnessScore, fill: "#E17055" },
                      { name: "Nutrition", value: nutritionScore, fill: "#00B894" },
                      { name: "Méditation", value: meditationScore, fill: "#8B5CF6" },
                    ]}>
                    <RadialBar dataKey="value" cornerRadius={6} label={{ position: "insideStart", fill: "rgba(255,255,255,0.6)", fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "white", fontSize: 12 }} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </View>
            </View>
          )}

          {/* ── GOALS ── */}
          {tab === "goals" && (
            <View key="goals" className="space-y-4 pt-2">
              <View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                <View className="flex items-center gap-2 mb-1">
                  <Target size={16} className="text-purple-400" />
                  <Text className="text-white font-semibold">Objectifs SMART</Text>
                </View>
                <Text className="text-white/40 text-xs">Suivi de vos objectifs hebdomadaires</Text>
              </View>

              <View className="space-y-3">
                {goals.map(g => <GoalBar key={g.id} goal={g} />)}
              </View>

              {/* Weekly plan */}
              <View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                <View className="flex items-center gap-2 mb-3">
                  <Calendar size={16} className="text-blue-400" />
                  <Text className="text-white font-semibold text-sm">Plan de la semaine</Text>
                </View>
                <View className="space-y-2">
                  {[
                    { day: "Lun", fitness: true, nutrition: true, meditation: false },
                    { day: "Mar", fitness: true, nutrition: true, meditation: true },
                    { day: "Mer", fitness: false, nutrition: true, meditation: true },
                    { day: "Jeu", fitness: true, nutrition: false, meditation: true },
                    { day: "Ven", fitness: true, nutrition: true, meditation: false },
                    { day: "Sam", fitness: false, nutrition: true, meditation: true },
                    { day: "Dim", fitness: false, nutrition: false, meditation: true },
                  ].map(d => (
                    <View key={d.day} className="flex items-center gap-3">
                      <Text className="text-white/40 text-xs w-8">{d.day}</Text>
                      <View className="flex gap-2 flex-1">
                        {[
                          { key: "fitness" as const, color: "#E17055", icon: Dumbbell },
                          { key: "nutrition" as const, color: "#00B894", icon: Salad },
                          { key: "meditation" as const, color: "#8B5CF6", icon: Moon },
                        ].map(m => {
                          const Icon = m.icon;
                          return (
                            <View key={m.key} className="w-7 h-7 rounded-lg flex items-center justify-center"
                              style={d[m.key] ? { backgroundColor: `${m.color}25`, borderStyle: "solid" } : { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}>
                              <Icon size={12} style={{ color: d[m.key] ? m.color : "rgba(255,255,255,0.2)" }} />
                            </View>
                          );
                        })}
                      </View>
                      {(d.fitness && d.nutrition && d.meditation) && <Award size={14} className="text-yellow-400" />}
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* ── RECS ── */}
          {tab === "recs" && (
            <View key="recs" className="space-y-4 pt-2">
              {/* IA header */}
              <View className="rounded-2xl p-4 relative overflow-hidden"
                style={{ borderWidth: 1, borderColor: "rgba(139,92,246,0.3)", borderStyle: "solid" }}>
                <View className="absolute -top-4 -right-4 w-24 h-24 rounded-full"
                  style={{  }} />
                <View className="flex items-center gap-3">
                  <View className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{  }}>
                    <Sparkles size={18} className="text-white" />
                  </View>
                  <View>
                    <Text className="text-white font-bold">Coach IA Bien-être</Text>
                    <Text className="text-white/50 text-xs">Recommandations personnalisées</Text>
                  </View>
                </View>
                <Text className="text-white/70 text-sm mt-3">
                  Basé sur votre score de {globalScore}/100 et vos habitudes récentes, voici vos recommandations du jour :
                </Text>
              </View>

              {AI_RECS.map((rec, i) => (
                <View key={i}
                  className="rounded-2xl p-4 flex gap-3"
                  style={{ backgroundColor: `${rec.color}10`, borderStyle: "solid" }}>
                  <Text className="text-2xl flex-shrink-0">{rec.emoji}</Text>
                  <View className="flex-1">
                    <Text className="text-xs px-2 py-0.5 rounded-full mb-2 inline-block" style={{ backgroundColor: `${rec.color}20`, color: rec.color }}>{rec.tag}</Text>
                    <Text className="text-white/80 text-sm">{rec.text}</Text>
                  </View>
                </View>
              ))}

              {/* Quick links */}
              <View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                <Text className="text-white font-semibold text-sm mb-3">Accès rapides</Text>
                <View className="space-y-2">
                  {[
                    { label: "Lancer une séance fitness", icon: Dumbbell, color: "#E17055", page: "fitness" },
                    { label: "Journaliser un repas", icon: Salad, color: "#00B894", page: "nutrition" },
                    { label: "Session de méditation", icon: Moon, color: "#8B5CF6", page: "meditation" },
                    { label: "Exercice de respiration", icon: Wind, color: "#6366F1", page: "meditation" },
                  ].map(link => {
                    const Icon = link.icon;
                    return (
                      <Pressable key={link.label} onPress={() => onNavigate(link.page)}
                        className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5"
                        style={{ backgroundColor: `${link.color}10`, borderStyle: "solid" }}>
                        <View className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${link.color}20` }}>
                          <Icon size={15} style={{ color: link.color }} />
                        </View>
                        <Text className="text-white/80 text-sm flex-1 text-left">{link.label}</Text>
                        <ChevronRight size={14} className="text-white/30" />
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Wellness tip of the day */}
              <View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,215,0,0.08)", borderWidth: 1, borderColor: "rgba(255,215,0,0.2)", borderStyle: "solid" }}>
                <View className="flex items-center gap-2 mb-2">
                  <Zap size={14} className="text-yellow-400" />
                  <Text className="text-yellow-300 text-sm font-semibold"><Text>Conseil du jour</Text></Text>
                </View>
                <Text className="text-white/70 text-sm">
                  {"La régularité prime sur l'intensité. 20 minutes de mouvement quotidien valent mieux qu'une heure hebdomadaire. Construisez des habitudes durables, pas des performances ponctuelles."}
                </Text>
              </View>
            </View>
          )}
        </>
      </View>
    </View>
  );
}
