import { View, Text } from "react-native";
import React from "react";
import { CalendarX } from "lucide-react-native";

export const AccommodationPolicies: React.FC = () => {
  return (
    <View className="p-4 md:p-6 border-b border-white/5"><Text className="text-white font-semibold text-sm mb-2">Conditions d'annulation
      </Text><View className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10"><View className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0"><CalendarX size={18} /></View><View><Text className="text-xs font-semibold text-white">Annulation gratuite sous 48h
          </Text><Text className="text-[10px] text-white/50 leading-relaxed mt-0.5">Remboursement intégral en cas d'annulation effectuée jusqu'à 48
            heures avant la date d'arrivée prévue.
          </Text></View></View></View>
  );
};
