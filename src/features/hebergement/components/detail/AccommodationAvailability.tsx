import { View, Text } from "react-native";
import React from "react";
import { CalendarRange } from "lucide-react-native";

export const AccommodationAvailability: React.FC = () => {
  return (
    <View className="p-4 md:p-6 border-b border-white/5">
      <Text className="text-white font-semibold text-sm mb-2.5">Disponibilité</Text>
      <View className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
        <View className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
          <CalendarRange size={18} />
        </View>
        <View className="flex-1 flex flex-col gap-0.5">
          <Text className="text-xs font-semibold text-white"><Text>Calendrier à jour</Text></Text>
          <Text className="text-[10px] text-white/50">
            <Text>Dernière mise à jour effectuée il y a 2 heures.</Text></Text>
        </View>
      </View>
    </View>
  );
};
