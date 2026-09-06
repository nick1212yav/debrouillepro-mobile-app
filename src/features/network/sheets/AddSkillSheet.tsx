import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput } from "react-native";

// src/features/network/sheets/AddSkillSheet.tsx
import { useState } from "react";
import { X, Wrench, Plus, Check } from "lucide-react-native";
import { useNetworkSkills } from "../hooks/useNetworkSkills";
import type { Id } from "@/convex/_generated/dataModel";

interface AddSkillSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userId: Id<"users">;
}

export function AddSkillSheet({
  isOpen,
  onClose,
  onSuccess,
  userId,
}: AddSkillSheetProps) {
  const { addSkill } = useNetworkSkills({ userId });
  const [skillName, setSkillName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = skillName.trim();
    if (!trimmed) {
      UIService.openToast("Veuillez saisir une compétence", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await addSkill(trimmed);
      UIService.openToast("Compétence ajoutée", "success");
      setSkillName("");
      onSuccess?.();
      onClose();
    } catch {
      UIService.openToast("Erreur lors de l'ajout", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isOpen && (
        <>
          <Pressable
            onPress={onClose}
            className="fixed inset-0 z-50 bg-black/70"
          />
          <View
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px] overflow-hidden"
            style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", maxHeight: "calc(100vh - 40px)" }}
          >
            <View className="flex justify-center pt-3 pb-1">
              <View className="w-10 h-1 rounded-full bg-white/20" />
            </View>

            <View className="flex items-center justify-between px-5 py-3 border-b border-white/5">
              <Text className="text-white font-bold text-lg flex items-center gap-2">
                <Wrench size={18} className="text-purple-400" />
                Ajouter une compétence
              </Text>
              <Pressable
                onPress={onClose}
                className="w-9 h-9 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              >
                <X size={18} className="text-white/60" />
              </Pressable>
            </View>

            <View className="px-5 py-6">
              <View className="space-y-4">
                <View>
                  <Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                    Nom de la compétence
                  </Text>
                  <TextInput
                   
                    value={skillName}
                    onChangeText={(text) => setSkillName(text)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="Ex: React, Plomberie, Marketing..."
                    className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10"
                    autoFocus
                  />
                </View>

                <Text className="text-white/25 text-xs">
                  <Text>Appuyez sur Entrée pour ajouter rapidement</Text></Text>
              </View>
            </View>

            <View className="px-5 py-4 border-t border-white/5 flex gap-3">
              <Pressable
                onPress={onClose}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/60 bg-white/5"
              >
                Annuler
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting || !skillName.trim()}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <View className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <Plus size={16} />
                    Ajouter
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </>
      )}
    </>
  );
}
