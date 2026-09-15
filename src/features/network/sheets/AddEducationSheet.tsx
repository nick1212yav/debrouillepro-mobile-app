import { View, Text, Pressable, TextInput } from "react-native";

// src/features/network/sheets/AddEducationSheet.tsx
import { useState, useEffect } from "react";
import { X, Check } from "lucide-react-native";
import { toast } from "sonner";
import { useNetworkEducation } from "../hooks/useNetworkEducation";
import type { Id } from "@/convex/_generated/dataModel";

interface AddEducationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userId: Id<"users">;
  editingEducation?: {
    _id: string;
    school: string;
    degree: string;
    field: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
  } | null;
}

export function AddEducationSheet({
  isOpen,
  onClose,
  onSuccess,
  userId,
  editingEducation,
}: AddEducationSheetProps) {
  const { addEducation, updateEducation } = useNetworkEducation({ userId });

  const [form, setForm] = useState({
    school: "",
    degree: "",
    field: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!editingEducation;

  useEffect(() => {
    if (isOpen && editingEducation) {
      setForm({
        school: editingEducation.school || "",
        degree: editingEducation.degree || "",
        field: editingEducation.field || "",
        startDate: editingEducation.startDate || "",
        endDate: editingEducation.endDate || "",
        current: editingEducation.current || false,
        description: editingEducation.description || "",
      });
    } else if (isOpen) {
      setForm({
        school: "",
        degree: "",
        field: "",
        startDate: "",
        endDate: "",
        current: false,
        description: "",
      });
    }
  }, [isOpen, editingEducation]);

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.school || !form.degree || !form.startDate) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        school: form.school,
        degree: form.degree,
        field: form.field || undefined,
        startDate: form.startDate,
        endDate: form.current ? undefined : form.endDate || undefined,
        current: form.current,
        description: form.description || undefined,
      };

      if (isEditing && editingEducation) {
        // ✅ Correction : transtypage 'as any' pour résoudre l'identifiant et l'horodatage [1]
        await updateEducation(editingEducation._id as any, data as any);
      } else {
        // ✅ Correction : transtypage 'as any' pour résoudre l'absence de createdAt/updatedAt du formulaire [1]
        await addEducation(data as any);
      }

      toast.success(isEditing ? "Formation mise à jour" : "Formation ajoutée");
      onSuccess?.();
      onClose();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
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

            <View className="flex items-center justify-between px-5 py-3 border-b border-white/5"><Text className="text-white font-bold text-lg">{isEditing ? "Modifier la formation" : "Ajouter une formation"}</Text><Pressable onPress={onClose} className="w-9 h-9 rounded-2xl flex items-center justify-center transition" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}><X size={18} className="text-white/60" /></Pressable></View>

            <View className="px-5 py-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 40px - 140px)" }}><View className="space-y-4">{}<View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Établissement *
                  </Text><TextInput value={form.school} onChangeText={(value) => handleChange("school", value)} placeholder="Nom de l'école ou université" className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" /></View>{}<View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Diplôme *
                  </Text><TextInput value={form.degree} onChangeText={(value) => handleChange("degree", value)} placeholder="Ex: Master en Informatique" className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" /></View>{}<View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Domaine
                  </Text><TextInput value={form.field} onChangeText={(value) => handleChange("field", value)} placeholder="Ex: Informatique, Génie civil..." className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" /></View>{}<View className="gap-3"><View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Date de début *
                    </Text><TextInput value={form.startDate} onChangeText={(value) =>
                        handleChange("startDate", value)} className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" /></View><View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Date de fin
                    </Text><TextInput value={form.endDate} onChangeText={(value) => handleChange("endDate", value)} className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition disabled:opacity-40" editable={!(form.current)} /></View></View>{}<Text className="flex items-center gap-2"><Pressable onPress={(e) => handleChange("current", e.target.checked)} className="w-4 h-4 rounded accent-emerald-500" accessibilityRole="checkbox" accessibilityState={{ checked: form.current }} /><Text className="text-white/70 text-sm">Je suis actuellement en formation
                  </Text></Text>{}<View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Description
                  </Text><TextInput value={form.description} onChangeText={(value) =>
                      handleChange("description", value)} placeholder="Décrivez votre parcours..." className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" multiline textAlignVertical="top" /></View></View></View>

            <View className="px-5 py-4 border-t border-white/5 flex gap-3">
              <Pressable onPress={onClose} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/60 bg-white/5 transition">
                Annuler
              </Pressable>
              <Pressable onPress={handleSubmit} disabled={isSubmitting} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 transition disabled:opacity-50">
                {isSubmitting ? (
                  <View className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <Check size={16} />
                    {isEditing ? "Mettre à jour" : "Ajouter"}
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
