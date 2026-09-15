import { View, Text, TextInput, Pressable, NativeSyntheticEvent } from "react-native";
import { useState } from "react";
import {
  Users,
  Clock,
  MessageSquare,
  ShieldCheck,
  Compass,
} from "lucide-react-native";
import { ReservationCalendar } from "./ReservationCalendar";

interface ReservationFormProps {
  onSubmit: (data: {
    date: string;
    time: string;
    guestsCount: number;
    section: string;
    specialRequest?: string;
  }) => void;
  isSubmitting: boolean;
}

export function ReservationForm({
  onSubmit,
  isSubmitting,
}: ReservationFormProps) {
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [time, setTime] = useState<string>("20:00");
  const [guestsCount, setGuestsCount] = useState<number>(2);
  const [section, setSection] = useState<string>("standard");
  const [specialRequest, setSpecialRequest] = useState<string>("");

  const sections = [
    { id: "standard", label: "Salle Standard" },
    { id: "terrace", label: "Terrasse" },
    { id: "vip", label: "Espace VIP" },
    { id: "private_room", label: "Salon Privé" },
  ];

  const handleFormSubmit = (e: NativeSyntheticEvent<any>) => {
    e.preventDefault();
    if (!date || !time) return;
    onSubmit({
      date,
      time,
      guestsCount,
      section,
      specialRequest: specialRequest.trim(),
    });
  };

  return (
    <View className="space-y-4 text-left p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04]">{}<ReservationCalendar selectedDate={date} onChange={setDate} />{}<View><Text className="block text-[10px] text-white/40 uppercase font-bold mb-1.5 flex items-center gap-1"><Clock size={12} />Heure d'arrivée
        </Text><View className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10"><TextInput value={time} onChangeText={(value) => setTime(value)} className="flex-1 bg-transparent text-xs text-white outline-none" required editable={!(isSubmitting)} /></View></View>{}<View><Text className="block text-[10px] text-white/40 uppercase font-bold mb-1.5 flex items-center gap-1"><Users size={12} />Nombre de couverts
        </Text><View className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2"><Text className="flex-1 text-xs font-semibold text-white/80">{guestsCount}personnes
          </Text><View className="flex items-center gap-2"><Pressable onPress={() => setGuestsCount(Math.max(1, guestsCount - 1))} disabled={isSubmitting} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center font-bold text-white"><Text>-</Text></Pressable><Pressable onPress={() => setGuestsCount(guestsCount + 1)} disabled={isSubmitting} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center font-bold text-white"><Text>+</Text></Pressable></View></View></View>{}<View><Text className="block text-[10px] text-white/40 uppercase font-bold mb-1.5 flex items-center gap-1"><Compass size={12} />Emplacement de la table
        </Text><View className="gap-2">{sections.map((sec) => (
            <Pressable key={sec.id} onPress={() => setSection(sec.id)} disabled={isSubmitting} className={`p-2.5 rounded-xl border text-xs font-black text-center transition-all cursor-pointer ${
                section === sec.id
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-white/5 border-white/5 text-white/40"
              }`}>
              {sec.label}
            </Pressable>
          ))}</View></View>{}<View><Text className="block text-[10px] text-white/40 uppercase font-bold mb-1.5 flex items-center gap-1"><MessageSquare size={12} />Demandes particulières
        </Text><TextInput value={specialRequest} onChangeText={(value) => setSpecialRequest(value)} placeholder="Ex: table en terrasse abritée, allergies, célébration d'anniversaire..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-emerald-500/50 placeholder:text-white/20" multiline textAlignVertical="top" editable={!(isSubmitting)} /></View><Pressable disabled={isSubmitting || !date || !time} className="w-full py-4 rounded-xl bg-emerald-500 disabled:bg-white/5 disabled:text-white/25 text-[#020617] font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10"><ShieldCheck size={14} />{isSubmitting
          ? "Enregistrement de la table..."
          : "Confirmer la Réservation"}</Pressable></View>
  );
}
