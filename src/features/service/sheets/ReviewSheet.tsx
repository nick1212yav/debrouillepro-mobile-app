import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useState } from "react";
import { Star } from "lucide-react-native";
import { useServiceReviewCreate } from "../hooks/useServiceReviews";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Réservation terminée à laquelle rattacher l'avis.
   * V1 : obligatoire — un avis doit être lié à une prestation "done".
   */
  bookingId?: Id<"serviceBookings">;
}

export function ReviewSheet({ isOpen, onClose, bookingId }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { addReview } = useServiceReviewCreate();

  const handleSubmit = async () => {
    if (!bookingId) {
      Alert.alert(
        "Réservation requise",
        "Un avis ne peut être laissé qu'après une prestation terminée.",
      );
      return;
    }

    const trimmedComment = comment.trim();
    if (!rating || !trimmedComment) {
      Alert.alert(
        "Informations requises",
        "Choisis une note et ajoute un commentaire.",
      );
      return;
    }

    setSubmitting(true);
    try {
      await addReview(bookingId, rating, trimmedComment);
      setRating(0);
      setComment("");
      onClose();
    } catch {
      // toast déjà affiché par le hook
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <Pressable
          onPress={onClose}
          className="flex-1 justify-end bg-black/70"
          accessibilityLabel="Fermer le formulaire d'avis"
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            className="w-full rounded-t-3xl border-t border-white/10 bg-[#0D1117] p-6"
          >
            <View className="mb-5 h-1 w-10 self-center rounded-full bg-white/20" />

            <Text className="mb-4 text-lg font-bold text-white">
              Laisser un avis
            </Text>

            {!bookingId && (
              <View className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                <Text className="text-xs text-amber-300">
                  Cet avis ne sera pas envoyé : aucune réservation terminée
                  n'est associée. Ouvre une réservation terminée pour laisser un
                  avis.
                </Text>
              </View>
            )}

            <Text className="mb-3 text-sm text-white/60">Ta note</Text>

            <View className="mb-4 flex-row gap-3">
              {[1, 2, 3, 4, 5].map((value) => {
                const selected = value <= rating;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setRating(value)}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`${value} étoile${value > 1 ? "s" : ""}`}
                    accessibilityState={{ selected: rating === value }}
                  >
                    <Star
                      size={28}
                      color={selected ? "#FCD34D" : "rgba(255,255,255,0.2)"}
                      fill={selected ? "#FCD34D" : "transparent"}
                    />
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Partage ton expérience..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!submitting}
            />

            <Pressable
              onPress={handleSubmit}
              disabled={submitting || !bookingId}
              accessibilityRole="button"
              className={`mt-4 w-full items-center rounded-xl py-3.5 ${
                submitting || !bookingId
                  ? "bg-orange-500/50"
                  : "bg-orange-500 active:bg-orange-600"
              }`}
            >
              <Text className="font-bold text-white">
                {submitting ? "Envoi en cours..." : "Envoyer mon avis"}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
