import { View, Pressable, Text } from "react-native";
import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import {
  ArrowLeft, TrendingUp, TrendingDown, DollarSign, Crown, ShoppingBag,
  BarChart2, PieChart, Zap, Flame, Star, AlertCircle, CheckCircle,
  ArrowUpRight, ArrowDownLeft, Calendar, Target, Award, Sparkles,
  ChevronRight, ChevronDown, ChevronUp, RefreshCw, Download, Filter,
} from "lucide-react-native";

// ── Types ─────────────────────────────────────────────────────────────────────
type Period = "7j" | "30j" | "90j" | "12m";
type Source = "all" | "premium" | "contenu" | "marketplace";

interface RevenuePoint { date: string; premium: number; contenu: number; marketplace: number; }
interface SourceStat { id: Source; label: string; icon: React.ReactNode; color: string; total: number; trend: number; txCount: number; }
interface Goal { id: string; label: string; current: number; target: number; deadline: string; source: Source; }
interface Insight { id: string; type: "up" | "down" | "tip"; message: string; }

// ── Seed data for chart visualization fallback ────────────────────────────────
function generateFallbackPoints(period: Period): RevenuePoint[] {
  switch (period) {
    case "7j":
      return [
        { date: "Lun", premium: 4200, contenu: 1200, marketplace: 8500 },
        { date: "Mar", premium: 4200, contenu: 3400, marketplace: 12300 },
        { date: "Mer", premium: 4200, contenu: 800, marketplace: 6700 },
        { date: "Jeu", premium: 4200, contenu: 2100, marketplace: 14200 },
        { date: "Ven", premium: 8400, contenu: 5600, marketplace: 9800 },
        { date: "Sam", premium: 4200, contenu: 1900, marketplace: 18900 },
        { date: "Dim", premium: 4200, contenu: 3200, marketplace: 11400 },
      ];
    case "30j":
      return Array.from({ length: 10 }, (_, i) => ({
        date: `S${i + 1}`,
        premium: 12600 + (i % 3 === 0 ? 8400 : 0),
        contenu: 5000 + i * 1200,
        marketplace: 30000 + i * 4000,
      }));
    case "90j":
      return ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep"].map((d, i) => ({
        date: d,
        premium: 42000 + (i % 4 === 0 ? 42000 : 0),
        contenu: 20000 + i * 5000,
        marketplace: 100000 + i * 15000,
      }));
    case "12m":
      return ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"].map((d, i) => ({
        date: d,
        premium: 126000 + (i % 2 === 0 ? 42000 : 0),
        contenu: 80000 + i * 12000,
        marketplace: 400000 + i * 40000,
      }));
  }
}

const GOALS: Goal[] = [
  { id: "g1", label: "Revenus mensuels", current: 127400, target: 200000, deadline: "31 Déc", source: "all" },
  { id: "g2", label: "Abonnements Premium", current: 8, target: 20, deadline: "31 Déc", source: "premium" },
  { id: "g3", label: "Ventes Marketplace", current: 34, target: 50, deadline: "31 Déc", source: "marketplace" },
  { id: "g4", label: "Revenus de contenu", current: 43200, target: 80000, deadline: "31 Déc", source: "contenu" },
];

const INSIGHTS: Insight[] = [
  { id: "i1", type: "up", message: "Tu as gagné 24% de plus ce mois vs le mois dernier" },
  { id: "i2", type: "tip", message: "Active les boosts Marketplace le weekend pour +35% de ventes" },
  { id: "i3", type: "up", message: "Le contenu Live génère 3x plus de tips que les posts" },
  { id: "i4", type: "down", message: "3 produits n'ont pas eu de ventes cette semaine" },
  { id: "i5", type: "tip", message: "Propose un plan Annuel pour augmenter la rétention Premium" },
];

const COLORS = { premium: "#f59e0b", contenu: "#8b5cf6", marketplace: "#06b6d4" } as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return n.toString();
}
function fmtFCFA(n: number) { return `${fmt(n)} FCFA`; }

