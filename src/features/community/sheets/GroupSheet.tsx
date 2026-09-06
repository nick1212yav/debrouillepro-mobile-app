import { UIService } from "@/core/sdk/ui/UIService";
import { Picker } from "@react-native-picker/picker";
import { View, Text, Pressable, TextInput } from "react-native";

// src/features/community/sheets/GroupSheet.tsx
import { useState } from "react";
import { X, Users, Send } from "lucide-react-native";
import { useCommunityGroups } from "../hooks/useCommunityGroups";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function GroupSheet({ isOpen, onClose, onSuccess }: Props) {
  const { createGroup } = useCommunityGroups();
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "general",
    isPrivate: false,
    city: "",
    tags: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      UIService.openToast("Veuillez remplir tous les champs obligatoires", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await createGroup({
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        isPrivate: form.isPrivate,
        city: form.city?.trim() || undefined,
        tags: form.tags.filter(Boolean),
      });
      UIService.openToast("Groupe créé !", "success");
      onClose();
      onSuccess?.();
    } catch (error) {
      UIService.openToast("Erreur lors de la création du groupe", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Pressable
        className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        onPress={(e) => e.target === e.currentTarget && onClose()}
      >
        <View
          className="w-full max-w-lg rounded-t-3xl overflow-hidden"
          style={{ backgroundColor: "rgba(15,15,30,0.98)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid", maxHeight: "90vh" }}
        >
          <View className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <Text className="text-white font-bold text-lg">Nouveau groupe</Text>
            <Pressable
              onPress={onClose}
              className="p-1 rounded-full"
            >
              <X size={20} className="text-white/50" />
            </Pressable>
          </View>

          <View
            className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-3"
            style={{  }}
          >
            <TextInput
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
              placeholder="Nom du groupe *"
              className="w-full bg-transparent text-white placeholder:text-white/25 font-bold text-base outline-none"
            />

            <TextInput
              value={form.description}
              onChangeText={(text) =>
                setForm({ ...form, description: text })
              }
              placeholder="Description *"
             
              className="w-full bg-transparent text-white/80 placeholder:text-white/25 text-sm outline-none leading-relaxed"
             multiline textAlignVertical="top"/>

            <Picker
             
              onValueChange={(val) => setForm({ ...form, category: val })}
              className="w-full bg-white/5 text-white text-sm rounded-xl px-3 py-2 outline-none border border-white/10"
             selectedValue={form.category}>
              <Picker.Item label="Général" value="general" />
              <Picker.Item label="Professionnel" value="professional" />
              <Picker.Item label="Social" value="social" />
              <Picker.Item label="Événements" value="events" />
              <Picker.Item label="Sport" value="sport" />
              <Picker.Item label="Culture" value="culture" />
            </Picker>

            <View className="flex items-center gap-2">
              <Pressable
               
                checked={form.isPrivate}
                onPress={(e) =>
                  setForm({ ...form, isPrivate: e.target.checked })
                }
                className=""
               accessibilityRole="checkbox" accessibilityState={{ checked: form.isPrivate }}/>
              <Text className="text-white/80 text-sm">
                <Text>Groupe privé (sur invitation)</Text></Text>
            </View>

            <TextInput
              value={form.city}
              onChangeText={(text) => setForm({ ...form, city: text })}
              placeholder="Ville (optionnel)"
              className="w-full bg-white/5 text-white placeholder:text-white/25 text-sm rounded-xl px-3 py-2 outline-none border border-white/10"
            />

            <TextInput
              value={form.tags.join(" ")}
              onChangeText={(text) =>
                setForm({
                  ...form,
                  tags: text.split(" ").filter(Boolean),
                })
              }
              placeholder="Tags séparés par des espaces"
              className="w-full bg-white/5 text-white placeholder:text-white/25 text-sm rounded-xl px-3 py-2 outline-none border border-white/10"
            />
          </View>

          <View className="px-5 pb-5">
            <Pressable
              onPress={handleSubmit}
              disabled={
                isSubmitting || !form.name.trim() || !form.description.trim()
              }
              className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{  }}
            >
              <Users size={15} className="text-white" />
              <Text className="text-white">
                {isSubmitting ? "Création..." : "Créer le groupe"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </>
  );
}
