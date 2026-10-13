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
import { useServiceReviews } from "../hooks/useServiceReviews";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  providerId: Id<"serviceProviders">;
}

export function ReviewSheet({ isOpen, onClose, providerId }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const { addReview, loading } = useServiceReviews(providerId);

  const handleSubmit = async () => {
    const trimmedComment = comment.trim();

    if (!rating || !trimmedComment) {
      Alert.alert(
        "Informations requises",
        "Choisis une note et ajoute un commentaire.",
      );
      return;
    }

    try {
      await addReview(rating, trimmedComment);
      setRating(0);
      setComment("");
      onClose();
    } catch {
      Alert.alert("Erreur", "Impossible d'envoyer ton avis.");
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
              editable={!loading}
            />

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              accessibilityRole="button"
              className={`mt-4 w-full items-center rounded-xl py-3.5 ${
                loading ? "bg-orange-500/50" : "bg-orange-500"
              }`}
            >
              <Text className="font-bold text-white">
                {loading ? "Envoi en cours..." : "Envoyer mon avis"}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
