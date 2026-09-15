import { View, Text } from "react-native";
import { Eye, Heart, Share2, MessageCircle, TrendingUp } from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  publicationId: Id<"publications">;
}

export function AnnonceStatistics({ publicationId }: Props) {
  const statsData = useQuery(api.annonceAnalytics.getPublicationStats, {
    publicationId,
  });

  if (statsData === undefined) {
    return (
      <View className="text-white/40 text-sm"><Text>Chargement des statistiques...</Text></View>
    );
  }

  const stats = statsData || {
    views: 0,
    likes: 0,
    favorites: 0,
    shares: 0,
    offers: 0,
    averageRating: 0,
    reviewCount: 0,
  };

  const statItems = [
    { icon: Eye, label: "Vues", value: stats.views },
    { icon: Heart, label: "Favoris", value: stats.favorites },
    { icon: Share2, label: "Partages", value: stats.shares },
    { icon: MessageCircle, label: "Offres", value: stats.offers },
  ];

  return (
    <View className="space-y-2"><Text className="text-sm font-medium text-white/50">Statistiques</Text><View className="gap-2">{statItems.map((item) => (
          <View key={item.label} className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
            <item.icon size={14} className="text-white/30 mx-auto" />
            <Text className="text-white font-bold text-sm mt-1">{item.value}</Text>
            <Text className="text-white/30 text-[10px]">{item.label}</Text>
          </View>
        ))}</View>{stats.averageRating > 0 && (
        <View className="flex items-center gap-2 text-xs text-white/40">
          <TrendingUp size={12} className="text-yellow-400" />
          <Text>Note moyenne : {stats.averageRating.toFixed(1)} / 5</Text>
          <Text className="text-white/20">·</Text>
          <Text>{stats.reviewCount} avis</Text>
        </View>
      )}</View>
  );
}
