import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
} from "react-native";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  providerId: Id<"serviceProviders">;
}

export function QuoteSheet({ isOpen, onClose, providerId }: Props) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const requestQuote = useMutation(api.services.quotes.requestQuote);

  const handleSubmit = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || loading) {
      if (!trimmedMessage) {
        Alert.alert("Message requis", "Décris le travail à réaliser.");
      }
      return;
    }

    setLoading(true);
    try {
      await requestQuote({ providerId, message: trimmedMessage });
      setMessage("");
      onClose();
    } catch {
      Alert.alert("Erreur", "Impossible d'envoyer la demande de devis.");
    } finally {
      setLoading(false);
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
          accessibilityLabel="Fermer la demande de devis"
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            className="w-full rounded-t-3xl border-t border-white/10 bg-[#0D1117] p-6"
          >
            <Text className="mb-4 text-lg font-bold text-white">
              Demander un devis
            </Text>

            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Décris ton projet..."
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
                loading
                  ? "bg-orange-500/50"
                  : "bg-orange-500 active:bg-orange-600"
              }`}
            >
              <Text className="font-bold text-white">
                {loading ? "Envoi en cours..." : "Envoyer la demande"}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
