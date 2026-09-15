import { View, Text } from "react-native";

// src/features/network/components/Profile/ProfileStats.tsx
import {
  Users,
  UserPlus,
  TrendingUp,
  Eye,
  Calendar,
  Clock,
  ThumbsUp,
  MessageSquare,
} from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileStatsProps {
  followerCount: number;
  followingCount: number;
  postCount?: number;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  engagementRate?: number;
  isLoading?: boolean;
  className?: string;
}

export function ProfileStats({
  followerCount,
  followingCount,
  postCount,
  viewCount,
  likeCount,
  commentCount,
  engagementRate,
  isLoading = false,
  className,
}: ProfileStatsProps) {
  if (isLoading) {
    return (
      <View className={cn("grid grid-cols-2 md:grid-cols-3 gap-2", className)}>{Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}</View>
    );
  }

  const stats = [
    {
      label: "Abonnés",
      value: followerCount,
      icon: Users,
      color: "#6366F1",
    },
    {
      label: "Abonnements",
      value: followingCount,
      icon: UserPlus,
      color: "#10B981",
    },
    ...(postCount !== undefined
      ? [
          {
            label: "Publications",
            value: postCount,
            icon: Calendar,
            color: "#F59E0B",
          },
        ]
      : []),
    ...(viewCount !== undefined
      ? [
          {
            label: "Vues",
            value: viewCount,
            icon: Eye,
            color: "#06B6D4",
          },
        ]
      : []),
    ...(likeCount !== undefined
      ? [
          {
            label: "Likes",
            value: likeCount,
            icon: ThumbsUp,
            color: "#EC4899",
          },
        ]
      : []),
    ...(commentCount !== undefined
      ? [
          {
            label: "Commentaires",
            value: commentCount,
            icon: MessageSquare,
            color: "#A78BFA",
          },
        ]
      : []),
    ...(engagementRate !== undefined
      ? [
          {
            label: "Taux d'engagement",
            value: `${engagementRate}%`,
            icon: TrendingUp,
            color: "#F97316",
          },
        ]
      : []),
  ];

  const formatValue = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val;
  };

  return (
    <View className={cn("grid grid-cols-2 md:grid-cols-3 gap-2", className)}>{stats.map((stat, index) => (
        <View key={stat.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.04 }} className="p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}>
          <View className="flex items-center gap-2"><View className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${stat.color}15` }}><stat.icon size={13} /></View><View className="min-w-0"><Text className="text-white font-bold text-sm truncate">{typeof stat.value === "number"
                  ? formatValue(stat.value)
                  : stat.value}</Text><Text className="text-white/30 text-[10px] truncate">{stat.label}</Text></View></View>
        </View>
      ))}</View>
  );
}
