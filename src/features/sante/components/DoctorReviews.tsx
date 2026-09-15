import { View, Text, Pressable, TextInput } from "react-native";

// src/features/sante/components/DoctorReviews.tsx
import { useState } from "react";
import { Star, ThumbsUp, MessageCircle } from "lucide-react-native";

export interface Review {
  id: string;
  patientName: string;
  rating: number;
  comment: string;
  date: Date;
  likes: number;
  verified: boolean;
}

interface DoctorReviewsProps {
  reviews: Review[];
  averageRating: number;
  onAddReview?: (rating: number, comment: string) => void;
  onLikeReview?: (reviewId: string) => void;
}

export function DoctorReviews({
  reviews,
  averageRating,
  onAddReview,
  onLikeReview,
}: DoctorReviewsProps) {
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");

  const handleSubmit = () => {
    if (onAddReview && newComment.trim()) {
      onAddReview(newRating, newComment);
      setNewComment("");
      setNewRating(5);
      setShowForm(false);
    }
  };

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10"><View className="flex items-center justify-between mb-4"><View className="flex items-center gap-2"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">Avis ({reviews.length})
          </Text><View className="flex items-center gap-0.5 text-yellow-400 text-sm"><Star size={14} fill="currentColor" /><Text className="text-white font-medium">{averageRating.toFixed(1)}</Text></View></View>{onAddReview && (
          <Pressable onPress={() => setShowForm(!showForm)} className="text-xs text-red-400 font-medium transition-colors">{showForm ? "Annuler" : "Écrire un avis"}</Pressable>
        )}</View>{showForm && onAddReview && (
        <View className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10"><View className="flex items-center gap-1 mb-2">{[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setNewRating(star)} className="text-lg"><Star size={20} className={
                    star <= newRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-white/20"
                  } /></Pressable>
            ))}</View><TextInput value={newComment} onChangeText={(value) => setNewComment(value)} placeholder="Partagez votre expérience..." className="w-full p-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50" multiline textAlignVertical="top" /><Pressable onPress={handleSubmit} disabled={!newComment.trim()} className="mt-2 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-red-500 transition-colors disabled:opacity-50"><Text>Publier</Text></Pressable></View>
      )}<View className="space-y-3 max-h-60 overflow-y-auto" style={{  }}>{reviews.length === 0 ? (
          <Text className="text-xs text-white/30 text-center py-4">Aucun avis pour le moment
          </Text>
        ) : (
          reviews.map((review) => (
            <View key={review.id} className="p-3 rounded-xl bg-white/5 border border-white/10"><View className="flex items-start justify-between"><View><Text className="text-white text-sm font-medium">{review.patientName}{review.verified && (
                      <Text className="ml-1 text-[10px] text-blue-400">✓ vérifié
                      </Text>
                    )}</Text><View className="flex items-center gap-1 text-yellow-400 text-xs">{[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={
                          i < review.rating
                            ? "fill-yellow-400"
                            : "text-white/20"
                        }
                      />
                    ))}</View></View><Text className="text-[10px] text-white/30">{review.date.toLocaleDateString("fr-FR")}</Text></View><Text className="text-white/70 text-sm mt-1">{review.comment}</Text>{onLikeReview && (
                <Pressable onPress={() => onLikeReview(review.id)} className="mt-1 text-xs text-white/30 transition-colors flex items-center gap-1">
                  <ThumbsUp size={12} /> {review.likes}
                </Pressable>
              )}</View>
          ))
        )}</View></View>
  );
}
