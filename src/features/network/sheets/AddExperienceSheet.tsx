import { View, Text, Pressable, TextInput } from "react-native";

// src/features/network/sheets/AddExperienceSheet.tsx
import { useState, useEffect } from "react";
import { X, Plus, Check } from "lucide-react-native";
import { toast } from "sonner";
import { useNetworkExperience } from "../hooks/useNetworkExperience";
import type { Id } from "@/convex/_generated/dataModel";

interface AddExperienceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userId: Id<"users">;
  editingExperience?: {
    _id: string;
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
    achievements?: string[];
  } | null;
}

export function AddExperienceSheet({
  isOpen,
  onClose,
  onSuccess,
  userId,
  editingExperience,
}: AddExperienceSheetProps) {
  const { addExperience, updateExperience } = useNetworkExperience({ userId });

  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
    achievements: [] as string[],
  });

  const [newAchievement, setNewAchievement] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!editingExperience;

  useEffect(() => {
    if (isOpen && editingExperience) {
      setForm({
        title: editingExperience.title || "",
        company: editingExperience.company || "",
        location: editingExperience.location || "",
        startDate: editingExperience.startDate || "",
        endDate: editingExperience.endDate || "",
        current: editingExperience.current || false,
        description: editingExperience.description || "",
        achievements: editingExperience.achievements || [],
      });
    } else if (isOpen) {
      setForm({
        title: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        description: "",
        achievements: [],
      });
    }
  }, [isOpen, editingExperience]);

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddAchievement = () => {
    const trimmed = newAchievement.trim();
    if (trimmed) {
      setForm((prev) => ({
        ...prev,
        achievements: [...prev.achievements, trimmed],
      }));
      setNewAchievement("");
    }
  };

  const handleRemoveAchievement = (index: number) => {
    setForm((prev) => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.company || !form.startDate) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        title: form.title,
        company: form.company,
        location: form.location || undefined,
        startDate: form.startDate,
        endDate: form.current ? undefined : form.endDate || undefined,
        current: form.current,
        description: form.description || undefined,
        achievements:
          form.achievements.length > 0 ? form.achievements : undefined,
      };

      if (isEditing && editingExperience) {
        // ✅ Correction : transtypage 'as any' pour résoudre l'erreur d'identification et d'horodatage [1]
        await updateExperience(editingExperience._id as any, data as any);
      } else {
        // ✅ Correction : transtypage 'as any' pour résoudre l'absence de createdAt/updatedAt du formulaire [1]
        await addExperience(data as any);
      }

      toast.success(
        isEditing ? "Expérience mise à jour" : "Expérience ajoutée",
      );
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

            <View className="flex items-center justify-between px-5 py-3 border-b border-white/5"><Text className="text-white font-bold text-lg">{isEditing ? "Modifier l'expérience" : "Ajouter une expérience"}</Text><Pressable onPress={onClose} className="w-9 h-9 rounded-2xl flex items-center justify-center transition" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}><X size={18} className="text-white/60" /></Pressable></View>

            <View className="px-5 py-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 40px - 140px)" }}><View className="space-y-4">{}<View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Titre du poste *
                  </Text><TextInput value={form.title} onChangeText={(value) => handleChange("title", value)} placeholder="Ex: Développeur Full Stack" className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" /></View>{}<View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Entreprise *
                  </Text><TextInput value={form.company} onChangeText={(value) => handleChange("company", value)} placeholder="Nom de l'entreprise" className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" /></View>{}<View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Lieu
                  </Text><TextInput value={form.location} onChangeText={(value) => handleChange("location", value)} placeholder="Ex: Kinshasa, RDC" className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" /></View>{}<View className="gap-3"><View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Date de début *
                    </Text><TextInput value={form.startDate} onChangeText={(value) =>
                        handleChange("startDate", value)} className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" /></View><View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Date de fin
                    </Text><TextInput value={form.endDate} onChangeText={(value) => handleChange("endDate", value)} className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition disabled:opacity-40" editable={!(form.current)} /></View></View>{}<Text className="flex items-center gap-2"><Pressable onPress={(e) => handleChange("current", e.target.checked)} className="w-4 h-4 rounded accent-indigo-500" accessibilityRole="checkbox" accessibilityState={{ checked: form.current }} /><Text className="text-white/70 text-sm">Je travaille actuellement ici
                  </Text></Text>{}<View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Description
                  </Text><TextInput value={form.description} onChangeText={(value) =>
                      handleChange("description", value)} placeholder="Décrivez vos missions et responsabilités..." className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" multiline textAlignVertical="top" /></View>{}<View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Réalisations
                  </Text><View className="flex flex-wrap gap-1.5 mb-2">{form.achievements.map((achievement, index) => (
                      <Text key={index} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/20">{achievement}<Pressable onPress={() => handleRemoveAchievement(index)} className="transition"><X size={12} /></Pressable></Text>
                    ))}</View><View className="flex gap-2"><TextInput value={newAchievement} onChangeText={(value) => setNewAchievement(value)} onKeyPress={(e) =>
                        e.nativeEvent.key === "Enter" && handleAddAchievement()} placeholder="Ajouter une réalisation..." className="flex-1 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" /><Pressable onPress={handleAddAchievement} className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-white bg-indigo-500/20 border border-indigo-500/30 transition"><Plus size={16} /></Pressable></View></View></View></View>

            <View className="px-5 py-4 border-t border-white/5 flex gap-3">
              <Pressable onPress={onClose} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/60 bg-white/5 transition">
                Annuler
              </Pressable>
              <Pressable onPress={handleSubmit} disabled={isSubmitting} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 transition disabled:opacity-50">
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
