import { View, Text, Pressable } from "react-native";

// src/features/messages/analytics/components/AnalyticsDashboard.tsx

import { useAnalytics } from "../hooks/useAnalytics";

import AnalyticsSummary from "./AnalyticsSummary";
import AnalyticsChart from "./AnalyticsChart";
import TopPublications from "./TopPublications";

interface AnalyticsDashboardProps {
  title?: string;
}

export function AnalyticsDashboard({
  title = "Analytics",
}: AnalyticsDashboardProps) {
  const {
    analytics,
    isLoading,

    period,
    setPeriod,

    metric,
    setMetric,

    chartData,

    formatNumber,
    formatPercentage,
  } = useAnalytics();

  // ==========================================================================
  // LOADING
  // ==========================================================================

  if (isLoading) {
    return (
      <View className="flex min-h-[300px] items-center justify-center"><View className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 text-sm text-white/50"><Text>Chargement des analytics...</Text></View></View>
    );
  }

  // ==========================================================================
  // EMPTY / ERROR
  // ==========================================================================

  if (!analytics) {
    return (
      <View className="flex min-h-[300px] items-center justify-center"><View className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 text-sm text-white/50"><Text>Impossible de récupérer les analytics.</Text></View></View>
    );
  }

  // ==========================================================================
  // DASHBOARD
  // ==========================================================================

  return (
    <View className="space-y-6">{}{}{}<View><Text className="text-xl font-semibold tracking-tight text-white">{title}</Text><Text className="mt-1 text-sm text-white/40">Vue d'ensemble de votre activité.
        </Text></View>{}{}{}<AnalyticsSummary analytics={analytics} formatNumber={formatNumber} formatPercentage={formatPercentage} />{}{}{}<View className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><View className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">{}{}{}<View className="flex flex-wrap items-center gap-2"><Text className="mr-1 text-xs font-medium uppercase tracking-wider text-white/40">Période
            </Text>{(["7d", "30d"] as const).map((value) => {
              const active = period === value;

              return (
                <Pressable key={value} onPress={() => setPeriod(value)} className={[
                    "rounded-xl px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-white text-black shadow-sm"
                      : "bg-white/[0.05] text-white/60 hover:bg-white/[0.09] hover:text-white",
                  ].join(" ")}>{value === "7d" ? "7 jours" : "30 jours"}</Pressable>
              );
            })}</View>{}{}{}<View className="flex flex-wrap items-center gap-2"><Text className="mr-1 text-xs font-medium uppercase tracking-wider text-white/40">Indicateur
            </Text>{(["views", "likes"] as const).map((value) => {
              const active = metric === value;

              return (
                <Pressable key={value} onPress={() => setMetric(value)} className={[
                    "rounded-xl px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-white text-black shadow-sm"
                      : "bg-white/[0.05] text-white/60 hover:bg-white/[0.09] hover:text-white",
                  ].join(" ")}>
                  {value === "views" ? "Vues" : "J'aime"}
                </Pressable>
              );
            })}</View></View></View>{}{}{}<AnalyticsChart data={chartData} metric={metric} />{}{}{}<TopPublications publications={analytics.topPublications} /></View>
  );
}

export default AnalyticsDashboard;
