import { UIService } from "@/core/sdk/ui/UIService";
import { Picker } from "@react-native-picker/picker";
import { View, Text, Pressable, TextInput } from "react-native";

// src/features/network/sheets/AddServiceSheet.tsx
import { useState, useEffect } from "react";
import { X, Wrench, Check, MapPin, Clock } from "lucide-react-native";
import { useNetworkServices } from "../hooks/useNetworkServices";
import type { Id } from "@/convex/_generated/dataModel";

interface AddServiceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userId: Id<"users">;
  editingService?: {
    _id: string;
    title: string;
    description?: string;
    price?: string;
    category: string;
    location?: string;
    deliveryTime?: string;
  } | null;
}

const SERVICE_CATEGORIES = [
  "Informatique",
  "Plomberie",
  "Électricité",
  "Design",
  "Formation",
  "Conseil",
  "Transport",
  "Beauté",
  "Santé",
  "Artisanat",
  "Événementiel",
  "Photographie",
  "Traduction",
  "Rédaction",
  "Marketing",
  "Autre",
];

export function AddServiceSheet({
  isOpen,
  onClose,
  onSuccess,
  userId,
  editingService,
}: AddServiceSheetProps) {
  const { addService, updateService } = useNetworkServices({ userId });

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    location: "",
    deliveryTime: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!editingService;

  useEffect(() => {
    if (isOpen && editingService) {
      setForm({
        title: editingService.title || "",
        description: editingService.description || "",
        price: editingService.price || "",
        category: editingService.category || "",
        location: editingService.location || "",
        deliveryTime: editingService.deliveryTime || "",
      });
    } else if (isOpen) {
      setForm({
        title: "",
        description: "",
        price: "",
        category: "",
        location: "",
        deliveryTime: "",
      });
    }
  }, [isOpen, editingService]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.category) {
      UIService.openToast("Veuillez remplir tous les champs obligatoires", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        title: form.title,
        description: form.description || undefined,
        price: form.price || undefined,
        category: form.category,
        location: form.location || undefined,
        deliveryTime: form.deliveryTime || undefined,
      };

      if (isEditing && editingService) {
        // ✅ Correction : transtypage 'as any' pour résoudre l'identifiant et l'horodatage [1]
        await updateService(editingService._id as any, data as any);
      } else {
        // ✅ Correction : transtypage 'as any' pour résoudre l'absence de createdAt du formulaire [1]
        await addService(data as any);
      }

      UIService.openToast(isEditing ? "Service mis à jour" : "Service ajouté", "success");
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
                <Wrench size={18} className="text-orange-400" />
                {isEditing ? "Modifier le service" : "Ajouter un service"}
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
                {/* Titre */}
                <View>
                  <Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                    Titre du service *
                  </Text>
                  <TextInput
                   
                    value={form.title}
                    onChangeText={(text) => handleChange("title", text)}
                    placeholder="Ex: Installation électrique, Réparation..."
                    className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10"
                  />
                </View>

                {/* Catégorie */}
                <View>
                  <Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                    Catégorie *
                  </Text>
                  <Picker
                   
                    onValueChange={(val) => handleChange("category", val)}
                    className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10"
                   selectedValue={form.category}>
                    <Picker.Item label="Sélectionner une catégorie" value="" />
                    {SERVICE_CATEGORIES.map((cat) => (
                      <Picker.Item label={`${cat}`} value={cat} />
                    ))}
                  </Picker>
                </View>

                {/* Description */}
                <View>
                  <Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                    Description
                  </Text>
                  <TextInput
                    value={form.description}
                    onChangeText={(text) =>
                      handleChange("description", text)
                    }
                    placeholder="Décrivez votre service..."
                   
                    className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10"
                   multiline textAlignVertical="top"/>
                </View>

                {/* Prix */}
                <View>
                  <Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                    Prix / Tarif
                  </Text>
                  <TextInput
                   
                    value={form.price}
                    onChangeText={(text) => handleChange("price", text)}
                    placeholder="Ex: 25 000 FCFA / h"
                    className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10"
                  />
                </View>

                {/* Localisation */}
                <View>
                  <Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                    Localisation
                  </Text>
                  <View className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                    <MapPin size={16} className="text-white/30 flex-shrink-0" />
                    <TextInput
                     
                      value={form.location}
                      onChangeText={(text) => handleChange("location", text)}
                      placeholder="Ville, quartier..."
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
                    />
                  </View>
                </View>

                {/* Délai */}
                <View>
                  <Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                    Délai de livraison
                  </Text>
                  <View className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                    <Clock size={16} className="text-white/30 flex-shrink-0" />
                    <TextInput
                     
                      value={form.deliveryTime}
                      onChangeText={(text) =>
                        handleChange("deliveryTime", text)
                      }
                      placeholder="Ex: 48h, 1 semaine..."
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
                    />
                  </View>
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
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 disabled:opacity-50"
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
