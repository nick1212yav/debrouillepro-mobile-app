import { View, Text, Pressable, TextInput } from "react-native";

// src/features/network/sheets/AddCertificationSheet.tsx
import { useState, useEffect } from "react";
import { X, Award, Check } from "lucide-react-native";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface AddCertificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userId: Id<"users">;
  editingCertification?: {
    _id: string;
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
    credentialId?: string;
    credentialUrl?: string;
  } | null;
}

export function AddCertificationSheet({
  isOpen,
  onClose,
  onSuccess,
  userId,
  editingCertification,
}: AddCertificationSheetProps) {
  const [form, setForm] = useState({
    name: "",
    issuer: "",
    issueDate: "",
    expiryDate: "",
    credentialId: "",
    credentialUrl: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!editingCertification;

  const addCertification = useMutation(api.network.addCertification);
  const updateCertification = useMutation(api.network.updateCertification);

  useEffect(() => {
    if (isOpen && editingCertification) {
      setForm({
        name: editingCertification.name || "",
        issuer: editingCertification.issuer || "",
        issueDate: editingCertification.issueDate || "",
        expiryDate: editingCertification.expiryDate || "",
        credentialId: editingCertification.credentialId || "",
        credentialUrl: editingCertification.credentialUrl || "",
      });
    } else if (isOpen) {
      setForm({
        name: "",
        issuer: "",
        issueDate: "",
        expiryDate: "",
        credentialId: "",
        credentialUrl: "",
      });
    }
  }, [isOpen, editingCertification]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.issuer || !form.issueDate) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        name: form.name,
        issuer: form.issuer,
        issueDate: form.issueDate,
        expiryDate: form.expiryDate || undefined,
        credentialId: form.credentialId || undefined,
        credentialUrl: form.credentialUrl || undefined,
      };

      if (isEditing && editingCertification) {
        // ✅ Correction : Transtypage 'as any' pour l'identifiant et l'horodatage de mise à jour [1]
        await updateCertification({
          id: editingCertification._id as any,
          ...data,
        });
      } else {
        // ✅ Correction : Retrait de 'userId' car la mutation est résolue côté serveur Convex [1]
        await addCertification(data);
      }

      toast.success(
        isEditing ? "Certification mise à jour" : "Certification ajoutée",
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

            <View className="flex items-center justify-between px-5 py-3 border-b border-white/5"><Text className="text-white font-bold text-lg flex items-center gap-2"><Award size={18} className="text-amber-400" />{isEditing
                  ? "Modifier la certification"
                  : "Ajouter une certification"}</Text><Pressable onPress={onClose} className="w-9 h-9 rounded-2xl flex items-center justify-center transition" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}><X size={18} className="text-white/60" /></Pressable></View>

            <View className="px-5 py-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 40px - 140px)" }}><View className="space-y-4">{}<View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Nom de la certification *
                  </Text><TextInput value={form.name} onChangeText={(value) => handleChange("name", value)} placeholder="Ex: AWS Certified Solutions Architect" className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" /></View>{}<View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Émetteur *
                  </Text><TextInput value={form.issuer} onChangeText={(value) => handleChange("issuer", value)} placeholder="Ex: Amazon Web Services" className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" /></View>{}<View className="gap-3"><View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Date d'obtention *
                    </Text><TextInput value={form.issueDate} onChangeText={(value) =>
                        handleChange("issueDate", value)} className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" /></View><View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Date d'expiration
                    </Text><TextInput value={form.expiryDate} onChangeText={(value) =>
                        handleChange("expiryDate", value)} className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" /></View></View>{}<View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">ID du certificat
                  </Text><TextInput value={form.credentialId} onChangeText={(value) =>
                      handleChange("credentialId", value)} placeholder="Ex: AWS-12345-ABCDE" className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" /></View><View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">URL du certificat
                  </Text><TextInput value={form.credentialUrl} onChangeText={(value) =>
                      handleChange("credentialUrl", value)} placeholder="https://..." className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" keyboardType="url" /></View></View></View>

            <View className="px-5 py-4 border-t border-white/5 flex gap-3">
              <Pressable onPress={onClose} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/60 bg-white/5 transition">
                Annuler
              </Pressable>
              <Pressable onPress={handleSubmit} disabled={isSubmitting} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 transition disabled:opacity-50">
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