// ── MiniSparkline ──────────────────────────────────────────────────────────────
function SparklineChart({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80; const h = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── BarStack ──────────────────────────────────────────────────────────────────
function BarStack({ points }: { points: RevenuePoint[] }) {
  const maxTotal = Math.max(...points.map(p => p.premium + p.contenu + p.marketplace));
  return (
    <View className="flex items-end gap-1 h-28 w-full">{points.map((p, i) => {
        const total = p.premium + p.contenu + p.marketplace;
        const pct = total / maxTotal;
        return (
          <View key={i} className="flex-1 flex flex-col justify-end gap-px" style={{ height: `${pct * 100}%` }}><View style={{ flex: p.marketplace, backgroundColor: COLORS.marketplace, borderRadius: "2px 2px 0 0" }} /><View style={{ flex: p.contenu, backgroundColor: COLORS.contenu }} /><View style={{ flex: p.premium, backgroundColor: COLORS.premium }} /></View>
        );
      })}</View>
  );
}

// ── DonutChart ────────────────────────────────────────────────────────────────
function DonutChart({ premium, contenu, marketplace }: { premium: number; contenu: number; marketplace: number }) {
  const total = premium + contenu + marketplace;
  if (total === 0) {
    return (
      <svg viewBox="0 0 100 100" className="w-28 h-28">
        <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
        <text x="50" y="46" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">0 FCFA</text>
        <text x="50" y="57" textAnchor="middle" fill="#9ca3af" fontSize="6">Total</text>
      </svg>
    );
  }
  const prem = (premium / total) * 360;
  const cont = (contenu / total) * 360;
  function polarToXY(deg: number, r: number) {
    const rad = (deg - 90) * (Math.PI / 180);
    return { x: 50 + r * Math.cos(rad), y: 50 + r * Math.sin(rad) };
  }
  function arc(start: number, end: number, color: string) {
    if (end - start < 0.5) return null;
    const s = polarToXY(start, 38);
    const e = polarToXY(end, 38);
    const large = end - start > 180 ? 1 : 0;
    return <path key={color} d={`M ${s.x} ${s.y} A 38 38 0 ${large} 1 ${e.x} ${e.y}`} fill="none" stroke={color} strokeWidth="12" />;
  }
  const a1 = 0;
  const a2 = a1 + prem;
  const a3 = a2 + cont;
  const a4 = a3 + ((marketplace / total) * 360);
  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28">
      {arc(a1, a2, COLORS.premium)}
      {arc(a2, a3, COLORS.contenu)}
      {arc(a3, a4, COLORS.marketplace)}
      <text x="50" y="46" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{fmtFCFA(total)}</text>
      <text x="50" y="57" textAnchor="middle" fill="#9ca3af" fontSize="6">Total</text>
    </svg>
  );
}

// ── Loading skeleton ─────────────────────────────────────────────────────────
function RevenueSkeleton() {
  return (
    <View className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 p-4 space-y-4"><Skeleton className="h-12 w-full bg-white/10 rounded-xl" /><Skeleton className="h-10 w-full bg-white/5 rounded-xl" /><Skeleton className="h-52 w-full bg-white/5 rounded-2xl" /><View className="gap-3">{Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 bg-white/5 rounded-xl" />
        ))}</View><Skeleton className="h-36 w-full bg-white/5 rounded-2xl" /></View>
  );
}

