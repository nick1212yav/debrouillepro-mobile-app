import { View, Text } from "react-native";
import { TrendingUp, Users, Clock, Heart, BarChart3, Zap } from "lucide-react-native";

interface Props {
  postsCount: number;
  followers: number;
  engagementRate: number;
  averageLikes: number;
  bestTime: string;
  activeDays: number;
}

export function CommunityInsights({
  postsCount,
  followers,
  engagementRate,
  averageLikes,
  bestTime,
  activeDays,
}: Props) {
  const insights = [
    { label: "Posts", value: postsCount, icon: BarChart3, color: "#8B5CF6" },
    { label: "Followers", value: followers, icon: Users, color: "#3B82F6" },
    {
      label: "Engagement",
      value: `${engagementRate}%`,
      icon: Heart,
      color: "#EC4899",
    },
    {
      label: "Moy. likes",
      value: averageLikes,
      icon: TrendingUp,
      color: "#F59E0B",
    },
    {
      label: "Meilleur moment",
      value: bestTime,
      icon: Clock,
      color: "#10B981",
    },
    {
      label: "Jours actifs",
      value: `${activeDays}/30`,
      icon: Zap,
      color: "#EF4444",
    },
  ];

  return (
    <View className="space-y-2"><Text className="text-sm font-medium text-white/50">Insights</Text><View className="gap-1.5">{insights.map((insight) => (
          <View key={insight.label} className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
            <insight.icon
              size={14}
              style={{  }}
              className="mx-auto"
            />
            <Text className="text-white font-bold text-sm mt-1">{insight.value}</Text>
            <Text className="text-white/30 text-[10px]">{insight.label}</Text>
          </View>
        ))}</View></View>
  );
}
