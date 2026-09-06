import { View, Text } from "react-native";
import analyticsService, {
  type AnalyticsMetric,
} from "../services/analytics.service";

interface AnalyticsChartProps {
  data: Array<{
    date: string;
    views?: number;
    likes?: number;
    count?: number;
  }>;
  metric: AnalyticsMetric;
}

export function AnalyticsChart({ data, metric }: AnalyticsChartProps) {
  const values = data.map((item) => {
    switch (metric) {
      case "views":
      case "profileViews":
        return item.views ?? 0;

      case "likes":
        return item.likes ?? 0;

      case "followers":
        return item.count ?? 0;

      default:
        return 0;
    }
  });

  const max = Math.max(...values, 1);

  return (
    <View className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <View className="mb-5 flex items-center justify-between">
        <View>
          <Text className="text-sm font-semibold text-white">
            {analyticsService.getMetricLabel(metric)}
          </Text>

          <Text className="mt-1 text-xs text-white/30">Évolution quotidienne</Text>
        </View>
      </View>

      <View className="flex h-56 items-end gap-1">
        {data.map((item, index) => {
          const value = values[index] ?? 0;

          const height = Math.max((value / max) * 100, value > 0 ? 2 : 0);

          return (
            <View
              key={item.date}
              className="group flex h-full min-w-0 flex-1 flex-col justify-end"
            >
              <View className="relative flex h-full items-end">
                <View
                  className="w-full rounded-t-md bg-white/70"
                  style={{
                    height: `${height}%`,
                  }}
                  title={`${analyticsService.formatDate(item.date)}: ${value}`}
                />
              </View>

              {(data.length <= 7 ||
                index === 0 ||
                index === data.length - 1 ||
                index % 5 === 0) && (
                <Text className="mt-2 truncate text-center text-[9px] text-white/30">
                  {analyticsService.formatDate(item.date)}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default AnalyticsChart;
