import { View } from "react-native";
interface AnalyticsCardProps {
  label: string;
  value: number | string;
  description?: string;
  icon?: React.ReactNode;
}

export function AnalyticsCard({
  label,
  value,
  description,
  icon,
}: AnalyticsCardProps) {
  return (
    <View className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <View className="flex items-start justify-between gap-3">
        <View>
          <Text className="text-xs text-white/40">{label}</Text>

          <Text className="mt-2 text-2xl font-semibold text-white">{value}</Text>

          {description && (
            <Text className="mt-1 text-xs text-white/30">{description}</Text>
          )}
        </View>

        {icon && (
          <View className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-sm">
            {icon}
          </View>
        )}
      </View>
    </View>
  );
}

export default AnalyticsCard;
