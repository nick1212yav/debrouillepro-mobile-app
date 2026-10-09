import { Pressable, Text, View } from "react-native";

import { useAnalytics } from "../hooks/useAnalytics";

import AnalyticsChart from "./AnalyticsChart";
import AnalyticsSummary from "./AnalyticsSummary";
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

  if (isLoading) {
    return (
      <View className="min-h-[300px] items-center justify-center">
        <View className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5">
          <Text className="text-sm text-white/50">
            Chargement des analytics...
          </Text>
        </View>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View className="min-h-[300px] items-center justify-center">
        <View className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5">
          <Text className="text-sm text-white/50">
            Impossible de récupérer les analytics.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-6">
      <View>
        <Text className="text-xl font-semibold tracking-tight text-white">
          {title}
        </Text>

        <Text className="mt-1 text-sm text-white/40">
          Vue d&apos;ensemble de votre activité.
        </Text>
      </View>

      <AnalyticsSummary
        analytics={analytics}
        formatNumber={formatNumber}
        formatPercentage={formatPercentage}
      />

      <View className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <View className="gap-4">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="mr-1 text-xs font-medium uppercase tracking-wider text-white/40">
              Période
            </Text>

            {(["7d", "30d"] as const).map((value) => {
              const active = period === value;

              return (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityLabel={
                    value === "7d"
                      ? "Période de 7 jours"
                      : "Période de 30 jours"
                  }
                  accessibilityState={{ selected: active }}
                  onPress={() => setPeriod(value)}
                  className={[
                    "rounded-xl px-3 py-2",
                    active
                      ? "bg-white"
                      : "bg-white/[0.05] active:bg-white/[0.09]",
                  ].join(" ")}
                >
                  <Text
                    className={[
                      "text-sm font-medium",
                      active ? "text-black" : "text-white/60",
                    ].join(" ")}
                  >
                    {value === "7d" ? "7 jours" : "30 jours"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="mr-1 text-xs font-medium uppercase tracking-wider text-white/40">
              Indicateur
            </Text>

            {(["views", "likes"] as const).map((value) => {
              const active = metric === value;

              return (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityLabel={
                    value === "views"
                      ? "Indicateur vues"
                      : "Indicateur mentions J'aime"
                  }
                  accessibilityState={{ selected: active }}
                  onPress={() => setMetric(value)}
                  className={[
                    "rounded-xl px-3 py-2",
                    active
                      ? "bg-white"
                      : "bg-white/[0.05] active:bg-white/[0.09]",
                  ].join(" ")}
                >
                  <Text
                    className={[
                      "text-sm font-medium",
                      active ? "text-black" : "text-white/60",
                    ].join(" ")}
                  >
                    {value === "views" ? "Vues" : "J'aime"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <AnalyticsChart data={chartData} metric={metric} />

      <TopPublications publications={analytics.topPublications} />
    </View>
  );
}

export default AnalyticsDashboard;
