import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput } from "react-native";

// src/features/community/sheets/SponsorSheet.tsx
import { useState } from "react";
import { X, Star, Send } from "lucide-react-native";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  postId: Id<"publications">;
  onSponsor?: (amount: number) => Promise<void>;
  onSuccess?: () => void;
}

const SPONSOR_AMOUNTS = [
  { label: "1 000 FCFA", value: 1000 },
  { label: "2 500 FCFA", value: 2500 },
  { label: "5 000 FCFA", value: 5000 },
  { label: "10 000 FCFA", value: 10000 },
  { label: "25 000 FCFA", value: 25000 },
  { label: "50 000 FCFA", value: 50000 },
];

export function SponsorSheet({
  isOpen,
  onClose,
  postId,
  onSponsor,
  onSuccess,
}: Props) {
  const [amount, setAmount] = useState(5000);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const finalAmount = customAmount ? parseInt(customAmount) : amount;
    if (!finalAmount || finalAmount < 100) {
      UIService.openToast("Montant minimum : 100 FCFA", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      if (onSponsor) {
        await onSponsor(finalAmount);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      UIService.openToast(`Sponsoring de ${finalAmount} FCFA effectué !`, "success");
      onClose();
      onSuccess?.();
    } catch (error) {
      UIService.openToast("Erreur lors du sponsoring", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Pressable
        className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        onPress={(e) => e.target === e.currentTarget && onClose()}
      >
        <View
          className="w-full max-w-lg rounded-t-3xl overflow-hidden"
          style={{ backgroundColor: "rgba(15,15,30,0.98)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid", maxHeight: "90vh" }}
        >
          <View className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <Text className="text-white font-bold text-lg">Sponsoriser</Text>
            <Pressable
              onPress={onClose}
              className="p-1 rounded-full"
            >
              <X size={20} className="text-white/50" />
            </Pressable>
          </View>

          <View
            className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-4"
            style={{  }}
          >
            <View className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
              <Star size={24} className="text-yellow-400" />
              <View>
                <Text className="text-white font-semibold">Soutenez ce contenu</Text>
                <Text className="text-white/40 text-xs">
                  Votre contribution aide le créateur
                </Text>
              </View>
            </View>

            <View>
              <Text className="text-white/60 text-sm font-medium mb-2">Montant</Text>
              <View className="gap-2">
                {SPONSOR_AMOUNTS.map((a) => (
                  <Pressable
                    key={a.value}
                    onPress={() => {
                      setAmount(a.value);
                      setCustomAmount("");
                    }}
                    className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                      amount === a.value && !customAmount
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        : "bg-white/5 text-white/50 hover:bg-white/10"
                    }`}
                  >
                    {a.label}
                  </Pressable>
                ))}
              </View>
              <View className="mt-2">
                <TextInput
                 
                  value={customAmount}
                  onChangeText={(text) => {
                    setCustomAmount(text);
                    setAmount(0);
                  }}
                  placeholder="Montant personnalisé"
                  className="w-full bg-white/5 text-white placeholder:text-white/25 text-sm rounded-xl px-3 py-2 outline-none border border-white/10"
                 keyboardType="numeric"/>
              </View>
            </View>

            <TextInput
              value={message}
              onChangeText={(text) => setMessage(text)}
              placeholder="Message d'encouragement (optionnel)"
             
              className="w-full bg-white/5 text-white placeholder:text-white/25 text-sm rounded-xl px-3 py-2 outline-none border border-white/10"
             multiline textAlignVertical="top"/>
          </View>

          <View className="px-5 pb-5">
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{  }}
            >
              <Send size={15} className="text-white" />
              <Text className="text-white">
                {isSubmitting ? "En cours..." : "Sponsoriser"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </>
  );
}
