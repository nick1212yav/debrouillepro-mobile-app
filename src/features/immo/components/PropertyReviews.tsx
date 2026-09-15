import { View, Text, Image } from "react-native";
import { Star, User } from "lucide-react-native";

interface Props {
  reviews?: Array<{
    id: string;
    reviewerName: string;
    reviewerAvatar?: string;
    rating: number;
    comment: string;
    date: string;
  }>;
}

export function PropertyReviews({ reviews = [] }: Props) {
  if (reviews.length === 0) {
    return (
      <View className="bg-white/5 rounded-2xl p-4"><Text className="text-sm font-medium text-white/70 mb-2">Avis</Text><Text className="text-sm text-white/40">Aucun avis pour le moment</Text></View>
    );
  }

  return (
    <View className="bg-white/5 rounded-2xl p-4"><Text className="text-sm font-medium text-white/70 mb-2">Avis ({reviews.length})
      </Text><View className="space-y-3">{reviews.slice(0, 3).map((review) => (
          <View key={review.id} className="border-t border-white/5 pt-3 first:border-t-0 first:pt-0"><View className="flex items-center gap-2">{review.reviewerAvatar ? (
                <Image className="w-6 h-6 rounded-full object-cover" source={{ uri: review.reviewerAvatar }} accessibilityLabel={review.reviewerName} />
              ) : (
                <View className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center"><User size={12} className="text-white/30" /></View>
              )}<Text className="text-xs text-white/60">{review.reviewerName}</Text><View className="flex items-center gap-0.5 ml-auto">{Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={
                      i < review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-white/20"
                    }
                  />
                ))}</View></View><Text className="text-xs text-white/50 mt-1">{review.comment}</Text></View>
        ))}</View></View>
  );
}
