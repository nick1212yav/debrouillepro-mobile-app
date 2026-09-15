import { View, Image, Text, Pressable } from "react-native";

// src/features/sante/components/DoctorCard.tsx
import { Clock, Star, Video, Calendar } from "lucide-react-native";
import type { Doctor } from "../types/doctor.types";

export interface DoctorCardProps {
  doctor: Doctor;
  onSelect?: () => void;
  onBook?: (slot: string) => void;
  slots?: string[];
}

export function DoctorCard({
  doctor,
  onSelect,
  onBook,
  slots = [],
}: DoctorCardProps) {
  return (
    <View className="rounded-3xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }} onPress={onSelect}><View className="flex items-start gap-3"><View className="relative flex-shrink-0"><Image className="w-14 h-14 rounded-2xl object-cover" source={{ uri: doctor.images?.[0] || "" }} accessibilityLabel={doctor.name} />{doctor.online && (
            <Text className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-[#020617]" />
          )}</View><View className="flex-1 min-w-0"><Text className="text-sm font-bold text-white truncate">{doctor.name}</Text><Text className="text-xs text-red-400 font-medium capitalize">{doctor.specialty}</Text><View className="flex items-center gap-2 mt-1"><View className="flex items-center gap-0.5 text-yellow-400 text-xs"><Star size={12} fill="currentColor" /><Text>{doctor.rating.toFixed(1)}</Text></View><Text className="text-[10px] text-white/30">({doctor.reviewCount})
            </Text>{doctor.distance !== undefined && (
              <Text className="text-[10px] text-white/30">· {doctor.distance.toFixed(1)}km
              </Text>
            )}</View></View><View className="text-right flex-shrink-0"><Text className="text-sm font-black text-white">{doctor.fees}{doctor.currency}</Text><Text className="text-[10px] text-green-400 font-medium mt-0.5">{slots.length > 0 ? "Disponible" : "Indisponible"}</Text></View></View>{slots.length > 0 && (
        <View className="flex gap-1.5 mt-3 flex-wrap">{slots.slice(0, 3).map((slot) => (
            <Pressable key={slot} onPress={(e) => {
                onBook?.(slot);
              }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold active:scale-95 transition-transform" style={{ backgroundColor: "rgba(239,68,68,0.12)", borderWidth: 1, borderColor: "rgba(239,68,68,0.25)", borderStyle: "solid" }}><Clock size={9} />{slot}</Pressable>
          ))}</View>
      )}<View className="flex gap-2 mt-3"><Pressable onPress={(e) => {
            onBook?.(slots[0] || "09:00");
          }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-bold text-white active:scale-95" style={{  }}><Calendar size={13} />Prendre RDV
        </Pressable><Pressable onPress={(e) => e.stopPropagation()} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs active:scale-95" style={{ backgroundColor: "rgba(59,130,246,0.18)", borderWidth: 1, borderColor: "rgba(59,130,246,0.3)", borderStyle: "solid" }}><Video size={14} className="text-blue-400" /></Pressable></View></View>
  );
}
