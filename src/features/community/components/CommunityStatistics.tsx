import { View, Text } from "react-native";
import { Eye, Heart, MessageCircle, Share2, Bookmark } from "lucide-react-native";

interface Props {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  onViewsClick?: () => void;
  onLikesClick?: () => void;
  onCommentsClick?: () => void;
  onSharesClick?: () => void;
  onBookmarksClick?: () => void;
}

export function CommunityStatistics({
  views,
  likes,
  comments,
  shares,
  bookmarks,
  onViewsClick,
  onLikesClick,
  onCommentsClick,
  onSharesClick,
  onBookmarksClick,
}: Props) {
  const stats = [
    { icon: Eye, label: "Vues", value: views, onClick: onViewsClick },
    { icon: Heart, label: "Likes", value: likes, onClick: onLikesClick },
    {
      icon: MessageCircle,
      label: "Commentaires",
      value: comments,
      onClick: onCommentsClick,
    },
    { icon: Share2, label: "Partages", value: shares, onClick: onSharesClick },
    {
      icon: Bookmark,
      label: "Enregistrements",
      value: bookmarks,
      onClick: onBookmarksClick,
    },
  ];

  return (
    <View className="space-y-2"><Text className="text-sm font-medium text-white/50">Statistiques</Text><View className="gap-1.5">{stats.map((stat) => (
          <View key={stat.label} className="text-center p-2 rounded-xl bg-white/5 border border-white/5 transition-colors" onPress={stat.onClick}>
            <stat.icon size={14} className="text-white/30 mx-auto" />
            <Text className="text-white font-bold text-sm mt-1">{stat.value}</Text>
            <Text className="text-white/30 text-[10px]">{stat.label}</Text>
          </View>
        ))}</View></View>
  );
}
