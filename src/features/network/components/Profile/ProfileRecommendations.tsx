import { View, Text, Pressable } from "react-native";

// src/features/network/components/Profile/ProfileRecommendations.tsx
import { Star, User, ThumbsUp, MessageSquare } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Recommendation {
  _id: string;
  fromUserId: string;
  fromName: string;
  fromAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ProfileRecommendationsProps {
  recommendations?: Recommendation[];
  editable?: boolean;
  onAdd?: () => void;
  isLoading?: boolean;
  className?: string;
  maxDisplay?: number;
}

function RecommendationItem({
  recommendation,
}: {
  recommendation: Recommendation;
}) {
  const date = new Date(recommendation.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
      <View className="flex items-center justify-between"><View className="flex items-center gap-2"><View className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-500/20 text-indigo-400 text-xs font-bold">{recommendation.fromName
              .split(" ")
              .slice(0, 2)
              .map((p) => p[0])
              .join("")
              .toUpperCase()}</View><View><Text className="text-white font-semibold text-sm">{recommendation.fromName}</Text><Text className="text-white/30 text-xs">{date}</Text></View></View><View className="flex items-center gap-0.5">{Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={14}
              className={cn(
                i < recommendation.rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-white/20",
              )}
            />
          ))}</View></View>
      <Text className="text-white/60 text-sm leading-relaxed">{recommendation.comment}</Text>
    </View>
  );
}

export function ProfileRecommendations({
  recommendations = [],
  editable = false,
  onAdd,
  isLoading = false,
  className,
  maxDisplay = 3,
}: ProfileRecommendationsProps) {
  if (isLoading) {
    return (
      <View className={cn("space-y-3", className)}><View className="flex items-center justify-between"><View className="flex items-center gap-2"><Skeleton className="w-8 h-8 rounded-xl" /><Skeleton className="h-4 w-24 rounded-lg" /></View><Skeleton className="h-8 w-20 rounded-xl" /></View><Skeleton className="h-24 w-full rounded-xl" /><Skeleton className="h-24 w-full rounded-xl" /></View>
    );
  }

  const hasRecommendations = recommendations.length > 0;
  const displayItems = recommendations.slice(0, maxDisplay);
  const hasMore = recommendations.length > maxDisplay;

  return (
    <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn(
        "rounded-3xl p-5",
        "bg-white/5 border border-white/10",
        className,
      )}>
      <View className="flex items-center justify-between mb-4"><View className="flex items-center gap-2"><View className="w-8 h-8 rounded-xl flex items-center justify-center bg-yellow-500/10 text-yellow-400"><MessageSquare size={15} /></View><Text className="text-white font-bold text-sm">Recommandations</Text><Text className="text-white/30 text-xs">({recommendations.length})
          </Text></View>{editable && onAdd && (
          <Pressable onPress={onAdd} className="flex items-center gap-1 text-xs text-yellow-400 transition-colors">
            <ThumbsUp size={12} />
            Recommander
          </Pressable>
        )}</View>

      {hasRecommendations ? (
        <View className="space-y-3">
          {displayItems.map((rec) => (
            <RecommendationItem key={rec._id} recommendation={rec} />
          ))}
          {hasMore && (
            <Pressable className="text-xs text-white/40 transition-colors">
              Voir les {recommendations.length} recommandations
            </Pressable>
          )}
        </View>
      ) : (
        <Text className="text-white/30 text-sm italic">
          {editable
            ? "Demandez des recommandations à votre réseau"
            : "Aucune recommandation"}
        </Text>
      )}
    </View>
  );
}
