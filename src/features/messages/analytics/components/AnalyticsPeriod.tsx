import { Picker } from "@react-native-picker/picker";
import { View, Text } from "react-native";
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

export function AnalyticsPeriod({
  period,
  metric,
  onPeriodChange,
  onMetricChange,
}: AnalyticsPeriodProps) {
  return (
    <View className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <View className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
        <Pressable
          type="button"
          onPress={() => onPeriodChange("7d")}
          className={`rounded-lg px-3 py-1.5 text-xs ${
            period === "7d" ? "bg-white text-black" : "text-white/50"
          }`}
        >
          <Text>7 jours</Text></Pressable>

        <Pressable
          type="button"
          onPress={() => onPeriodChange("30d")}
          className={`rounded-lg px-3 py-1.5 text-xs ${
            period === "30d" ? "bg-white text-black" : "text-white/50"
          }`}
        >
          <Text>30 jours</Text></Pressable>
      </View>

      <Picker
       
        onValueChange={(event) =>
          onMetricChange(event.target.value as AnalyticsMetric)
        }
        className="rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white outline-none"
       selectedValue={metric}>
        <Picker.Item label="Vues" value="views" />

        <Picker.Item label="J'aime" value="likes" />

        <Picker.Item label="Abonnés" value="followers" />

        <Picker.Item label="Visites du profil" value="profileViews" />
      </Picker>
    </View>
  );
}

export default AnalyticsPeriod;
