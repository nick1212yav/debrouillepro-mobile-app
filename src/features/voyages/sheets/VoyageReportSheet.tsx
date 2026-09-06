import { UIService } from "@/core/sdk/ui/UIService";
import { Picker } from "@react-native-picker/picker";
import { View, Text, Pressable, TextInput } from "react-native";

// src/features/voyages/sheets/VoyageReportSheet.tsx
import { X, AlertTriangle, Send, Loader2, Check } from "lucide-react-native";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

interface VoyageReportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: Id<"trips">;
  tripTitle: string;
}

const REPORT_REASONS = [
  { value: "operator", label: "Problème avec l'opérateur" },
  { value: "vehicle", label: "Véhicule non conforme" },
  { value: "route", label: "Itinéraire incorrect" },
  { value: "price", label: "Prix différent annoncé" },
  { value: "safety", label: "Problème de sécurité" },
  { value: "other", label: "Autre" },
];

export function VoyageReportSheet({
  isOpen,
  onClose,
  tripId,
  tripTitle,
}: VoyageReportSheetProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      UIService.openToast("Veuillez sélectionner un motif", "error");
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      UIService.openToast("Veuillez décrire le problème (minimum 10 caractères)", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      // Simuler un appel API (à remplacer par une mutation Convex)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSuccess(true);
      UIService.openToast("Signalement envoyé", "success");
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setReason("");
        setDescription("");
      }, 2000);
    } catch {
      UIService.openToast("Erreur lors de l'envoi", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Pressable
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/70"
        onPress={onClose}
      >
        <Pressable
          className="w-full max-w-md rounded-t-[32px] overflow-hidden flex flex-col"
          style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", maxHeight: "calc(90vh - 40px)" }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <View className="w-10 h-1 rounded-full bg-white/20" />
          </View>

          <View className="flex items-center justify-between px-5 py-3 border-b border-white/5 flex-shrink-0">
            <Text className="text-white font-bold text-lg flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-400" />
              Signaler un problème
            </Text>
            <Pressable
              onPress={onClose}
              className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            >
              <X size={18} className="text-white/60" />
            </Pressable>
          </View>

          <View
            className="flex-1 overflow-y-auto px-5 py-4"
            style={{  }}
          >
            {isSuccess ? (
              <View className="flex flex-col items-center justify-center py-8 text-center">
                <View className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                  <Check size={32} className="text-emerald-400" />
                </View>
                <Text className="text-white font-bold text-lg">
                  Signalement envoyé
                </Text>
                <Text className="text-white/40 text-sm mt-1">
                  <Text>Merci de nous aider à améliorer DébrouillePro. Nous traiterons votre signalement rapidement.</Text></Text>
              </View>
            ) : (
              <>
                <Text className="text-white/50 text-sm mb-4">
                  <Text>Vous signalez un problème concernant :</Text>{" "}
                  <Text className="text-white font-medium">{tripTitle}</Text>
                </Text>

                {/* Motif */}
                <View className="mb-4">
                  <Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                    Motif *
                  </Text>
                  <Picker
                   
                    onValueChange={(val) => setReason(val)}
                    className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10"
                   selectedValue={reason}>
                    <Picker.Item label="Sélectionnez un motif" value="" />
                    {REPORT_REASONS.map((r) => (
                      <Picker.Item label={`${r.label}`} value={r.value} />
                    ))}
                  </Picker>
                </View>

                {/* Description */}
                <View className="mb-4">
                  <Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                    Description *
                  </Text>
                  <TextInput
                    value={description}
                    onChangeText={(text) => setDescription(text)}
                    placeholder="Décrivez le problème en détail..."
                   
                    className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10"
                   multiline textAlignVertical="top"/>
                  <Text className="text-white/30 text-[10px] mt-1 text-right">
                    {description.trim().length}<Text>/500</Text></Text>
                </View>

                <Text className="text-white/20 text-xs">
                  <Text>Votre signalement est anonyme et sera traité par notre équipe.</Text></Text>
              </>
            )}
          </View>

          {/* Footer */}
          {!isSuccess && (
            <View className="flex-shrink-0 border-t border-white/10 px-5 py-4 bg-[#0e0e22]">
              <Pressable
                onPress={handleSubmit}
                disabled={
                  isSubmitting ||
                  !reason ||
                  !description.trim() ||
                  description.trim().length < 10
                }
                className={cn(
                  "w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all",
                  isSubmitting ||
                    !reason ||
                    !description.trim() ||
                    description.trim().length < 10
                    ? "bg-white/10 text-white/30 cursor-not-allowed"
                    : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/20",
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Envoyer le signalement
                  </>
                )}
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </>
  );
}
