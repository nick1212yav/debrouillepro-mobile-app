import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput } from "react-native";

// src/features/network/sheets/AddCertificationSheet.tsx
import { useState, useEffect } from "react";
import { X, Award, Check } from "lucide-react-native";
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
      UIService.openToast("Veuillez remplir tous les champs obligatoires", "error");
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

      UIService.openToast(isEditing ? "Certification mise à jour" : "Certification ajoutée", "success");
      onSuccess?.();
      onClose();
    } catch {
      UIService.openToast("Erreur lors de l'enregistrement", "error");
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
                <Award size={18} className="text-amber-400" />
                {isEditing
                  ? "Modifier la certification"
                  : "Ajouter une certification"}
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
              className="px-5 py-4 overflow-y-auto"
              style={{ maxHeight: "calc(100vh - 40px - 140px)" }}
            >
              <View className="space-y-4">
                {/* Nom */}
                <View>
                  <Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                    Nom de la certification *
                  </Text>
                  <TextInput
                   
                    value={form.name}
                    onChangeText={(text) => handleChange("name", text)}
                    placeholder="Ex: AWS Certified Solutions Architect"
                    className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10"
                  />
                </View>

                {/* Émetteur */}
                <View>
                  <Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                    Émetteur *
                  </Text>
                  <TextInput
                   
                    value={form.issuer}
                    onChangeText={(text) => handleChange("issuer", text)}
                    placeholder="Ex: Amazon Web Services"
                    className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10"
                  />
                </View>

                {/* Dates */}
                <View className="gap-3">
                  <View>
                    <Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                      Date d'obtention *
                    </Text>
                    <TextInput
                     
                      value={form.issueDate}
                      onChangeText={(text) =>
                        handleChange("issueDate", text)
                      }
                      className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10"
                    />
                  </View>
                  <View>
                    <Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                      Date d'expiration
                    </Text>
                    <TextInput
                     
                      value={form.expiryDate}
                      onChangeText={(text) =>
                        handleChange("expiryDate", text)
                      }
                      className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10"
                    />
                  </View>
                </View>

                {/* ID et URL */}
                <View>
                  <Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                    ID du certificat
                  </Text>
                  <TextInput
                   
                    value={form.credentialId}
                    onChangeText={(text) =>
                      handleChange("credentialId", text)
                    }
                    placeholder="Ex: AWS-12345-ABCDE"
                    className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10"
                  />
                </View>

                <View>
                  <Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                    URL du certificat
                  </Text>
                  <TextInput
                   
                    value={form.credentialUrl}
                    onChangeText={(text) =>
                      handleChange("credentialUrl", text)
                    }
                    placeholder="https://..."
                    className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10"
                   keyboardType="url" autoCapitalize="none" autoCorrect={false}/>
                </View>
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
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 disabled:opacity-50"
              >
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
    </>
  );
}
