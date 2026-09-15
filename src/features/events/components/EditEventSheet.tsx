import { View, Text, Pressable, TextInput } from "react-native";

// src/features/events/components/EditEventSheet.tsx
// Similaire à CreateEventSheet mais avec les données de l'événement à éditer
// Je fournis une version simplifiée

import { useState, useEffect } from "react";
import { X } from "lucide-react-native";
import { toast } from "sonner";
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
      toast.error("Veuillez remplir le titre, la date et le lieu");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateEvent({
        eventId: event._id,
        ...form,
      });
      toast.success("Événement mis à jour");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm"><View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-5" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex items-center justify-between mb-4"><Text className="text-white font-bold text-lg">Modifier l'événement</Text><Pressable onPress={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5"><X size={18} className="text-white/60" /></Pressable></View>{}<View className="space-y-4"><View className="rounded-2xl p-4 bg-white/5 border border-white/5"><Text className="text-xs text-white/40 mb-2">Titre *</Text><TextInput value={form.title} onChangeText={(value) => update("title", value)} className="w-full bg-transparent text-white text-sm outline-none placeholder:text-white/25" /></View>{}{}<Pressable onPress={handleSubmit} disabled={isSubmitting} className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-base font-black text-white disabled:opacity-50" style={{ boxShadow: "0 8px 32px rgba(245,158,11,0.35)" }}>{isSubmitting ? "Mise à jour..." : "Mettre à jour"}</Pressable></View></View></View>
  );
}
