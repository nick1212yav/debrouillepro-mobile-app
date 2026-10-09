import { Picker } from "@react-native-picker/picker";
import { Pressable, Text, View } from "react-native";

import type {
  AnalyticsMetric,
  AnalyticsPeriod,
} from "../services/analytics.service";

interface AnalyticsPeriodProps {
  period: AnalyticsPeriod;
  metric: AnalyticsMetric;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  onMetricChange: (metric: AnalyticsMetric) => void;
}

const metricOptions: ReadonlyArray<{
  label: string;
  value: AnalyticsMetric;
}> = [
  {
    label: "Vues",
    value: "views",
  },
  {
    label: "J'aime",
    value: "likes",
  },
  {
    label: "Abonnés",
    value: "followers",
  },
  {
    label: "Visites du profil",
    value: "profileViews",
  },
];

function isAnalyticsMetric(value: unknown): value is AnalyticsMetric {
  return metricOptions.some((option) => option.value === value);
}

export function AnalyticsPeriod({
  period,
  metric,
  onPeriodChange,
  onMetricChange,
}: AnalyticsPeriodProps) {
  const handleMetricChange = (value: unknown) => {
    if (isAnalyticsMetric(value)) {
      onMetricChange(value);
    }
  };

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-row rounded-xl border border-white/10 bg-white/[0.03] p-1">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Période de 7 jours"
            accessibilityState={{ selected: period === "7d" }}
            onPress={() => onPeriodChange("7d")}
            className={[
              "rounded-lg px-3 py-1.5",
              period === "7d" ? "bg-white" : "bg-transparent",
            ].join(" ")}
          >
            <Text
              className={[
                "text-xs font-medium",
                period === "7d" ? "text-black" : "text-white/50",
              ].join(" ")}
            >
              7 jours
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Période de 30 jours"
            accessibilityState={{ selected: period === "30d" }}
            onPress={() => onPeriodChange("30d")}
            className={[
              "rounded-lg px-3 py-1.5",
              period === "30d" ? "bg-white" : "bg-transparent",
            ].join(" ")}
          >
            <Text
              className={[
                "text-xs font-medium",
                period === "30d" ? "text-black" : "text-white/50",
              ].join(" ")}
            >
              30 jours
            </Text>
          </Pressable>
        </View>

        <View className="min-w-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-black">
          <Picker
            selectedValue={metric}
            onValueChange={handleMetricChange}
            style={{
              color: "#ffffff",
              height: 48,
            }}
            dropdownIconColor="#ffffff"
          >
            {metricOptions.map((option) => (
              <Picker.Item
                key={option.value}
                label={option.label}
                value={option.value}
              />
            ))}
          </Picker>
        </View>
      </View>
    </View>
  );
}

export default AnalyticsPeriod;
