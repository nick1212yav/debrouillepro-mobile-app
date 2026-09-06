import { Text, View, Pressable } from "react-native";

// src/features/network/components/NetworkStats.tsx
import { Users, UserPlus, TrendingUp, Clock } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface NetworkStatsProps {
  followerCount: number;
  followingCount: number;
  viewCount?: number;
  engagementRate?: number;
  isLoading?: boolean;
  className?: string;
  onStatClick?: (
    stat: "followers" | "following" | "views" | "engagement",
  ) => void;
}

export function NetworkStats({
  followerCount,
  followingCount,
  viewCount,
  engagementRate,
  isLoading = false,
  className,
  onStatClick,
}: NetworkStatsProps) {
  const stats = [
    {
      key: "followers" as const,
      label: "Abonnés",
      value: followerCount,
      icon: Users,
      color: "#6366F1",
      bg: "rgba(99,102,241,0.15)",
    },
    {
      key: "following" as const,
      label: "Abonnements",
      value: followingCount,
      icon: UserPlus,
      color: "#10B981",
      bg: "rgba(16,185,129,0.15)",
    },
    ...(viewCount !== undefined
      ? [
          {
            key: "views" as const,
            label: "Vues",
            value: viewCount,
            icon: TrendingUp,
            color: "#F59E0B",
            bg: "rgba(245,158,11,0.15)",
          },
        ]
      : []),
    ...(engagementRate !== undefined
      ? [
          {
            key: "engagement" as const,
            label: "Taux engagement",
            value: `${engagementRate}%`,
            icon: Clock,
            color: "#EC4899",
            bg: "rgba(236,72,153,0.15)",
          },
        ]
      : []),
  ];

  const formatValue = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val;
  };

  if (isLoading) {
    return (
      <View className={cn("flex gap-3 px-4", className)}>
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="flex-1 h-16 rounded-xl" />
        ))}
      </View>
    );
  }

  return (
    <View className={cn("flex gap-3 px-4", className)}>
      {stats.map((stat, index) => (
        <Pressable
          key={stat.key}
          onPress={() => onStatClick?.(stat.key)}
          className="flex-1 p-3 rounded-xl flex items-center gap-2 text-left"
          style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
        >
          <View
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: stat.bg }}
          >
            <stat.icon size={14} />
          </View>
          <View className="min-w-0">
            <Text className="text-white font-bold text-sm truncate">
              {typeof stat.value === "number"
                ? formatValue(stat.value)
                : stat.value}
            </Text>
            <Text className="text-white/40 text-[11px] truncate">{stat.label}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
