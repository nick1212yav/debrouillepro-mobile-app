import { StyleSheet, Text, View } from "react-native";

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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {analyticsService.getMetricLabel(metric)}
        </Text>

        <Text style={styles.subtitle}>Évolution quotidienne</Text>
      </View>

      {data.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Aucune donnée disponible pour cette période.
          </Text>
        </View>
      ) : (
        <View
          style={styles.chart}
          accessibilityRole="summary"
          accessibilityLabel={`Graphique : ${analyticsService.getMetricLabel(metric)}`}
        >
          {data.map((item, index) => {
            const value = values[index] ?? 0;

            const height = Math.max((value / max) * 100, value > 0 ? 2 : 0);

            const showLabel =
              data.length <= 7 ||
              index === 0 ||
              index === data.length - 1 ||
              index % 5 === 0;

            return (
              <View key={`${item.date}-${index}`} style={styles.barColumn}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${height}%`,
                      },
                    ]}
                    accessibilityRole="image"
                    accessibilityLabel={`${analyticsService.formatDate(
                      item.date,
                    )}: ${value}`}
                  />
                </View>

                {showLabel ? (
                  <Text
                    style={styles.barLabel}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {analyticsService.formatDate(item.date)}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 16,
  },

  header: {
    marginBottom: 20,
  },

  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "rgba(255,255,255,0.30)",
  },

  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 224,
    gap: 4,
  },

  barColumn: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    flexDirection: "column",
    justifyContent: "flex-end",
  },

  barWrapper: {
    flex: 1,
    width: "100%",
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },

  bar: {
    width: "100%",
    minHeight: 0,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: "rgba(255,255,255,0.70)",
  },

  barLabel: {
    marginTop: 8,
    fontSize: 9,
    color: "rgba(255,255,255,0.30)",
    textAlign: "center",
  },

  emptyState: {
    height: 224,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 16,
  },

  emptyText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.30)",
    textAlign: "center",
  },
});

export default AnalyticsChart;
