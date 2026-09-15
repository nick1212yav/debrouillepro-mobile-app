import { View, Text, Pressable, TextInput } from "react-native";

// src/features/community/sheets/ReportSheet.tsx
import { useState } from "react";
import { X, Flag, Send } from "lucide-react-native";
import { toast } from "sonner";
import { useCommunityModeration } from "../hooks/useCommunityModeration";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  postId?: Id<"publications">;
  commentId?: Id<"comments">;
  onSuccess?: () => void;
}

const REASONS = [
  "Spam",
  "Contenu inapproprié",
  "Harcèlement",
  "Fausse information",
  "Discours haineux",
  "Violence",
  "Arnaque",
  "Autre",
];

export function ReportSheet({
  isOpen,
  onClose,
  postId,
  commentId,
  onSuccess,
}: Props) {
  const { reportContent } = useCommunityModeration();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Veuillez sélectionner une raison");
      return;
    }
    if (!postId && !commentId) {
      toast.error("Aucun contenu à signaler");
      return;
    }

    setIsSubmitting(true);
    try {
      await reportContent({
        postId,
        commentId,
        reason,
        details: details.trim() || undefined,
      });
      toast.success("Signalement envoyé, merci !");
      onClose();
      onSuccess?.();
    } catch (error) {
      toast.error("Erreur lors du signalement");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
<View>
      <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onPress={(e) => e.target === e.currentTarget && onClose()}>
        <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="w-full max-w-lg rounded-t-3xl overflow-hidden" style={{ backgroundColor: "rgba(15,15,30,0.98)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid", maxHeight: "90vh" }}>
          <View className="flex items-center justify-between px-5 py-4 border-b border-white/10"><Text className="text-white font-bold text-lg">Signaler</Text><Pressable onPress={onClose} className="p-1 rounded-full"><X size={20} className="text-white/50" /></Pressable></View>

          <View className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-4" style={{  }}><Text className="text-white/60 text-sm">Pourquoi signalez-vous ce contenu ?
            </Text><View className="space-y-2">{REASONS.map((r) => (
                <Pressable key={r} onPress={() => setReason(r)} className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors ${
                    reason === r
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  }`}>
                  {r}
                </Pressable>
              ))}</View><TextInput value={details} onChangeText={(value) => setDetails(value)} placeholder="Détails supplémentaires (optionnel)" className="w-full bg-white/5 text-white placeholder:text-white/25 text-sm rounded-xl px-3 py-2 outline-none border border-white/10" multiline textAlignVertical="top" /></View>

          <View className="px-5 pb-5">
            <Pressable onPress={handleSubmit} disabled={isSubmitting || !reason} className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-40" style={{  }}>
              <Flag size={15} className="text-white" />
              <Text className="text-white">
                {isSubmitting ? "Envoi..." : "Signaler"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
