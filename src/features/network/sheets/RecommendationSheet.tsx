import { View, Text, Pressable, TextInput } from "react-native";

// src/features/network/sheets/RecommendationSheet.tsx
import { useState } from "react";
import { X, Star, ThumbsUp, Send } from "lucide-react-native";
import { toast } from "sonner";
import { useNetworkRecommendations } from "../hooks/useNetworkRecommendations";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils"; // ✅ Correction : Import de la fonction cn [1]

interface RecommendationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  toUserId: Id<"users">;
}

export function RecommendationSheet({
  isOpen,
  onClose,
  onSuccess,
  toUserId,
}: RecommendationSheetProps) {
  // L'authentification et le destinataire sont liés à l'instanciation de notre hook
  const { addRecommendation } = useNetworkRecommendations({ userId: toUserId });

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Veuillez choisir une note");
      return;
    }
    if (!comment.trim()) {
      toast.error("Veuillez rédiger un commentaire");
      return;
    }

    setIsSubmitting(true);
    try {
      // ✅ Correction : Retrait de 'toUserId' car le hook se charge d'injecter 'receiverId' [1]
      await addRecommendation({
        rating,
        comment: comment.trim(),
      });
      toast.success("Recommandation envoyée");
      setRating(0);
      setComment("");
      onSuccess?.();
      onClose();
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
<View>
      {isOpen && (
        <>
          <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPress={onClose} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
          <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px] overflow-hidden" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", maxHeight: "calc(100vh - 40px)" }}>
            <View className="flex justify-center pt-3 pb-1"><View className="w-10 h-1 rounded-full bg-white/20" /></View>

            <View className="flex items-center justify-between px-5 py-3 border-b border-white/5"><Text className="text-white font-bold text-lg flex items-center gap-2"><ThumbsUp size={18} className="text-yellow-400" />Recommander
              </Text><Pressable onPress={onClose} className="w-9 h-9 rounded-2xl flex items-center justify-center transition" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}><X size={18} className="text-white/60" /></Pressable></View>

            <View className="px-5 py-6"><View className="space-y-6">{}<View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-3">Note *
                  </Text><View className="flex items-center gap-2">{[1, 2, 3, 4, 5].map((star) => (
                      <Pressable key={star} onPress={() => setRating(star)} className="p-1 transition-transform"><Star size={32} className={cn(
                            "transition-colors",
                            star <= rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-white/20 hover:text-white/40",
                          )} /></Pressable>
                    ))}<Text className="ml-2 text-white/40 text-sm">{rating > 0 ? `${rating}/5` : ""}</Text></View></View>{}<View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Commentaire *
                  </Text><TextInput value={comment} onChangeText={(value) => setComment(value)} placeholder="Partagez votre expérience avec cette personne..." className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" multiline textAlignVertical="top" /></View><Text className="text-white/25 text-xs">Votre recommandation sera visible publiquement sur le profil
                  de cette personne.
                </Text></View></View>

            <View className="px-5 py-4 border-t border-white/5 flex gap-3">
              <Pressable onPress={onClose} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/60 bg-white/5 transition">
                Annuler
              </Pressable>
              <Pressable onPress={handleSubmit} disabled={isSubmitting || rating === 0 || !comment.trim()} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 transition disabled:opacity-50">
                {isSubmitting ? (
                  <View className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <Send size={16} />
                    Envoyer
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </>
      )}
    </View>
  );
}
