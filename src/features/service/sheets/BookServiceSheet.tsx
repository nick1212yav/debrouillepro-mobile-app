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
import { useServiceBooking } from "../hooks/useServiceBooking";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  providerId: Id<"serviceProviders">;
}

export function BookServiceSheet({ isOpen, onClose, providerId }: Props) {
  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const { book } = useServiceBooking(providerId);

  const handleSubmit = async () => {
    if (loading) return;

    setLoading(true);
    try {
      await book(message.trim(), date.trim() || undefined);
      setMessage("");
      setDate("");
      onClose();
    } catch {
      Alert.alert(
        "Réservation impossible",
        "Ta demande n'a pas pu être envoyée. Réessaie.",
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
          className="flex-1 justify-end bg-black/70"
          accessibilityLabel="Fermer la réservation"
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            className="w-full rounded-t-3xl border-t border-white/10 bg-[#0D1117] p-6"
          >
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-white">
                Réserver un service
              </Text>
              <Pressable
                onPress={onClose}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
                className="rounded-lg bg-white/5 px-3 py-2"
              >
                <Text className="text-sm text-white/60">Fermer</Text>
              </Pressable>
            </View>

            <Text className="mb-2 text-sm text-white/70">
              Décris ton besoin
            </Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Décris le service dont tu as besoin..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
            />

            <Text className="mb-2 mt-4 text-sm text-white/70">
              Date souhaitée (facultatif)
            </Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="AAAA-MM-JJ, ex. 2026-10-20"
              placeholderTextColor="rgba(255,255,255,0.3)"
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white"
              autoCapitalize="none"
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
                {loading ? "Envoi en cours..." : "Confirmer"}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
