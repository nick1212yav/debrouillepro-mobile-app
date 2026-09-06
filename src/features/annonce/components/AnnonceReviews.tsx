import { UIService } from "@/core/sdk/ui/UIService";

function NativeConfirmAlert(message: string): boolean {
  Alert.alert(message, "Confirmation", [
    { text: "Annuler", style: "cancel" },
    { text: "Confirmer", onPress: () => undefined },
  ]);
  return false;
}
import { View, Text, Pressable, TextInput, Alert } from "react-native";
import { Star, User, Send } from "lucide-react-native";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  date: string;
}

interface Props {
  publicationId: Id<"publications">;
  canReview?: boolean;
}

export function AnnonceReviews({ publicationId, canReview = true }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Connexion au backend
  const reviewsData = useQuery(api.annonceReviews.listReviews, {
    publicationId,
  });
  const createReview = useMutation(api.annonceReviews.createReview);
  const deleteReview = useMutation(api.annonceReviews.deleteReview);

  // Calcul de la moyenne et du total
  const reviews = reviewsData || [];
  const totalCount = reviews.length;
  const avgRating =
    totalCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount
      : 0;

  const handleSubmitReview = async () => {
    if (rating === 0 || !comment.trim()) {
      UIService.openToast("Veuillez donner une note et un commentaire", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      await createReview({
        publicationId,
        rating,
        comment: comment.trim(),
      });
      UIService.openToast("Avis envoyé !", "success");
      setRating(0);
      setComment("");
    } catch (error) {
      UIService.openToast(error instanceof Error ? error.message : "Erreur lors de l'envoi", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!NativeConfirmAlert("Supprimer cet avis ?")) return;
    try {
      await deleteReview({ reviewId: reviewId as any });
      UIService.openToast("Avis supprimé", "success");
    } catch {
      UIService.openToast("Erreur lors de la suppression", "error");
    }
  };

  return (
    <View className="space-y-3">
      {/* En-tête avec moyenne */}
      <View className="flex items-center gap-3">
        <Text className="text-sm font-medium text-white/50">Avis</Text>
        {totalCount > 0 && (
          <View className="flex items-center gap-1">
            <Star size={14} className="fill-yellow-400 text-yellow-400" />
            <Text className="text-white font-bold text-sm">
              {avgRating.toFixed(1)}
            </Text>
            <Text className="text-white/30 text-xs">({totalCount})</Text>
          </View>
        )}
      </View>

      {/* Liste des avis */}
      <View className="space-y-3 max-h-48 overflow-y-auto pr-1">
        {reviews.length === 0 ? (
          <View className="text-white/30 text-sm text-center py-4">
            <Text>Aucun avis pour le moment</Text></View>
        ) : (
          reviews.map((review) => (
            <View
              key={review._id}
              className="p-3 rounded-xl bg-white/5 border border-white/5"
            >
              <View className="flex items-center gap-2">
                <User size={14} className="text-white/30" />
                <Text className="text-white/80 text-sm font-medium">
                  {review.reviewerName}
                </Text>
                <Text className="text-white/20 text-xs">·</Text>
                <View className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={10}
                      className={
                        i < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-white/20"
                      }
                    />
                  ))}
                </View>
                <Pressable
                  onPress={() => handleDeleteReview(review._id)}
                  className="ml-auto text-white/20 text-xs"
                >
                  <Text>✕</Text></Pressable>
              </View>
              <Text className="text-white/60 text-sm mt-1">{review.comment}</Text>
              <Text className="text-white/20 text-[10px] mt-1">
                {new Date(review._creationTime).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Ajouter un avis */}
      {canReview && (
        <View className="space-y-2 pt-2 border-t border-white/5">
          <View className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => setRating(star)}
                className="text-2xl"
              >
                <Star
                  size={24}
                  className={
                    star <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-white/20"
                  }
                />
              </Pressable>
            ))}
          </View>
          <View className="flex gap-2">
            <TextInput
              value={comment}
              onChangeText={(text) => setComment(text)}
              placeholder="Votre avis..."
              className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none placeholder:text-white/30"
             
             editable={!(isSubmitting)}/>
            <Pressable
              onPress={handleSubmitReview}
              disabled={isSubmitting || rating === 0 || !comment.trim()}
              className="px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium text-white disabled:opacity-50"
              style={{  }}
            >
              <Send size={14} /> <Text>Envoyer</Text></Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
