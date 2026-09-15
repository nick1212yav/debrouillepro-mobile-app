import { View, Image, Text, Pressable } from "react-native";
import { useState } from "react";
import {
  User,
  Star,
  Calendar,
  Users,
  Trophy,
  Award,
  TrendingUp,
  Zap,
} from "lucide-react-native";

interface Props {
  creatorId: string;
  name: string;
  avatar?: string;
  bio?: string;
  followers: number;
  totalLikes: number;
  postsCount: number;
  badges: string[];
  isVerified: boolean;
  joinedAt: number;
  onFollow: () => Promise<void>;
  onUnfollow: () => Promise<void>;
  isFollowing: boolean;
  onViewProfile: () => void;
}

export function CommunityCreator({
  creatorId,
  name,
  avatar,
  bio,
  followers,
  totalLikes,
  postsCount,
  badges,
  isVerified,
  joinedAt,
  onFollow,
  onUnfollow,
  isFollowing,
  onViewProfile,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleFollowToggle = async () => {
    setIsLoading(true);
    try {
      if (isFollowing) {
        await onUnfollow();
      } else {
        await onFollow();
      }
    } catch {
      // error handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days} jours`;
    if (days < 30) return `Il y a ${Math.floor(days / 7)} semaines`;
    return `Il y a ${Math.floor(days / 30)} mois`;
  };

  const stats = [
    { label: "Abonnés", value: followers, icon: Users },
    { label: "Likes", value: totalLikes, icon: Star },
    { label: "Posts", value: postsCount, icon: Trophy },
  ];

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/5 transition-colors" onPress={onViewProfile}><View className="flex items-start gap-3">{avatar ? (
          <Image className="w-14 h-14 rounded-full object-cover flex-shrink-0 border-2 border-purple-500/30" source={{ uri: avatar }} accessibilityLabel={name} />
        ) : (
          <View className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-500 to-indigo-500"><User size={24} className="text-white" /></View>
        )}<View className="flex-1 min-w-0"><View className="flex items-center gap-1.5"><Text className="text-white font-semibold text-base">{name}</Text>{isVerified && (
              <Text className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">✓ Vérifié
              </Text>
            )}</View>{bio && (
            <Text className="text-white/60 text-sm mt-0.5">{bio}</Text>
          )}<View className="flex items-center gap-2 text-xs text-white/30 mt-1"><Calendar size={10} /><Text>Membre depuis {formatDate(joinedAt)}</Text></View></View><Pressable onPress={(e) => {
            handleFollowToggle();
          }} disabled={isLoading} className={`flex-shrink-0 px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${
            isFollowing
              ? "bg-white/10 text-white/60 hover:bg-white/20"
              : "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:opacity-80"
          } disabled:opacity-50`}>{isLoading ? "..." : isFollowing ? "Suivi" : "Suivre"}</Pressable></View>{}<View className="flex gap-3 mt-3 pt-3 border-t border-white/5">{stats.map((stat) => (
          <View key={stat.label} className="flex-1 text-center">
            <Text className="text-white font-bold text-sm">{stat.value}</Text>
            <Text className="text-white/30 text-[10px]">{stat.label}</Text>
          </View>
        ))}</View>{}{badges.length > 0 && (
        <View className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-white/5">
          {badges.map((badge) => (
            <Text key={badge} className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-500/10 text-yellow-400">
              <Award size={10} />
              {badge}
            </Text>
          ))}
        </View>
      )}</View>
  );
}
