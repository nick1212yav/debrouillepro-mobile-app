import { View, Text, Pressable, TextInput } from "react-native";

// src/features/marketplace/components/ProductReport.tsx
import { useState } from "react";
import { X, Flag } from "lucide-react-native";
import { toast } from "sonner";

interface Props {
  productId: string;
  onClose: () => void;
}

const REPORT_REASONS = [
  "Produit contrefait",
  "Arnaque / Fausse annonce",
  "Prix abusif",
  "Contenu inapproprié",
  "Vendeur non fiable",
  "Autre",
];

export function ProductReport({ productId, onClose }: Props) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Veuillez sélectionner un motif");
      return;
    }
    setSubmitting(true);
    try {
      // Simuler l'envoi du signalement
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Signalement envoyé. Merci !");
      onClose();
    } catch {
      toast.error("Erreur lors du signalement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"><View initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-3xl p-5" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex items-center justify-between mb-4"><Text className="text-white font-bold text-lg flex items-center gap-2"><Flag size={18} className="text-red-400" />Signaler
          </Text><Pressable onPress={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5"><X size={18} className="text-white/60" /></Pressable></View><View className="space-y-3"><View><Text className="text-xs text-white/60 mb-2">Motif du signalement *</Text><View className="space-y-1.5">{REPORT_REASONS.map((r) => (
                <Pressable key={r} onPress={() => setReason(r)} className="w-full text-left px-3 py-2 rounded-xl text-sm transition-colors" style={{ backgroundColor: reason === r
                                        ? "rgba(239,68,68,0.15)"
                                        : "rgba(255,255,255,0.05)", borderColor: "rgba(239,68,68,0.3)", borderStyle: "solid" }}>{r}</Pressable>
              ))}</View></View><View><Text className="text-xs text-white/60 mb-2">Détails (optionnel)</Text><TextInput value={details} onChangeText={(value) => setDetails(value)} placeholder="Précisez votre signalement..." className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none placeholder-white/25" multiline textAlignVertical="top" /></View><Pressable onPress={handleSubmit} disabled={submitting || !reason} className="w-full py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40" style={{  }}>{submitting ? "Envoi..." : "Signaler"}</Pressable></View></View></View>
  );
}
