import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, TextInput, Pressable } from "react-native";
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
  const requestQuote = useMutation(api.serviceProviders.requestQuote);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!message.trim()) {
      UIService.openToast("Veuillez décrire votre demande", "error");
      return;
    }
    setLoading(true);
    try {
      await requestQuote({ providerId, message: message.trim() });
      UIService.openToast("Demande de devis envoyée !", "success");
      onClose();
    } catch {
      UIService.openToast("Erreur", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70"
      onPress={onClose}
    >
      <Pressable
        className="w-full max-w-md rounded-t-3xl p-6 bg-[#0D1117] border border-white/10"
        onPress={(e) => e.stopPropagation()}
      >
        <Text className="text-white font-bold text-lg mb-4">Demander un devis</Text>
        <TextInput
          value={message}
          onChangeText={(text) => setMessage(text)}
          placeholder="Décrivez votre projet..."
         
          className="w-full rounded-xl p-3 text-sm text-white bg-white/5 border border-white/10"
         multiline textAlignVertical="top"/>
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-white font-bold mt-4 bg-gradient-to-r from-orange-500 to-red-500 disabled:opacity-50"
        >
          {loading ? "Envoi..." : "Envoyer"}
        </Pressable>
      </Pressable>
    </Pressable>
  );
}
