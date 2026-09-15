import { View, Text, Image } from "react-native";

// src/features/marketplace/components/SellerReviews.tsx
import { Star, User } from "lucide-react-native";
import { formatDate } from "../utils/formatter";
import type { Review } from "../types";

interface Props {
  reviews: Review[];
  maxDisplay?: number;
}

export function SellerReviews({ reviews, maxDisplay = 3 }: Props) {
  const display = reviews.slice(0, maxDisplay);
  if (display.length === 0) {
    return (
      <View className="text-white/30 text-sm text-center py-4"><Text>Aucun avis sur ce vendeur</Text></View>
    );
  }

  return (
    <View className="space-y-3"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">Avis ({reviews.length})
      </Text>{display.map((review) => (
        <View key={review._id} className="p-3 rounded-xl bg-white/5 border border-white/5"><View className="flex items-center gap-2 mb-1">{review.reviewerAvatar ? (
              <Image className="w-6 h-6 rounded-full object-cover" source={{ uri: review.reviewerAvatar }} accessibilityLabel={review.reviewerName} />
            ) : (
              <User size={14} className="text-white/30" />
            )}<Text className="text-white text-xs font-medium">{review.reviewerName || "Utilisateur"}</Text><View className="flex gap-0.5 ml-auto">{Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={10}
                  className={
                    i < review.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-white/20"
                  }
                />
              ))}</View></View>{review.comment && (
            <Text className="text-white/60 text-xs leading-relaxed">
              {review.comment}
            </Text>
          )}<Text className="text-white/20 text-[10px] mt-1">{formatDate(review.createdAt)}</Text></View>
      ))}</View>
  );
}
