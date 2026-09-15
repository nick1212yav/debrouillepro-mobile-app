import { View, Text, TextInput, Pressable } from "react-native";
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
  const { book } = useServiceBooking(providerId);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await book(message, date || undefined);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onPress={onClose}><View className="w-full max-w-md rounded-t-3xl p-6 bg-[#0D1117] border border-white/10" onPress={(e) => e.stopPropagation()}><Text className="text-white font-bold text-lg mb-4">Réserver</Text><TextInput value={message} onChangeText={(value) => setMessage(value)} placeholder="Décrivez votre besoin..." className="w-full rounded-xl p-3 text-sm text-white bg-white/5 border border-white/10" multiline textAlignVertical="top" /><TextInput value={date} onChangeText={(value) => setDate(value)} className="w-full rounded-xl p-3 text-sm text-white bg-white/5 border border-white/10 mt-3" /><Pressable onPress={handleSubmit} disabled={loading} className="w-full py-3.5 rounded-xl text-white font-bold mt-4 bg-gradient-to-r from-orange-500 to-red-500 disabled:opacity-50">{loading ? "Envoi..." : "Confirmer"}</Pressable></View></View>
  );
}