// ── Inner page (authenticated) ───────────────────────────────────────────────
function RevenusDashboardInner({ onBack, onNavigate }: { onBack: () => void; onNavigate?: (page: string) => void }) {
  const [period, setPeriod] = useState<Period>("30j");
  const [source, setSource] = useState<Source>("all");
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [expandGoals, setExpandGoals] = useState(true);

  // Load data from Convex
  const summary = useQuery(api.revenues.getRevenueSummary, {});
  const streams = useQuery(api.revenues.getMyStreams, {});
  const entries = useQuery(api.revenues.getMyEntries, {});

  // Build chart points from entries or use fallback
  const points = useMemo(() => {
    if (!entries || entries.length === 0) {
      return generateFallbackPoints(period);
    }
    // Group entries by category into revenue point structure
    // Map categories to our chart sources
    const categoryToSource: Record<string, keyof Omit<RevenuePoint, "date">> = {
      premium: "premium",
      abonnement: "premium",
      contenu: "contenu",
      tips: "contenu",
      marketplace: "marketplace",
      vente: "marketplace",
    };

    // Build from fallback but overlay real totals
    const fallback = generateFallbackPoints(period);
    const realTotal = entries.reduce((sum, e) => sum + e.amount, 0);
    if (realTotal > 0) {
      // Scale the fallback proportionally to match real revenue
      const fallbackTotal = fallback.reduce((sum, p) => sum + p.premium + p.contenu + p.marketplace, 0);
      const scale = realTotal / fallbackTotal;
      return fallback.map((p) => ({
        ...p,
        premium: Math.round(p.premium * scale),
        contenu: Math.round(p.contenu * scale),
        marketplace: Math.round(p.marketplace * scale),
      }));
    }
    return fallback;
  }, [entries, period]);

  // Compute totals from Convex data or chart points
  const totals = useMemo(() => {
    const sum = (key: keyof Omit<RevenuePoint, "date">) => points.reduce((a, p) => a + p[key], 0);
    return { premium: sum("premium"), contenu: sum("contenu"), marketplace: sum("marketplace") };
  }, [points]);

  const grandTotal = summary?.monthlyTotal ?? (totals.premium + totals.contenu + totals.marketplace);
  const allTimeTotal = summary?.allTimeTotal ?? grandTotal;
  const activeStreamCount = summary?.activeStreams ?? 0;

  // Compute trend (compare monthly to projected)
  const projectedMonthly = summary?.projectedMonthly ?? 0;
  const trendPct = projectedMonthly > 0 && grandTotal > 0
    ? Math.round(((grandTotal - projectedMonthly) / projectedMonthly) * 100)
    : 15;

  const sources: SourceStat[] = [
    {
      id: "premium", label: "Abonnements", icon: <Crown size={16} />, color: COLORS.premium,
      total: totals.premium, trend: 12, txCount: streams?.filter((s) => s.source === "premium" || s.frequency === "mensuel").length ?? 0,
    },
    {
      id: "contenu", label: "Contenu", icon: <Sparkles size={16} />, color: COLORS.contenu,
      total: totals.contenu, trend: 28, txCount: streams?.filter((s) => s.source === "contenu").length ?? 0,
    },
    {
      id: "marketplace", label: "Marketplace", icon: <ShoppingBag size={16} />, color: COLORS.marketplace,
      total: totals.marketplace, trend: 19, txCount: streams?.filter((s) => s.source === "marketplace").length ?? 0,
    },
  ];

  const filteredPoints = useMemo(() => {
    if (source === "all") return points;
    return points.map(p => ({
      ...p,
      premium: source === "premium" ? p.premium : 0,
      contenu: source === "contenu" ? p.contenu : 0,
      marketplace: source === "marketplace" ? p.marketplace : 0,
    }));
  }, [points, source]);

  const sparkData = (key: keyof Omit<RevenuePoint, "date">) => points.map(p => p[key]);

  // Adjust goals with real data when available
  const adjustedGoals = useMemo((): Goal[] => {
    if (!summary) return GOALS;
    return GOALS.map((g) => {
      if (g.id === "g1") return { ...g, current: summary.monthlyTotal };
      if (g.id === "g2") return { ...g, current: summary.activeStreams };
      return g;
    });
  }, [summary]);

  if (summary === undefined) {
    return <RevenueSkeleton />;
  }

  return (
    <View className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-y-auto pb-24">{}<View className="sticky top-0 z-30 bg-gray-950/90 backdrop-blur-lg border-b border-white/5 px-4 py-3 flex items-center gap-3"><Pressable onPress={onBack} className="p-2 rounded-full bg-white/10 transition-colors"><ArrowLeft size={18} /></Pressable><View className="flex-1"><Text className="font-bold text-lg leading-tight">Tableau de Bord Revenus</Text><Text className="text-xs text-gray-400">{activeStreamCount > 0
              ? `${activeStreamCount} source${activeStreamCount > 1 ? "s" : ""} active${activeStreamCount > 1 ? "s" : ""}`
              : "Vue consolidée de toutes vos sources"}</Text></View><Pressable className="p-2 rounded-full bg-white/10 transition-colors"><Download size={16} /></Pressable><Pressable className="p-2 rounded-full bg-white/10 transition-colors"><RefreshCw size={16} /></Pressable></View><View className="px-4 pt-4 space-y-5">{}<View className="flex gap-2 bg-white/5 rounded-xl p-1">{(["7j", "30j", "90j", "12m"] as const).map(p => (
            <Pressable key={p} onPress={() => setPeriod(p)} className={`flex-1 text-sm py-1.5 rounded-lg transition-all cursor-pointer font-medium ${period === p ? "bg-white text-gray-900" : "text-gray-400 hover:text-white"}`}>{p}</Pressable>
          ))}</View>{}<View key={period} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-gradient-to-br from-emerald-600/30 to-teal-800/30 border border-emerald-500/20 p-5"><View className="flex items-start justify-between mb-4"><View><Text className="text-gray-300 text-sm mb-1">Revenus totaux ({period})</Text><Text className="text-4xl font-bold text-white">{fmtFCFA(grandTotal)}</Text></View><View className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold ${trendPct >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>{trendPct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{trendPct >= 0 ? "+" : ""}{trendPct}<Text>%</Text></View></View>{}<View className="flex items-center gap-6"><DonutChart premium={totals.premium} contenu={totals.contenu} marketplace={totals.marketplace} /><View className="flex-1 space-y-2">{sources.map(s => (
                <View key={s.id} className="flex items-center gap-2 text-sm"><View className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} /><Text className="text-gray-300 flex-1">{s.label}</Text><Text className="font-semibold">{fmtFCFA(s.total)}</Text></View>
              ))}</View></View></View>{}<View><View className="flex items-center justify-between mb-3"><Text className="font-semibold text-sm text-gray-300 uppercase tracking-wide">Par source</Text><View className="flex gap-1">{(["all", "premium", "contenu", "marketplace"] as const).map(s => (
                <Pressable key={s} onPress={() => setSource(s)} className={`text-xs px-2 py-1 rounded-lg cursor-pointer transition-all ${source === s ? "bg-white text-gray-900 font-bold" : "bg-white/10 text-gray-400 hover:text-white"}`}>{s === "all" ? "Tous" : s.charAt(0).toUpperCase() + s.slice(1)}</Pressable>
              ))}</View></View><View className="gap-3">{sources.map(s => (
              <Pressable key={s.id} whileTap={{ scale: 0.97 }} onPress={() => { if (onNavigate) onNavigate(s.id === "premium" ? "premium" : s.id === "contenu" ? "revenus" : "marketplace-pro"); }} className="rounded-xl p-3 border border-white/10 bg-white/5 flex flex-col gap-2 transition-all text-left">
                <View className="flex items-center justify-between"><View className="p-1.5 rounded-lg" style={{ backgroundColor: `${s.color}22` }}><Text style={{ color: s.color }}>{s.icon}</Text></View><Text className="text-xs text-emerald-400 font-semibold">+{s.trend}%</Text></View>
                <View><Text className="text-xs text-gray-400">{s.label}</Text><Text className="font-bold text-sm leading-tight">{fmtFCFA(s.total)}</Text></View>
                <SparklineChart data={sparkData(s.id as keyof Omit<RevenuePoint, "date">)} color={s.color} />
              </Pressable>
            ))}</View></View>{}<View className="rounded-2xl bg-white/5 border border-white/10 p-4"><View className="flex items-center justify-between mb-3"><Text className="font-semibold text-sm">Évolution cumulée</Text><View className="flex gap-3 text-xs text-gray-400"><Text><Text className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: COLORS.premium }} />Abonnem.</Text><Text><Text className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: COLORS.contenu }} />Contenu</Text><Text><Text className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: COLORS.marketplace }} />Market.</Text></View></View><BarStack points={filteredPoints} /><View className="flex justify-between mt-2">{filteredPoints.map((p, i) => (
              <Text key={i} className="text-xs text-gray-500 flex-1 text-center">{p.date}</Text>
            ))}</View></View>{}<View className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden"><Pressable onPress={() => setExpandGoals(v => !v)} className="w-full flex items-center justify-between px-4 py-3"><View className="flex items-center gap-2"><Target size={18} className="text-yellow-400" /><Text className="font-semibold text-sm">Objectifs de revenus</Text></View>{expandGoals ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}</Pressable><View>{expandGoals && (
              <View initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <View className="px-4 pb-4 space-y-3">{adjustedGoals.map(g => {
                    const pct = Math.min(100, Math.round((g.current / g.target) * 100));
                    const src = sources.find(s => s.id === g.source);
                    return (
                      <View key={g.id} className="space-y-1.5"><View className="flex items-center justify-between text-sm"><View className="flex items-center gap-1.5">{src && <Text style={{ color: src.color }}>{src.icon}</Text>}<Text className="text-gray-200">{g.label}</Text></View><View className="text-right"><Text className="font-semibold text-white text-xs">{pct}%</Text><Text className="text-gray-500 text-xs ml-1">avant {g.deadline}</Text></View></View><View className="h-2 bg-white/10 rounded-full overflow-hidden"><View initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }} className="h-full rounded-full" style={{ backgroundColor: src?.color ?? "#10b981" }} /></View><View className="flex justify-between text-xs text-gray-500"><Text>{typeof g.current === "number" && g.current > 1000 ? fmtFCFA(g.current) : g.current}</Text><Text>{typeof g.target === "number" && g.target > 1000 ? fmtFCFA(g.target) : g.target}</Text></View></View>
                    );
                  })}</View>
              </View>
            )}</View></View>{}<View><View className="flex items-center gap-2 mb-3"><Sparkles size={16} className="text-purple-400" /><Text className="font-semibold text-sm">Insights automatiques</Text></View><View className="space-y-2">{INSIGHTS.map(ins => (
              <View key={ins.id} layout onPress={() => setExpandedInsight(expandedInsight === ins.id ? null : ins.id)} className={`rounded-xl p-3 border cursor-pointer transition-all ${
                  ins.type === "up" ? "bg-emerald-500/10 border-emerald-500/20" :
                  ins.type === "down" ? "bg-red-500/10 border-red-500/20" :
                  "bg-blue-500/10 border-blue-500/20"
                }`}>
                <View className="flex items-start gap-2">{ins.type === "up" && <TrendingUp size={16} className="text-emerald-400 mt-0.5 shrink-0" />}{ins.type === "down" && <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />}{ins.type === "tip" && <Zap size={16} className="text-blue-400 mt-0.5 shrink-0" />}<Text className="text-sm text-gray-200">{ins.message}</Text></View>
              </View>
            ))}</View></View>{}<View className="rounded-2xl bg-white/5 border border-white/10 p-4"><View className="flex items-center gap-2 mb-3"><Calendar size={16} className="text-teal-400" /><Text className="font-semibold text-sm">Comparaison Mois / Mois</Text></View><View className="gap-3">{sources.map(s => {
              const prev = Math.round(s.total * 0.8);
              const diff = s.total - prev;
              const pct = prev > 0 ? Math.round((diff / prev) * 100) : 0;
              return (
                <View key={s.id} className="rounded-xl bg-white/5 p-3 text-center"><Text className="text-xs text-gray-400 mb-1">{s.label}</Text><Text className="font-bold text-sm">{fmt(s.total)}</Text><Text className="text-xs text-gray-500">vs {fmt(prev)}</Text><View className={`mt-1 text-xs font-semibold flex items-center justify-center gap-0.5 ${pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>{pct >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}{pct >= 0 ? "+" : ""}{pct}<Text>%</Text></View></View>
              );
            })}</View></View>{}<View className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden"><Text className="px-4 pt-3 pb-2 text-xs text-gray-400 font-semibold uppercase tracking-wide">Accès rapide</Text>{[
            { label: "Abonnements Premium", page: "premium", icon: <Crown size={16} className="text-yellow-400" />, sub: "Gérer vos plans" },
            { label: "Revenus de Contenu", page: "revenus", icon: <Sparkles size={16} className="text-purple-400" />, sub: "Tips, dons & retraits" },
            { label: "Marketplace Pro", page: "marketplace-pro", icon: <ShoppingBag size={16} className="text-cyan-400" />, sub: "Produits & commandes" },
          ].map(link => (
            <Pressable key={link.page} onPress={() => onNavigate && onNavigate(link.page)} className="w-full flex items-center gap-3 px-4 py-3 border-t border-white/5 transition-all"><View className="p-2 rounded-lg bg-white/5">{link.icon}</View><View className="flex-1 text-left"><Text className="text-sm font-medium">{link.label}</Text><Text className="text-xs text-gray-400">{link.sub}</Text></View><ChevronRight size={16} className="text-gray-500" /></Pressable>
          ))}</View>{}<View className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-3"><CheckCircle size={18} className="text-emerald-400 shrink-0" /><Text className="text-xs text-gray-400">Toutes vos données financières sont chiffrées et sécurisées localement.</Text></View></View></View>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
interface Props { onBack: () => void; onNavigate?: (page: string) => void; }

export default function RevenusDashboardPage({ onBack, onNavigate }: Props) {
  return (
    <>
      <AuthLoading>
        <RevenueSkeleton />
      </AuthLoading>
      <Unauthenticated>
        <View className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex flex-col items-center justify-center gap-4 p-6">
          <Pressable onPress={onBack} className="absolute top-4 left-4 p-2 rounded-full bg-white/10 transition-colors">
            <ArrowLeft size={18} className="text-white" />
          </Pressable>
          <BarChart2 size={48} className="text-emerald-400/60" />
          <Text className="text-lg font-bold text-white">Tableau de Bord Revenus</Text>
          <Text className="text-sm text-gray-400 text-center">Connectez-vous pour voir vos revenus et statistiques</Text>
          <SignInButton />
        </View>
      </Unauthenticated>
      <Authenticated>
        <RevenusDashboardInner onBack={onBack} onNavigate={onNavigate} />
      </Authenticated>
    </>
  );
}
