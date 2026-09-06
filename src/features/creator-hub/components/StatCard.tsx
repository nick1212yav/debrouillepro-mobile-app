import { Text, View } from "react-native";

// src/features/creator-hub/components/StatCard.tsx

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
  delta?: string;
}

export function StatCard({
  label,
  value,
  icon,
  color,
  sub,
  delta,
}: StatCardProps) {
  return (
    <View
      className="p-4 rounded-2xl flex items-center gap-3"
      style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
    >
      <View
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}20` }}
      >
        {icon}
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-xs text-white/40 mb-0.5">{label}</Text>
        <Text className="text-white font-black text-xl leading-none">
          {fmt(typeof value === "number" ? value : Number(value) || 0)}
          {typeof value === "string" && isNaN(Number(value)) ? value : ""}
        </Text>
        {sub && <Text className="text-white/35 text-xs mt-0.5">{sub}</Text>}
      </View>
      {delta && (
        <Text
          className="text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0"
          style={{ backgroundColor: "rgba(16,185,129,0.15)", color: "#34D399" }}
        >
          {delta}
        </Text>
      )}
    </View>
  );
}
