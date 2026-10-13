import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useState } from "react";
import { useServiceBooking } from "../hooks/useServiceBooking";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  providerId: Id<"serviceProviders">;
  onSuccess?: () => void;
}

export function ServiceBooking({
  isOpen,
  onClose,
  providerId,
  onSuccess,
}: Props) {
  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  const { book } = useServiceBooking(providerId);

  const handleSubmit = async () => {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      await book(message, date.trim() || undefined);

      setMessage("");
      setDate("");
      onSuccess?.();
      onClose();
    } catch {
      Alert.alert(
        "Réservation impossible",
        "Ta demande n'a pas pu être envoyée. Vérifie ta connexion et réessaie.",
      );
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
          accessibilityLabel="Fermer la réservation"
          className="flex-1 bg-black/70 justify-end"
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            className="w-full rounded-t-3xl p-6 bg-[#0D1117] border-t border-white/10"
          >
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-white font-bold text-lg">
                Réserver un service
              </Text>

              <Pressable
                onPress={onClose}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Annuler la réservation"
                className="px-3 py-2 rounded-lg bg-white/5"
              >
                <Text className="text-white/60 text-sm">Fermer</Text>
              </Pressable>
            </View>

            <Text className="text-white/70 text-sm mb-2">
              Décris ton besoin
            </Text>

            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Décris le service dont tu as besoin..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              className="w-full rounded-xl p-3 text-sm text-white bg-white/5 border border-white/10"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
              accessibilityLabel="Message de réservation"
            />

            <Text className="text-white/70 text-sm mt-4 mb-2">
              Date souhaitée (facultatif)
            </Text>

            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="AAAA-MM-JJ, ex. 2026-10-20"
              placeholderTextColor="rgba(255,255,255,0.35)"
              className="w-full rounded-xl p-3 text-sm text-white bg-white/5 border border-white/10"
              editable={!loading}
              autoCapitalize="none"
              accessibilityLabel="Date souhaitée"
            />

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Confirmer la réservation"
              className={`w-full py-3.5 rounded-xl mt-5 items-center ${
                loading
                  ? "bg-orange-500/50"
                  : "bg-orange-500 active:bg-orange-600"
              }`}
            >
              <Text className="text-white font-bold">
                {loading ? "Envoi en cours..." : "Confirmer la réservation"}
              </Text>
            </Pressable>

            <Text className="text-white/40 text-xs text-center mt-3">
              La demande sera transmise au prestataire.
            </Text>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
