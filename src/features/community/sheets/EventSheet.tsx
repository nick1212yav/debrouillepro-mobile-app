import { UIService } from "@/core/sdk/ui/UIService";
import { Picker } from "@react-native-picker/picker";
import { View, Text, Pressable, TextInput } from "react-native";

// src/features/community/sheets/EventSheet.tsx
import { useState } from "react";
import { X, Calendar, MapPin, Send } from "lucide-react-native";
import { useCommunityEvents } from "../hooks/useCommunityEvents";

// Type des catégories autorisées par le backend
type EventCategory =
  | "culturel"
  | "sportif"
  | "religieux"
  | "professionnel"
  | "communautaire"
  | "formation"
  | "festival"
  | "autre";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EventSheet({ isOpen, onClose, onSuccess }: Props) {
  const { createEvent } = useCommunityEvents();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "communautaire" as EventCategory,
    startDate: "",
    endDate: "",
    location: "",
    address: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    coverImage: "",
    maxAttendees: undefined as number | undefined,
    isFree: true,
    price: "",
    tags: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.startDate ||
      !form.location.trim()
    ) {
      UIService.openToast("Veuillez remplir tous les champs obligatoires", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await createEvent({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        location: form.location.trim(),
        address: form.address?.trim() || undefined,
        latitude: form.latitude,
        longitude: form.longitude,
        coverImage: form.coverImage || undefined,
        maxAttendees: form.maxAttendees,
        isFree: form.isFree,
        price: form.isFree ? undefined : form.price || undefined,
        tags: form.tags.filter(Boolean),
      });
      UIService.openToast("Événement créé !", "success");
      onClose();
      onSuccess?.();
    } catch (error) {
      UIService.openToast("Erreur lors de la création de l'événement", "error");
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
            <Text className="text-white font-bold text-lg">Nouvel événement</Text>
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
              value={form.title}
              onChangeText={(text) => setForm({ ...form, title: text })}
              placeholder="Titre de l'événement *"
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
             
              onValueChange={(val) =>
                setForm({ ...form, category: val as EventCategory })}
              className="w-full bg-white/5 text-white text-sm rounded-xl px-3 py-2 outline-none border border-white/10"
             selectedValue={form.category}>
              <Picker.Item label="Culturel" value="culturel" />
              <Picker.Item label="Sportif" value="sportif" />
              <Picker.Item label="Religieux" value="religieux" />
              <Picker.Item label="Professionnel" value="professionnel" />
              <Picker.Item label="Communautaire" value="communautaire" />
              <Picker.Item label="Formation" value="formation" />
              <Picker.Item label="Festival" value="festival" />
              <Picker.Item label="Autre" value="autre" />
            </Picker>

            <View className="flex gap-2">
              <TextInput
               
                value={form.startDate}
                onChangeText={(text) =>
                  setForm({ ...form, startDate: text })
                }
                className="flex-1 bg-white/5 text-white text-sm rounded-xl px-3 py-2 outline-none border border-white/10"
              />
              <TextInput
               
                value={form.endDate}
                onChangeText={(text) => setForm({ ...form, endDate: text })}
                className="flex-1 bg-white/5 text-white text-sm rounded-xl px-3 py-2 outline-none border border-white/10"
              />
            </View>

            <TextInput
              value={form.location}
              onChangeText={(text) => setForm({ ...form, location: text })}
              placeholder="Lieu *"
              className="w-full bg-white/5 text-white placeholder:text-white/25 text-sm rounded-xl px-3 py-2 outline-none border border-white/10"
            />

            <TextInput
              value={form.address}
              onChangeText={(text) => setForm({ ...form, address: text })}
              placeholder="Adresse (optionnel)"
              className="w-full bg-white/5 text-white placeholder:text-white/25 text-sm rounded-xl px-3 py-2 outline-none border border-white/10"
            />

            <View className="flex items-center gap-2">
              <Pressable
               
                checked={form.isFree}
                onPress={(e) => setForm({ ...form, isFree: e.target.checked })}
                className=""
               accessibilityRole="checkbox" accessibilityState={{ checked: form.isFree }}/>
              <Text className="text-white/80 text-sm"><Text>Événement gratuit</Text></Text>
            </View>

            {!form.isFree && (
              <TextInput
                value={form.price}
                onChangeText={(text) => setForm({ ...form, price: text })}
                placeholder="Prix (ex: 5000 FCFA)"
                className="w-full bg-white/5 text-white placeholder:text-white/25 text-sm rounded-xl px-3 py-2 outline-none border border-white/10"
              />
            )}

            <TextInput
             
              value={form.maxAttendees || ""}
              onChangeText={(text) =>
                setForm({
                  ...form,
                  maxAttendees: parseInt(text) || undefined,
                })
              }
              placeholder="Nombre max de participants (optionnel)"
              className="w-full bg-white/5 text-white placeholder:text-white/25 text-sm rounded-xl px-3 py-2 outline-none border border-white/10"
             keyboardType="numeric"/>

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
                isSubmitting ||
                !form.title.trim() ||
                !form.description.trim() ||
                !form.startDate ||
                !form.location.trim()
              }
              className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{  }}
            >
              <Send size={15} className="text-white" />
              <Text className="text-white">
                {isSubmitting ? "Création..." : "Créer l'événement"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </>
  );
}
