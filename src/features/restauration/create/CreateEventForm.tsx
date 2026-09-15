import { View, Text, TextInput, NativeSyntheticEvent, Pressable } from "react-native";
import { useState } from "react";
import {
  Calendar,
  ShieldCheck,
  AlertCircle,
  DollarSign,
  Image,
  Users,
} from "lucide-react-native";

interface CreateEventFormProps {
  onSubmit: (data: any) => Promise<boolean>;
  isSubmitting: boolean;
}

export function CreateEventForm({
  onSubmit,
  isSubmitting,
}: CreateEventFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // États du formulaire
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("20:00");
  const [ticketCost, setTicketCost] = useState<number>(0);
  const [maxSeating, setMaxSeating] = useState<number>(100);
  const [coverImage, setCoverImage] = useState("");

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim())
      newErrors.title = "Le titre de l'événement est obligatoire.";
    if (!description.trim())
      newErrors.description = "Veuillez fournir un descriptif de l'événement.";
    if (!eventDate)
      newErrors.eventDate = "La date de tenue de l'événement est obligatoire.";
    if (ticketCost < 0)
      newErrors.ticketCost = "Le coût d'entrée ne peut pas être négatif.";
    if (maxSeating <= 0)
      newErrors.maxSeating =
        "La capacité d'accueil maximale doit être supérieure à 0.";
    if (!coverImage.trim())
      newErrors.coverImage =
        "L'image de présentation de l'affiche est obligatoire.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e: NativeSyntheticEvent<any>) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      date: `${eventDate} - ${eventTime}`,
      ticketCost,
      maxSeating,
      image: coverImage.trim(),
      active: true,
    };

    const success = await onSubmit(payload);
    if (success) {
      setTitle("");
      setDescription("");
      setEventDate("");
      setCoverImage("");
      setTicketCost(0);
      setMaxSeating(100);
    }
  };

  return (
    <View className="max-w-md mx-auto p-6 rounded-3xl bg-slate-900/50 border border-slate-800 text-left space-y-5"><View className="flex items-center gap-3 border-b border-slate-800 pb-3"><Calendar className="text-orange-500 w-5 h-5" /><View><Text className="text-base font-black text-white">Organiser un Événement Live
          </Text><Text className="text-[10px] text-slate-400">Rassemblez votre communauté autour de concerts et buffets
          </Text></View></View><View className="space-y-1.5"><Text className="block text-[10px] text-slate-400 uppercase font-bold">Titre de l'événement
        </Text><TextInput placeholder="Ex: Soirée Rumba & Grillades de Mouton" value={title} onChangeText={(value) => setTitle(value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-500/50" required editable={!(isSubmitting)} />{errors.title && (
          <Text className="text-[10px] text-rose-500 flex items-center gap-1"><AlertCircle size={10} />{errors.title}</Text>
        )}</View><View className="space-y-1.5"><Text className="block text-[10px] text-slate-400 uppercase font-bold">Descriptif de l'événement
        </Text><TextInput placeholder="Décrivez le programme, les artistes invités, et la formule de buffet incluse..." value={description} onChangeText={(value) => setDescription(value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-500/50" required multiline textAlignVertical="top" editable={!(isSubmitting)} />{errors.description && (
          <Text className="text-[10px] text-rose-500 flex items-center gap-1"><AlertCircle size={10} />{errors.description}</Text>
        )}</View><View className="gap-3"><View className="space-y-1.5"><Text className="block text-[10px] text-slate-400 uppercase font-bold">Date de l'événement
          </Text><TextInput value={eventDate} onChangeText={(value) => setEventDate(value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-500/50" required editable={!(isSubmitting)} />{errors.eventDate && (
            <Text className="text-[10px] text-rose-500 flex items-center gap-1"><AlertCircle size={10} />{errors.eventDate}</Text>
          )}</View><View className="space-y-1.5"><Text className="block text-[10px] text-slate-400 uppercase font-bold">Heure d'arrivée
          </Text><TextInput value={eventTime} onChangeText={(value) => setEventTime(value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-500/50" required editable={!(isSubmitting)} /></View></View><View className="gap-3"><View className="space-y-1.5"><Text className="block text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1"><DollarSign size={11} />Coût d'entrée (FCFA)
          </Text><TextInput value={ticketCost} onChangeText={(value) => setTicketCost(Number(value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-500/50" required keyboardType="numeric" editable={!(isSubmitting)} />{errors.ticketCost && (
            <Text className="text-[10px] text-rose-500 flex items-center gap-1"><AlertCircle size={10} />{errors.ticketCost}</Text>
          )}</View><View className="space-y-1.5"><Text className="block text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1"><Users size={11} />Capacité d'accueil
          </Text><TextInput value={maxSeating} onChangeText={(value) => setMaxSeating(Number(value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-500/50" required keyboardType="numeric" editable={!(isSubmitting)} />{errors.maxSeating && (
            <Text className="text-[10px] text-rose-500 flex items-center gap-1">
              <AlertCircle size={10} />
              {errors.maxSeating}
            </Text>
          )}</View></View><View className="space-y-1.5"><Text className="block text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1"><Image size={11} />URL de l'affiche de l'événement
        </Text><TextInput placeholder="https://images.unsplash.com/photo-..." value={coverImage} onChangeText={(value) => setCoverImage(value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-500/50" required keyboardType="url" editable={!(isSubmitting)} />{errors.coverImage && (
          <Text className="text-[10px] text-rose-500 flex items-center gap-1">
            <AlertCircle size={10} />
            {errors.coverImage}
          </Text>
        )}</View><Pressable disabled={
          isSubmitting || !title.trim() || !eventDate || !coverImage.trim()
        } className="w-full py-4 rounded-xl bg-orange-500 disabled:bg-slate-800 disabled:text-white/20 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-500/10"><ShieldCheck size={14} />{isSubmitting ? "Création de l'événement..." : "Publier l'Événement"}</Pressable></View>
  );
}
