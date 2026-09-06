import { View, Text, Pressable } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  ArrowLeft, Eye, Heart, MessageCircle, Users, TrendingUp,
  FileText, Zap, Star, BarChart2,
} from "lucide-react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SignInButton } from "@/components/ui/signin";
import { cn } from "@/lib/utils";

interface AnalyticsPageProps {
  onBack: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  immo: "Immobilier", job: "Emploi", service: "Service",
  evenement: "Événement", community: "Communauté", agri: "Agriculture",
  sante: "Santé", transport: "Transport", annonce: "Annonce",
  restauration: "Restauration", hebergement: "Hébergement",
  energie: "Énergie", ong: "ONG",
};

function formatDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function StatCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <View
      className="rounded-2xl p-4 flex flex-col gap-1"
      style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
    >
      <View className="flex items-center gap-2 mb-1">
        <Text className="p-1.5 rounded-xl" style={{ backgroundColor: `${color}22` }}>
          <Text style={{ color }}>{icon}</Text>
        </Text>
        <Text className="text-xs text-white/50">{label}</Text>
      </View>
      <Text className="text-2xl font-bold text-white">{value}</Text>
      {sub && <Text className="text-xs text-white/40">{sub}</Text>}
    </View>
  );
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <View className="bg-[#1a1a2e] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <Text className="text-white/50 mb-1">{label}</Text>
      {payload.map((p) => (
        <Text key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </Text>
      ))}
    </View>
  );
}

function AnalyticsInner({ onBack }: AnalyticsPageProps) {
  const data = useQuery(api.analytics.getMyAnalytics, {});

  if (!data) {
    return (
      <View className="space-y-4 px-5 pt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </View>
    );
  }

  // Last 14 days for charts
  const viewsData = data.viewsByDay.slice(-14).map((x) => ({
    ...x, date: formatDate(x.date),
  }));
  const profileViewsData = data.profileViewsByDay.slice(-14).map((x) => ({
    ...x, date: formatDate(x.date),
  }));
  const followersData = data.followersByDay.slice(-14).map((x) => ({
    ...x, date: formatDate(x.date),
  }));

  return (
    <View className="space-y-5 px-5 pb-8">
      {/* Week summary card */}
      <View
        className="rounded-2xl p-4"
        style={{ borderWidth: 1, borderColor: "rgba(99,102,241,0.3)", borderStyle: "solid" }}
      >
        <View className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-indigo-400" />
          <Text className="text-sm font-semibold text-white">Vos stats cette semaine</Text>
        </View>
        <View className="gap-3">
          <View className="text-center">
            <Text className="text-2xl font-bold text-white">{data.weekSummary.views}</Text>
            <Text className="text-xs text-white/50">vues</Text>
          </View>
          <View className="text-center">
            <Text className="text-2xl font-bold text-white">{data.weekSummary.likes}</Text>
            <Text className="text-xs text-white/50">likes reçus</Text>
          </View>
        </View>
      </View>

      {/* KPI grid */}
      <View className="gap-3">
        <StatCard icon={<Eye className="w-4 h-4" />}    label="Vues totales"    value={data.totalViews}       color="#6366f1" />
        <StatCard icon={<Heart className="w-4 h-4" />}  label="Likes reçus"     value={data.totalLikes}       color="#ef4444" />
        <StatCard icon={<MessageCircle className="w-4 h-4" />} label="Commentaires" value={data.totalComments} color="#f59e0b" />
        <StatCard icon={<Users className="w-4 h-4" />}  label="Abonnés"         value={data.totalFollowers}   color="#22c55e" />
        <StatCard icon={<FileText className="w-4 h-4" />} label="Publications"   value={data.totalPublications} color="#06b6d4" />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Taux d'engagement"
          value={`${data.engagementRate}%`}
          sub="(likes+comm / vues)"
          color="#8b5cf6"
        />
      </View>

      {/* Views per day chart */}
      <View
        className="rounded-2xl p-4"
        style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
      >
        <Text className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Eye className="w-4 h-4 text-indigo-400" /> Vues / jour (14 j)
        </Text>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={viewsData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="views" name="Vues" stroke="#6366f1" strokeWidth={2} fill="url(#viewsGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </View>

      {/* Profile views chart */}
      <View
        className="rounded-2xl p-4"
        style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
      >
        <Text className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" /> Visites profil (14 j)
        </Text>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={profileViewsData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="views" name="Visites" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </View>

      {/* Follower growth chart */}
      <View
        className="rounded-2xl p-4"
        style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
      >
        <Text className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-400" /> Croissance abonnés (14 j)
        </Text>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={followersData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="follGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="count" name="Abonnés" stroke="#8b5cf6" strokeWidth={2} fill="url(#follGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </View>

      {/* Top publications */}
      {data.topPublications.length > 0 && (
        <View
          className="rounded-2xl p-4"
          style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
        >
          <Text className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" /> Meilleures publications
          </Text>
          <View className="space-y-3">
            {data.topPublications.map((pub, i) => (
              <View key={pub._id} className="flex items-center gap-3">
                <Text
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    i === 0 ? "bg-amber-500 text-black" :
                    i === 1 ? "bg-slate-400 text-black" :
                    i === 2 ? "bg-orange-600 text-white" : "bg-white/10 text-white/60"
                  )}
                >
                  {i + 1}
                </Text>
                <View className="flex-1 min-w-0">
                  <Text className="text-sm text-white truncate">{pub.title}</Text>
                  <Text className="text-xs text-white/40">{TYPE_LABELS[pub.type] ?? pub.type}</Text>
                </View>
                <View className="flex items-center gap-2 text-xs text-white/50 shrink-0">
                  <Text className="flex items-center gap-1"><Eye className="w-3 h-3" />{pub.views}</Text>
                  <Text className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-400" />{pub.likes}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {data.topPublications.length === 0 && (
        <View className="rounded-2xl p-6 text-center"
          style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
          <BarChart2 className="w-8 h-8 text-white/20 mx-auto mb-2" />
          <Text className="text-sm text-white/40">Publiez du contenu pour voir vos analytics</Text>
        </View>
      )}
    </View>
  );
}

export default function AnalyticsPage({ onBack }: AnalyticsPageProps) {
  return (
    <View
      className="h-full w-full flex flex-col overflow-hidden"
      style={{  }}
    >
      {/* Header */}
      <View className="flex items-center gap-3 px-5 pt-12 pb-4 shrink-0">
        <Pressable
          onPress={onBack}
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-xl font-bold text-white">Analytics</Text>
          <Text className="text-xs text-white/40">Vos statistiques personnelles</Text>
        </View>
        <Badge variant="secondary" className="text-xs bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
          <Text>30 derniers jours</Text></Badge>
      </View>

      <View className="flex-1 overflow-y-auto" style={{  }}>
        <Authenticated>
          <AnalyticsInner onBack={onBack} />
        </Authenticated>
        <Unauthenticated>
          <View className="flex flex-col items-center justify-center h-64 gap-4 px-8 text-center">
            <BarChart2 className="w-12 h-12 text-white/20" />
            <Text className="text-white/50 text-sm"><Text>Connectez-vous pour voir vos analytics</Text></Text>
            <SignInButton />
          </View>
        </Unauthenticated>
      </View>
    </View>
  );
}
