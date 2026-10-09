import type { ReactNode } from "react";
import { Text, View } from "react-native";

interface AnalyticsCardProps {
  label: string;
  value: number | string;
  description?: string;
  icon?: ReactNode;
}

export function AnalyticsCard({
  label,
  value,
  description,
  icon,
}: AnalyticsCardProps) {
  return (
    <View className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-xs text-white/40">{label}</Text>

          <Text className="mt-2 text-2xl font-semibold text-white">
            {value}
          </Text>

          {description ? (
            <Text className="mt-1 text-xs text-white/30">{description}</Text>
          ) : null}
        </View>

        {icon ? (
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-white/5">
            {icon}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default AnalyticsCard;
