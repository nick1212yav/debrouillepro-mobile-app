import { View, Text, Pressable, TextInput, Image } from "react-native";

// src/features/events/components/EventReviews.tsx
import { useState } from "react";
import { Star, User, ThumbsUp } from "lucide-react-native";
import { toast } from "sonner";

interface Review {
  id: string;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  comment: string;
  date: number;
  likes: number;
  likedByMe: boolean;
}

interface Props {
  reviews: Review[];
  onLikeReview: (reviewId: string) => void;
  onAddReview: (rating: number, comment: string) => Promise<void>;
}

export function EventReviews({ reviews, onLikeReview, onAddReview }: Props) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
      : 0;

  const handleSubmit = async () => {
    if (rating === 0 || !comment.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddReview(rating, comment.trim());
      setRating(0);
      setComment("");
      toast.success("Avis ajouté");
    } catch {
      toast.error("Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="space-y-4"><View className="flex items-center gap-4"><View><Text className="text-white font-bold text-2xl">{avgRating.toFixed(1)}</Text><View className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={14}
                className={
                  i < Math.round(avgRating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-white/20"
                }
              />
            ))}</View><Text className="text-white/30 text-xs">{reviews.length}avis</Text></View></View>{}<View className="rounded-2xl p-4 bg-white/5 border border-white/5"><Text className="text-white/60 text-xs mb-2">Votre avis</Text><View className="flex gap-1 mb-2">{Array.from({ length: 5 }).map((_, i) => (
            <Pressable key={i} onPress={() => setRating(i + 1)}><Star size={20} className={
                  i < (hoverRating || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-white/20"
                } /></Pressable>
          ))}</View><TextInput value={comment} onChangeText={(value) => setComment(value)} placeholder="Partagez votre expérience..." className="w-full bg-transparent text-white text-sm outline-none placeholder:text-white/30" multiline textAlignVertical="top" /><Pressable onPress={handleSubmit} disabled={isSubmitting || rating === 0 || !comment.trim()} className="mt-2 px-4 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-40" style={{  }}>{isSubmitting ? "..." : "Publier"}</Pressable></View>{}<View className="space-y-3 max-h-60 overflow-y-auto" style={{  }}>{reviews.map((review) => (
          <View key={review.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl p-3 bg-white/5 border border-white/5">
            <View className="flex items-center gap-2 mb-1">{review.authorAvatar ? (
                <Image className="w-6 h-6 rounded-full" source={{ uri: review.authorAvatar }} accessibilityLabel="" />
              ) : (
                <User size={16} className="text-white/30" />
              )}<Text className="text-white/80 text-sm font-medium">{review.authorName}</Text><View className="flex gap-0.5 ml-auto">{Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={10}
                    className={
                      i < review.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-white/20"
                    }
                  />
                ))}</View></View>
            <Text className="text-white/70 text-sm">{review.comment}</Text>
            <Pressable onPress={() => onLikeReview(review.id)} className="flex items-center gap-1 text-xs text-white/30 mt-1">
              <ThumbsUp
                size={12}
                className={
                  review.likedByMe ? "fill-blue-400 text-blue-400" : ""
                }
              />
              {review.likes > 0 && <Text>{review.likes}</Text>}
            </Pressable>
          </View>
        ))}</View></View>
  );
}
