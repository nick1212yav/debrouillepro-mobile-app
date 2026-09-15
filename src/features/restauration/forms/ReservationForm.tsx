import { Picker } from "@react-native-picker/picker";
import { View, Text, TextInput, NativeSyntheticEvent, Pressable } from "react-native";
import { useState } from "react";
import {
  Calendar,
  Users,
  Clock,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
} from "lucide-react-native";
import { ReservationValidator } from "../validators/reservation.validator";

interface ReservationFormProps {
  onSubmit: (data: {
    date: string;
    time: string;
    guests: number;
    section: string;
    request?: string;
  }) => void;
  isSubmitting: boolean;
}

export function ReservationForm({
  onSubmit,
  isSubmitting,
}: ReservationFormProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("20:00");
  const [guests, setGuests] = useState<number>(2);
  const [section, setSection] = useState("standard");
  const [request, setRequest] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFormSubmit = (e: NativeSyntheticEvent<any>) => {
    e.preventDefault();
    const payload = { date, time, guests, section, request: request.trim() };

    const validation = ReservationValidator.validate({
      date,
      time,
      guests, // Correction TS2353 de concordance de nom de propriété
      section,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    onSubmit(payload);
  };

  return (
    <View className="space-y-4 text-left"><View className="space-y-1.5"><Text className="block text-[10px] text-white/40 uppercase font-black tracking-wider">Date souhaitée
        </Text><View className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10"><Calendar size={15} className="text-white/40 shrink-0" /><TextInput value={date} onChangeText={(value) => {
              setDate(value);
              if (errors.date) setErrors((prev) => ({ ...prev, date: "" }));
            }} className="flex-1 bg-transparent text-xs text-white outline-none" required editable={!(isSubmitting)} /></View>{errors.date && (
          <Text className="text-[10px] text-rose-500 flex items-center gap-1 font-semibold"><AlertCircle size={10} />{errors.date}</Text>
        )}</View><View className="gap-3"><View className="space-y-1.5"><Text className="block text-[10px] text-white/40 uppercase font-black tracking-wider">Heure d'arrivée
          </Text><View className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10"><Clock size={15} className="text-white/40 shrink-0" /><TextInput value={time} onChangeText={(value) => {
                setTime(value);
                if (errors.time) setErrors((prev) => ({ ...prev, time: "" }));
              }} className="flex-1 bg-transparent text-xs text-white outline-none" required editable={!(isSubmitting)} /></View>{errors.time && (
            <Text className="text-[10px] text-rose-500 flex items-center gap-1 font-semibold"><AlertCircle size={10} />{errors.time}</Text>
          )}</View><View className="space-y-1.5"><Text className="block text-[10px] text-white/40 uppercase font-black tracking-wider">Nombre de couverts
          </Text><View className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10"><Users size={15} className="text-white/40 shrink-0" /><TextInput value={guests} onChangeText={(value) => {
                setGuests(Number(value));
                if (errors.guests)
                  setErrors((prev) => ({ ...prev, guests: "" }));
              }} className="flex-1 bg-transparent text-xs text-white outline-none" required keyboardType="numeric" editable={!(isSubmitting)} /></View>{errors.guests && (
            <Text className="text-[10px] text-rose-500 flex items-center gap-1 font-semibold">
              <AlertCircle size={10} />
              {errors.guests}
            </Text>
          )}</View></View><View className="space-y-1.5"><Text className="block text-[10px] text-white/40 uppercase font-black tracking-wider">Choix de la zone de salle
        </Text><Picker onValueChange={(value) => setSection(value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none" selectedValue={section} enabled={!(isSubmitting)}><Picker.Item label="Salle Standard" value="standard" /><Picker.Item label="Terrasse en plein air" value="terrace" /><Picker.Item label="Espace Salon VIP" value="vip" /><Picker.Item label="Salon Privé d'affaires" value="private_room" /></Picker>{errors.section && (
          <Text className="text-[10px] text-rose-500 flex items-center gap-1 font-semibold">
            <AlertCircle size={10} />
            {errors.section}
          </Text>
        )}</View><View className="space-y-1.5"><Text className="block text-[10px] text-white/40 uppercase font-black tracking-wider">Demandes particulières (Allergies, événement...)
        </Text><TextInput placeholder="Ex: table près de la scène d'orchestre, intolérance à l'arachide..." value={request} onChangeText={(value) => setRequest(value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none placeholder:text-white/20" multiline textAlignVertical="top" editable={!(isSubmitting)} /></View><Pressable disabled={isSubmitting || !date} className="w-full py-4 rounded-xl bg-emerald-500 disabled:bg-white/5 disabled:text-white/20 text-[#020617] font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10"><ShieldCheck size={14} />{isSubmitting
          ? "Validation de la table..."
          : "Enregistrer la Réservation"}</Pressable></View>
  );
}
