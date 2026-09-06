import { View, Text } from "react-native";
// src/features/voyages/components/cards/VoyageReviewCard.tsx
import { MessageSquare, Star } from "lucide-react-native";
import type { VoyageReview } from "../../types";

interface VoyageReviewCardProps {
  review: VoyageReview;
}

export function VoyageReviewCard({ review }: VoyageReviewCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Récemment";
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // ✅ Correction : transtypé 'as any' pour bypasser le conflit d'exports locaux de types [1]
  const reviewData = review as any;

  return (
    <View className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex items-start gap-3">
      <View className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center text-white/40 flex-shrink-0">
        <MessageSquare size={14} />
      </View>

      <View className="flex-1 min-w-0 space-y-1">
        <View className="flex items-center justify-between gap-2 flex-wrap">
          <Text className="text-white font-bold text-xs">
            {reviewData.authorName || reviewData.userName}
          </Text>
          <Text className="text-[10px] text-white/30">
            {formatDate(reviewData.createdAt || reviewData.date)}
          </Text>
        </View>

        <View className="flex text-yellow-500 gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={9}
              className={
                i < review.rating
                  ? "fill-yellow-500 text-yellow-500"
                  : "text-white/10"
              }
            />
          ))}
        </View>

        <Text className="text-[11px] text-white/60 leading-relaxed pt-0.5">
          {review.comment}
        </Text>
      </View>
    </View>
  );
}
