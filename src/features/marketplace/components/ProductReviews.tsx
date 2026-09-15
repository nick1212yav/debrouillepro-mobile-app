import { View, Text, TextInput, NativeSyntheticEvent, Pressable } from "react-native";

// src/features/marketplace/components/ProductReviews.tsx
import { useState } from "react";
import { Star, User, ThumbsUp } from "lucide-react-native";
import { formatDate } from "../utils/formatter";
import type { Review } from "../types";

interface Props {
  reviews: Review[];
  averageRating?: number;
  onAddReview?: (rating: number, comment: string) => Promise<void>;
  onLikeReview?: (reviewId: string) => Promise<void>; // ✅ attend une chaîne
}

export function ProductReviews({
  reviews,
  averageRating,
  onAddReview,
  onLikeReview,
}: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: NativeSyntheticEvent<any>) => {
    e.preventDefault();
    if (!onAddReview || rating === 0) return;
    setIsSubmitting(true);
    try {
      await onAddReview(rating, comment);
      setRating(0);
      setComment("");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Rendu ────────────────────────────────────────────────────────────────
  return (
    <View className="space-y-4">{}{averageRating !== undefined && (
        <View className="flex items-center gap-2"><Text className="text-white font-bold text-lg">{averageRating.toFixed(1)}</Text><View className="flex text-yellow-400">{[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={16}
                fill={i <= Math.round(averageRating) ? "currentColor" : "none"}
              />
            ))}</View><Text className="text-white/40 text-sm">({reviews.length}avis)</Text></View>
      )}{}{reviews.length === 0 ? (
        <Text className="text-white/40 text-sm">Aucun avis pour le moment.</Text>
      ) : (
        reviews.map((review) => (
          <View key={review._id} className="bg-white/5 p-3 rounded-xl space-y-1"><View className="flex items-center justify-between"><View className="flex items-center gap-2"><View className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center"><User size={12} className="text-white/60" /></View><Text className="text-white font-medium">{review.reviewerName || "Anonyme"}</Text><View className="flex text-yellow-400">{[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={14}
                      fill={i <= review.rating ? "currentColor" : "none"}
                    />
                  ))}</View></View>{onLikeReview && (
                <Pressable onPress={() => onLikeReview(review._id)} className="text-white/40 transition-colors">
                  <ThumbsUp size={14} />
                </Pressable>
              )}</View>{review.comment && (
              <Text className="text-white/70 text-sm">{review.comment}</Text>
            )}<Text className="text-white/30 text-xs">{formatDate(review.createdAt)}</Text></View>
        ))
      )}{}{onAddReview && (
        <View className="space-y-3"><View className="flex gap-1">{[1, 2, 3, 4, 5].map((i) => (
              <Pressable key={i} onPress={() => setRating(i)} className="transition-colors">
                <Star
                  size={24}
                  className={
                    i <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-white/30"
                  }
                />
              </Pressable>
            ))}</View><TextInput value={comment} onChangeText={(value) => setComment(value)} placeholder="Partagez votre expérience…" className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-orange-400" multiline textAlignVertical="top" /><Pressable disabled={isSubmitting || rating === 0} className="px-4 py-2 bg-orange-500 text-white rounded-lg disabled:opacity-50 transition-colors">{isSubmitting ? "Envoi…" : "Publier l'avis"}</Pressable></View>
      )}</View>
  );
}
