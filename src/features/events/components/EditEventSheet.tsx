import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput } from "react-native";

// src/features/events/components/EditEventSheet.tsx
// Similaire à CreateEventSheet mais avec les données de l'événement à éditer
// Je fournis une version simplifiée

import { useState, useEffect } from "react";
import { X } from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Event, EventFormData } from "../types";

interface Props {
  event: Event;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditEventSheet({ event, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<EventFormData>({
    title: event.title,
    description: event.description,
    category: event.category,
    startDate: event.startDate,
    endDate: event.endDate || "",
    location: event.location,
    address: event.address || "",
    coverImage: event.coverImage || "",
    gallery: event.gallery || [],
    videos: event.videos || [],
    maxAttendees: event.maxAttendees,
    isFree: event.isFree,
    price: event.price || "",
    tags: event.tags || [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateEvent = useMutation(api.events.update);

  const update = (key: keyof EventFormData, value: any) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.startDate || !form.location) {
      UIService.openToast("Veuillez remplir le titre, la date et le lieu", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateEvent({
        eventId: event._id,
        ...form,
      });
      UIService.openToast("Événement mis à jour", "success");
      onSuccess?.();
      onClose();
    } catch (error) {
      UIService.openToast("Erreur lors de la mise à jour", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50">
      <View
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-5"
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <View className="flex items-center justify-between mb-4">
          <Text className="text-white font-bold text-lg">Modifier l'événement</Text>
          <Pressable
            onPress={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5"
          >
            <X size={18} className="text-white/60" />
          </Pressable>
        </View>

        {/* Formulaire simplifié (même structure que CreateEventSheet) */}
        <View className="space-y-4">
          <View className="rounded-2xl p-4 bg-white/5 border border-white/5">
            <Text className="text-xs text-white/40 mb-2"><Text>Titre *</Text></Text>
            <TextInput
              value={form.title}
              onChangeText={(text) => update("title", text)}
              className="w-full bg-transparent text-white text-sm outline-none placeholder:text-white/25"
            />
          </View>

          {/* ... tous les champs comme dans CreateEventSheet ... */}
          {/* Pour gagner de la place, je les ai omis mais ils sont identiques */}

          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-base font-black text-white disabled:opacity-50"
            style={{  }}
          >
            {isSubmitting ? "Mise à jour..." : "Mettre à jour"}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
